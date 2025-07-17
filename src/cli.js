import "dotenv/config";
import path from "path";
import { parseProfile } from "./parser/profileParser.js";
import { syncProfileToDb } from "./sync.js";
import { syncProfileToNotion } from "./notion/sync.js";

async function main() {
  const arg = process.argv[2];
  if (arg === "sync-profile-db") {
    const profilePath = process.argv[3];
    if (!profilePath) {
      console.error(
        "Usage: node src/cli.js sync-profile-db <Profile XML path>"
      );
      return;
    }
    const parsed = parseProfile(profilePath);
    if (!parsed) {
      console.error("Failed to parse profile XML.");
      return;
    }
    const api_name = profilePath
      .split(/[\/]/)
      .pop()
      .replace(/\.profile-meta\.xml$/, "");
    const label = parsed.raw.label || api_name;
    const description = parsed.raw.description || "";
    await syncProfileToDb(parsed, api_name, label, description);
    console.log("Profile synced to DB.");
  } else if (arg === "sync-profile-notion") {
    const profilePath = process.argv[3];
    if (!profilePath) {
      console.error(
        "Usage: node src/cli.js sync-profile-notion <Profile XML path>"
      );
      return;
    }
    const parsed = parseProfile(profilePath);
    if (!parsed) {
      console.error("Failed to parse profile XML.");
      return;
    }
    const api_name = profilePath
      .split(/[\/]/)
      .pop()
      .replace(/\.profile-meta\.xml$/, "");
    const label = parsed.raw.label || api_name;
    const description = parsed.raw.description || "";
    await syncProfileToNotion(parsed, api_name, label, description);
    console.log("Profile synced to Notion.");
  } else {
    console.log("Usage:");
    console.log("  node src/cli.js sync-profile-db <Profile XML path>");
    console.log("  node src/cli.js sync-profile-notion <Profile XML path>");
  }
}

main();
