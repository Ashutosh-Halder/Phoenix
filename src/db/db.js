import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve("sfmeta.db");
const SCHEMA_PATH = path.resolve("src/db/schema.sql");

export async function getDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  // Run schema if first time
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  await db.exec(schema);
  return db;
}
