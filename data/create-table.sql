BEGIN;

DROP TABLE IF EXISTS "company", "product", "client";

CREATE TABLE "company" (
  "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "suffix" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "site" TEXT NOT NULL,
  UNIQUE ("suffix", "name")
);

CREATE TABLE "product" (
  "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "color" TEXT,
  "price" TEXT NOT NULL,
  "company_id" INT REFERENCES "company"("id")
);

CREATE TABLE "client" (
  "uuid" TEXT AS IDENTITY PRIMARY KEY,
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

COMMIT;