#!/usr/bin/env Rscript

# src/analysis.R
# Lit tous les JSON dans ../data et produit 3 CSV dans ../expe

library(jsonlite)

data_dir <- "../data"
out_dir  <- "../expe"

if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

files <- list.files(data_dir, pattern = "\\.json$", full.names = TRUE)
if (length(files) == 0) stop("Aucun .json dans ", data_dir)

# Helpers simples
as_root <- function(x) {
  # ton JSON est souvent un tableau avec 1 élément: [ { ... } ]
  if (is.list(x) && length(x) > 0 && is.list(x[[1]]) && !is.null(x[[1]]$test)) return(x[[1]])
  x
}

hand_map <- function(x) {
  if (is.null(x) || is.na(x)) return(NA_character_)
  x <- tolower(trimws(as.character(x)))
  if (grepl("droit", x)) return("right")
  if (grepl("gauch", x)) return("left")
  NA_character_
}

congruency <- function(mot, bonne) {
  if (is.null(mot) || is.null(bonne) || is.na(mot) || is.na(bonne)) return(NA_character_)
  if (as.character(mot) == as.character(bonne)) "congruent" else "incongruent"
}

err_flag <- function(correct) {
  if (is.null(correct) || is.na(correct)) return(NA_character_)
  if (isTRUE(correct)) "no" else "yes"
}

prop_congr <- function(root, trial) {
  # si absent pour l’instant -> NA
  pc <- trial[["prop_congr"]]
  if (is.null(pc)) pc <- root[["prop_congr"]]
  if (is.null(pc) || is.na(pc)) return(NA_character_)
  as.character(pc)
}

# Mesures simples depuis mousePath
measures <- function(mousePath, threshold_px = 5) {
  if (is.null(mousePath) || length(mousePath) < 2) {
    return(list(IT=NA_real_, MT=NA_real_, AUC=NA_real_,
                sx=NA_real_, sy=NA_real_, ex=NA_real_, ey=NA_real_))
  }

  x <- vapply(mousePath, \(p) as.numeric(p$x), numeric(1))
  y <- vapply(mousePath, \(p) as.numeric(p$y), numeric(1))
  t <- vapply(mousePath, \(p) as.numeric(p$t), numeric(1))

  sx <- x[1]; sy <- y[1]
  ex <- x[length(x)]; ey <- y[length(y)]

  d <- sqrt((x - sx)^2 + (y - sy)^2)
  onset <- which(d >= threshold_px)[1]
  if (is.na(onset)) onset <- 1

  IT <- t[onset] - t[1]
  MT <- t[length(t)] - t[onset]

  # AUC 
  vx <- ex - sx; vy <- ey - sy
  denom <- sqrt(vx^2 + vy^2)
  if (denom == 0) {
    AUC <- 0
  } else {
    d_perp <- ((x - sx) * vy - (y - sy) * vx) / denom
    AUC <- sum(abs(d_perp), na.rm = TRUE)
  }

  list(IT=IT, MT=MT, AUC=AUC, sx=sx, sy=sy, ex=ex, ey=ey)
}

participants <- data.frame()
results      <- data.frame()
screen       <- data.frame()

for (f in files) {
  raw  <- fromJSON(f, simplifyVector = FALSE)
  root <- as_root(raw)

  pid <- tools::file_path_sans_ext(basename(f))

  # participants.csv
  participants <- rbind(participants, data.frame(
    id = pid,
    age = suppressWarnings(as.numeric(root$age)),
    genre = if (!is.null(root$genre)) as.character(root$genre) else NA_character_,
    handedness = hand_map(root$lateralite),
    stringsAsFactors = FALSE
  ))

  if (is.null(root$test) || length(root$test) == 0) next

  for (tr in root$test) {
    m <- measures(tr$mousePath)

    # results.csv
    results <- rbind(results, data.frame(
      participant = pid,
      color = if (!is.null(tr$bonneReponse)) as.character(tr$bonneReponse) else NA_character_,
      congruency = congruency(tr$mot, tr$bonneReponse),
      prop.congr = prop_congr(root, tr),
      error = err_flag(tr$correct),
      IT = m$IT,
      MT = m$MT,
      AUC = m$AUC,
      stringsAsFactors = FALSE
    ))

    # screen.csv
    screen <- rbind(screen, data.frame(
      participant = pid,
      start.x = m$sx, start.y = m$sy,
      end.x   = m$ex, end.y   = m$ey,
      stringsAsFactors = FALSE
    ))
  }
}

# évite doublons si relancé
participants <- participants[!duplicated(participants$id), , drop = FALSE]

write.csv(participants, file.path(out_dir, "participants.csv"), row.names = FALSE)
write.csv(screen,       file.path(out_dir, "screen.csv"),       row.names = FALSE)
write.csv(results,      file.path(out_dir, "results.csv"),      row.names = FALSE)

cat("OK -> CSV générés dans", normalizePath(out_dir), "\n")
