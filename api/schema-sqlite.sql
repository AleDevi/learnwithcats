-- Same tables for local development with SQLite.
CREATE TABLE IF NOT EXISTS cats (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL, owner TEXT NOT NULL,
  owner_name TEXT NOT NULL, src_lang TEXT NOT NULL, born INTEGER NOT NULL, lifespan INTEGER NOT NULL,
  species TEXT, mother TEXT, father TEXT, litter TEXT, data TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS by_born ON cats (born);
CREATE INDEX IF NOT EXISTS by_owner ON cats (owner);
CREATE INDEX IF NOT EXISTS by_litter ON cats (litter);
CREATE TABLE IF NOT EXISTS reports (
  cat TEXT NOT NULL, reporter TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (cat, reporter)
);
