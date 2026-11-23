# Reproduziert Abb. 1 aus der OSF-Datei und verarbeitet die im Aufsatz
# berichteten Aggregate. Aufruf und Herkunft stehen in QUELLEN.md.
args <- commandArgs(trailingOnly = TRUE)
stopifnot(length(args) <= 1L)
if (length(args)) {
  mp_path <- args[[1L]]
} else {
  mp_path <- tempfile(fileext = ".rds")
  download.file("https://osf.io/download/zyhvw/", mp_path, mode = "wb")
}
stopifnot(unname(tools::md5sum(mp_path)) == "38c07a71a1a225122bce63db919d9130")
mp <- readRDS(mp_path)
stopifnot(all(na.omit(mp$educ_low) %in% 0:1), !anyNA(mp$electionyear))

# Eine Person kann in mehreren Wahlperioden vorkommen. Fehlende Bildung
# bleibt im Gesamtbestand (total), aber außerhalb des Anteilsnenners (n).
history <- do.call(rbind, lapply(split(mp$educ_low, mp$electionyear), function(x) {
  data.frame(value = 100 * mean(x, na.rm = TRUE), n = sum(!is.na(x)), total = length(x))
}))
history$year <- as.integer(rownames(history))
rownames(history) <- NULL
history <- history[order(history$year), c("year", "value", "n", "total")]

# Gegenprobe an der auf zwei Dezimalstellen gerundeten Spalte „Non-graduates“
# in Tabelle A1 des veröffentlichten Anhangs, S. 5.
appendix_percent <- c(35, 27, 24, 21, 20, 15, 14, 13, 13, 11, 11, 9, 11, 9, 9)
stopifnot(identical(round(history$value), as.double(appendix_percent)),
          sum(history$total) == 9569L, sum(history$n) == 9406L)

reported <- function(id, label, value) {
  data.frame(id, label, value, low = NA_real_, high = NA_real_)
}
elected <- reported(
  c("unsafe", "contested", "safe"), c("Unsicher", "Umkämpft", "Sicher"), c(6, 53, 93)
)
# S. 33 beschreibt den Anteil mit Mandat innerhalb der Nominierungskategorie.
observed <- reported(c("unsafe", "safe"), c("Unsicher", "Sicher"), c(3, 70))
model <- reported(
  c("education", "reference", "career"),
  c("Ohne tertiäre Bildung", "Vergleichsprofil", "Politiknahe Laufbahn"),
  c(67, 76, 84)
)

# Tabelle A2, S. 6, Spalte „Full Model“. Separate Odds-Ratio-Intervalle,
# da eine Kovarianzmatrix für absolute Profilwahrscheinlichkeiten fehlt.
beta <- c(-0.413, 0.491)
se <- c(0.187, 0.203)
half_width <- qnorm(0.975) * se
odds_ratios <- data.frame(
  id = model$id[c(1, 3)], label = model$label[c(1, 3)],
  value = exp(beta), low = exp(beta - half_width), high = exp(beta + half_width)
)

# Im proportionalen Odds-Modell gilt für die höchste Kategorie
# logit(p_Gruppe) = logit(p_Referenz) + beta. Die Rundungsbereiche der
# drei publizierten Prozentwerte müssen einen gemeinsamen Basiswert zulassen.
shift <- c(beta[1], 0, beta[2])
reference_bounds <- function(offset) plogis(qlogis((model$value + offset) / 100) - shift)
stopifnot(max(reference_bounds(-0.5)) < min(reference_bounds(0.5)))

study <- list(history = history, elected = elected, observed = observed,
              model = model, oddsRatios = odds_ratios)
script_arg <- grep("^--file=", commandArgs(), value = TRUE)
site_dir <- file.path(dirname(normalizePath(sub("^--file=", "", script_arg))), "..", "site")
json <- jsonlite::toJSON(study, pretty = TRUE, digits = 6, na = "null")
script <- enc2utf8(paste0("window.BUNDESTAG_STUDY = ", json, ";\n"))
writeBin(charToRaw(script), file.path(site_dir, "study-data.js"))
