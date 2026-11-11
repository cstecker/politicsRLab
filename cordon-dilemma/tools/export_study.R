# Aggregiert lokale Replikationsdaten; exportiert keine Individualdaten.
# Aufruf: Rscript cordon-dilemma/tools/export_study.R <Replikationsordner>
args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1L) stop("Bitte den lokalen Replikationsordner angeben.")
required <- c("dplyr", "tidyr", "jsonlite", "cregg")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) stop("Fehlende Pakete: ", paste(missing, collapse = ", "))
suppressPackageStartupMessages(library(dplyr))

source_dir <- normalizePath(args[[1]], winslash = "/", mustWork = TRUE)
script_arg <- grep("^--file=", commandArgs(), value = TRUE)
app_dir <- dirname(dirname(normalizePath(sub("^--file=", "", script_arg), winslash = "/")))
survey_all <- readRDS(file.path(source_dir, "data/survey.rds"))
survey <- survey_all |>
  filter(attention_check == "passed (= stimme eher zu)")
cj <- readRDS(file.path(source_dir, "data/survey_cj.rds")) |>
  filter(ResponseId %in% survey$ResponseId)

# Dieselbe Complete-case-Auswahl wie cj_df im Replikations-Rmd.
analysis_vars <- c(
  "ResponseId", "survey_bland", "vote_ltw2", "selfpos_immi",
  "coalpref1_afdnormalparty", "skalo_parties_afd", "cjround", "cjprofile",
  "cj_elect", "cj_skalo", "cj_age", "cj_geschlecht", "cj_experience",
  "cj_immi", "cj_redis", "cj_ukraine", "cj_afdtreatment"
)
dat <- cj |>
  select(all_of(analysis_vars)) |>
  tidyr::drop_na() |>
  mutate(
    party_camp = case_when(
      vote_ltw2 == "cdu" ~ "cdu",
      vote_ltw2 == "afd" ~ "afd",
      vote_ltw2 %in% c("pds", "gru", "spd") ~ "leftbloc",
      TRUE ~ NA_character_
    ),
    region = if_else(survey_bland == "Westdeutschland", "west", "east"),
    # Die Replikation ordnet auch teils/teils der nicht zustimmenden Gruppe zu.
    norm = if_else(coalpref1_afdnormalparty %in% c("stimme eher zu", "stimme voll zu"), "agree", "other"),
    migration = if_else(selfpos_immi %in% c("stimme eher zu", "stimme voll zu"), "agree", "other")
  )
features <- c("cj_age", "cj_geschlecht", "cj_experience", "cj_immi", "cj_redis", "cj_ukraine", "cj_afdtreatment")
choice_formula <- reformulate(features, "cj_elect")
rating_formula <- reformulate(features, "cj_skalo")

estimate_mm <- function(data, outcome = "choice") {
  formula <- if (outcome == "choice") choice_formula else rating_formula
  cregg::cj(data, formula, estimate = "mm", id = ~ ResponseId) |>
    as.data.frame() |>
    select(feature, level, estimate, lower, upper) |>
    mutate(across(c(feature, level), as.character))
}
estimates <- list()
add_estimates <- function(data, group, outcome = "choice", region = "all", moderator = "none", category = "all") {
  if (nrow(data) == 0L) return(invisible(NULL))
  result <- estimate_mm(data, outcome) |>
    mutate(group = group, outcome = outcome, region = region, moderator = moderator, category = category,
           n_profiles = nrow(data), n_people = n_distinct(data$ResponseId))
  estimates[[length(estimates) + 1L]] <<- result
}
for (outcome in c("choice", "rating")) {
  add_estimates(dat, "all", outcome)
  for (group in c("leftbloc", "cdu", "afd")) {
    add_estimates(filter(dat, party_camp == group), group, outcome)
  }
}
for (region_value in c("all", "east", "west")) {
  regional <- if (region_value == "all") dat else filter(dat, region == region_value)
  for (group in c("leftbloc", "cdu", "afd")) {
    group_dat <- filter(regional, party_camp == group)
    for (moderator_value in c("norm", "migration")) {
      for (category_value in c("agree", "other")) {
        add_estimates(
          filter(group_dat, .data[[moderator_value]] == category_value), group,
          region = region_value, moderator = moderator_value, category = category_value
        )
      }
    }
  }
}

agreement_vars <- c("coalpref1_content", "coalpref1_afdnormalparty", "selfpos_immi2", "selfpos_immi", "selfpos_redis", "selfpos_ukraine")
agreement <- survey |>
  mutate(group = as.character(vote_ltw2)) |>
  select(group, all_of(agreement_vars)) |>
  tidyr::pivot_longer(-group, names_to = "item", values_to = "response") |>
  filter(!is.na(response)) |>
  count(group, item, response, .drop = TRUE) |>
  group_by(group, item) |>
  mutate(total = sum(n), share = n / total) |>
  ungroup()
party_ratings <- survey |>
  mutate(group = case_when(
    vote_ltw2 == "cdu" ~ "cdu", vote_ltw2 == "afd" ~ "afd",
    vote_ltw2 %in% c("pds", "gru", "spd") ~ "leftbloc", TRUE ~ NA_character_
  )) |>
  filter(!is.na(group)) |>
  select(group, starts_with("skalo_parties_")) |>
  tidyr::pivot_longer(-group, names_to = "party", values_to = "rating") |>
  group_by(group, party) |>
  summarise(mean = mean(rating, na.rm = TRUE), n = sum(!is.na(rating)), .groups = "drop")

pairs <- dat |>
  group_by(ResponseId, cjround) |>
  summarise(n = n(), chosen = sum(cj_elect), .groups = "drop")
stopifnot(all(pairs$n == 2L), all(pairs$chosen == 1), nrow(dat) == nrow(pairs) * 2L)
counts <- dat |>
  count(cj_afdtreatment, wt = cj_elect, name = "selected") |>
  left_join(count(dat, cj_afdtreatment, name = "profiles"), by = "cj_afdtreatment") |>
  mutate(mean = selected / profiles)
mm <- estimate_mm(dat) |> filter(feature == "cj_afdtreatment")
stopifnot(max(abs(mm$estimate - counts$mean[match(mm$level, counts$cj_afdtreatment)])) < 1e-10)

meta <- list(
  title = "The Cordon Dilemma: How Voters Evaluate Cooperation with the Far-Right in Parliament",
  authors = c("Martin Gross", "Christina-Marie Juen", "Christian Stecker"),
  doi = "10.1177/00104140261448429", generated = as.character(Sys.Date()),
  source = "Lokales Replikationspaket; Daten unverändert; Bereinigung wie cj_df im Replikations-Rmd",
  attention_pass = nrow(survey), conjoint_people = n_distinct(dat$ResponseId),
  profiles = nrow(dat), pairs = nrow(pairs), choice_non_missing_before_complete_case = sum(!is.na(cj$cj_elect)),
  removed_rows_complete_case = nrow(cj) - nrow(dat),
  regions = as.data.frame(table(survey$survey_bland)),
  group_people = dat |> distinct(ResponseId, party_camp) |> count(party_camp),
  missing_policy = "drop_na auf 17 Replikationsvariablen; Missingness der Bewertung schließt auch Wahlzeilen aus",
  uncertainty = "cregg::cj(estimate = 'mm', id = ~ ResponseId); 95%-Konfidenzintervalle; nach Person geclustert",
  software = list(R = as.character(getRversion()), cregg = as.character(packageVersion("cregg"))),
  source_md5 = as.list(tools::md5sum(file.path(source_dir, c("data/survey.rds", "data/survey_cj.rds"))))
)
# Maschinenpfade durch neutrale Quelldateinamen ersetzen.
names(meta$source_md5) <- c("survey.rds", "survey_cj.rds")
payload <- list(meta = meta, estimates = bind_rows(estimates), agreement = agreement, party_ratings = party_ratings, counts = counts)
dest <- file.path(app_dir, "site/study-data.js")
dir.create(dirname(dest), recursive = TRUE, showWarnings = FALSE)
content <- paste0("// Generiert durch tools/export_study.R; nur Aggregate.\nwindow.CORDON_STUDY = ",
                  jsonlite::toJSON(payload, auto_unbox = TRUE, dataframe = "rows", digits = 10, na = "null"), ";\n")
writeBin(charToRaw(enc2utf8(content)), dest)
cat("Export:", nrow(dat), "Profilzeilen;", n_distinct(dat$ResponseId), "Personen;", length(estimates), "Schätzungen.\n")
print(counts)
