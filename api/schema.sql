-- LearnWithCats shared world, MySQL / MariaDB.
-- Run once, for example from phpMyAdmin in the IONOS control panel.

CREATE TABLE IF NOT EXISTS cats (
  id CHAR(16) NOT NULL PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  name_key VARCHAR(40) NOT NULL,
  owner CHAR(64) NOT NULL,
  owner_name VARCHAR(40) NOT NULL,
  src_lang VARCHAR(12) NOT NULL,
  born INT NOT NULL,
  lifespan INT NOT NULL,
  species VARCHAR(16) NULL,
  mother CHAR(16) NULL,
  father CHAR(16) NULL,
  litter VARCHAR(48) NULL,
  data TEXT NOT NULL,
  hidden TINYINT NOT NULL DEFAULT 0,
  created INT NOT NULL,
  INDEX by_born (born),
  INDEX by_owner (owner),
  INDEX by_name (name_key),
  INDEX by_litter (litter),
  INDEX by_mother (mother)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  cat CHAR(16) NOT NULL,
  reporter CHAR(64) NOT NULL,
  created INT NOT NULL,
  PRIMARY KEY (cat, reporter)
) DEFAULT CHARSET = utf8mb4;
