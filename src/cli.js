import "dotenv/config";
import path from "path";
import { parseProfile } from "./parser/profileParser.js";
import { syncProfileToDb } from "./sync.js";
import { syncProfileToNotion } from "./notion/sync.js";
import { parseProfileChunked } from "./parser/profileParser.js";

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
    // Use chunked parser and flatten chunks for Notion sync
    const parsedChunked = await parseProfileChunked(profilePath, 100);
    if (!parsedChunked) {
      console.error("Failed to parse profile XML.");
      return;
    }
    // Flatten all chunked arrays for Notion sync compatibility
    const flattenChunks = (chunks) =>
      Object.fromEntries(Object.entries(chunks).map(([k, v]) => [k, v.flat()]));
    const parsed = {
      ...parsedChunked,
      ...flattenChunks(parsedChunked.chunks),
    };
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
