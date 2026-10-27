# Wahlsystemlabor: AMCE mit nach Personen geclusterten Standardfehlern.
# Nur R-Basispakete. CSV-Export enthält beide Profile jeder Entscheidung.
# Aufruf: Rscript auswertung.R daten.csv [ergebnisdatei.csv] [0.90]
# Referenzen: Jankowski/Linhart/Tepe 2019, S. 230–234;
# Hainmueller/Hopkins/Yamamoto 2014, doi:10.1093/pan/mpt024.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 1L) {
  stop("Aufruf: Rscript auswertung.R daten.csv [ergebnisdatei.csv] [0.90]")
}
confidence <- if (length(args) >= 3L) as.numeric(args[[3]]) else 0.90
if (is.na(confidence) || confidence <= 0 || confidence >= 1) {
  stop("Konfidenzniveau muss zwischen 0 und 1 liegen.")
}
data <- read.csv(args[[1]], fileEncoding = "UTF-8-BOM", stringsAsFactors = FALSE)
attributes <- c("parties", "majorities", "acceptance", "proportionality", "candidates", "simplicity")
level_counts <- c(3L, 4L, 3L, 4L, 2L, 4L)
references <- c(2L, 0L, 0L, 0L, 0L, 0L)
required <- c("source", "design_version", "respondent", "task", "profile", "chosen", attributes)
if (!all(required %in% names(data)) || nrow(data) == 0L) stop("Erforderliche Profilspalten fehlen oder die Datei ist leer.")
if (anyNA(data[required])) stop("Fehlende Werte: keine Zeilen stillschweigend entfernen.")
if (length(unique(data$source)) != 1L || length(unique(data$design_version)) != 1L) {
  stop("Daten verschiedener Quellen oder Designversionen getrennt auswerten.")
}
if (unique(data$design_version) != "jlt2019-teaching-v1") stop("Unbekannte Designversion.")
if (!all(data$chosen %in% 0:1) || !all(data$profile %in% c("A", "B")) ||
    !all(data$task %in% 1:5)) stop("Ungültige Auswahl-, Profil- oder Aufgabenwerte.")
pair_id <- interaction(data$respondent, data$task, drop = TRUE)
pairs <- split(data, pair_id)
if (any(vapply(pairs, function(x) nrow(x) != 2L || sum(x$chosen) != 1L ||
               !setequal(x$profile, c("A", "B")), logical(1)))) {
  stop("Jeder Paarvergleich muss beide Profile und genau eine Auswahl enthalten.")
}
person_rows <- table(data$respondent)
if (any(person_rows != 10L)) stop("Für jede Person werden alle fünf vollständigen Paarvergleiche benötigt.")

# Die Behandlungskodierung entspricht der Browserauswertung.
term_map <- data.frame(attribute = character(), level = integer(), term = character())
for (i in seq_along(attributes)) {
  attribute <- attributes[[i]]
  values <- data[[attribute]]
  if (!all(values %in% seq.int(0L, level_counts[[i]] - 1L))) stop("Unbekannte Merkmalsausprägung: ", attribute)
  levels <- c(references[[i]], setdiff(seq.int(0L, level_counts[[i]] - 1L), references[[i]]))
  data[[attribute]] <- factor(values, levels = levels)
  term_map <- rbind(term_map, data.frame(
    attribute = attribute,
    level = levels[-1L],
    term = paste0(attribute, levels[-1L])
  ))
}
fit <- lm(reformulate(attributes, response = "chosen"), data = data,
          na.action = na.fail, contrasts = setNames(rep(list("contr.treatment"), length(attributes)), attributes))
x <- model.matrix(fit)
n <- nrow(x)
k <- ncol(x)
g <- length(unique(data$respondent))
if (g < 20L) stop("Für die Ergebnisdemo mindestens 20 Personen verwenden.")
if (fit$rank != k) stop("Modell ist nicht eindeutig schätzbar: Ausprägungen fehlen oder sind kollinear.")

# Cluster-Sandwich: innerhalb jeder Person aufsummierte Scores.
cluster_scores <- rowsum(x * residuals(fit), group = data$respondent)
bread <- solve(crossprod(x))
correction <- g / (g - 1) * (n - 1) / (n - k)
vcov_cr1 <- correction * bread %*% crossprod(cluster_scores) %*% bread
se <- sqrt(diag(vcov_cr1))
critical <- qt((1 + confidence) / 2, df = g - 1)
terms <- term_map$term
result <- transform(term_map[c("attribute", "level")],
                    estimate = unname(coef(fit)[terms]),
                    se = unname(se[terms]),
                    low = unname(coef(fit)[terms] - critical * se[terms]),
                    high = unname(coef(fit)[terms] + critical * se[terms]))
cat("Quelle:", unique(data$source), "\nPersonen:", g, "Profilzeilen:", n,
    "\nKonfidenzniveau:", confidence, "\nEffekte in Wahrscheinlichkeitseinheiten; × 100 = Prozentpunkte.\n")
print(result, row.names = FALSE)
if (length(args) >= 2L) write.csv(result, args[[2]], row.names = FALSE, fileEncoding = "UTF-8")
