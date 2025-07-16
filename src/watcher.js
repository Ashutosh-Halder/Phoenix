import chokidar from "chokidar";
import path from "path";
import { parseObject } from "./parser/objectParser.js";
import { syncObjectToDb } from "./sync.js";
import { syncObjectToNotion } from "./notion/sync.js";

const opportunityDir = path.resolve("Opportunity");

async function onChange(event, filePath) {
  console.log(`[${new Date().toISOString()}] ${event}: ${filePath}`);
  const parsed = parseObject(opportunityDir);
  console.log("Re-parsed Opportunity object. Syncing to DB...");
  await syncObjectToDb(parsed);
  console.log("Sync complete.");
  await syncObjectToNotion(parsed);
  // TODO: Integrate with Notion sync
}

const watcher = chokidar.watch(opportunityDir, {
  persistent: true,
  ignoreInitial: true,
  depth: 3,
});

watcher
  .on("add", (filePath) => onChange("add", filePath))
  .on("change", (filePath) => onChange("change", filePath))
  .on("unlink", (filePath) => onChange("unlink", filePath));

console.log(`Watching for changes in ${opportunityDir}...`);
