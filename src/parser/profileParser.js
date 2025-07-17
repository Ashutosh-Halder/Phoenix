import fs from "fs";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
});

function readXml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const xml = fs.readFileSync(filePath, "utf-8");
  return parser.parse(xml);
}

// Helper to always return array
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Generator to yield chunks of an array
function* chunkArray(array, chunkSize) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

// Main chunked parser: processes large arrays in batches, stores in-memory
export async function parseProfileChunked(
  profilePath,
  batchSize = 100,
  onChunk
) {
  const profileXml = readXml(profilePath);
  if (!profileXml || !profileXml.Profile) return null;
  const profile = profileXml.Profile;

  // List of subcomponents to chunk
  const subcomponents = [
    "applicationVisibilities",
    "classAccesses",
    "fieldPermissions",
    "objectPermissions",
    "userPermissions",
    "layoutAssignments",
    "recordTypeVisibilities",
    "tabVisibilities",
    "pageAccesses",
    "flowAccesses",
  ];

  // Store all parsed data in-memory (could be swapped for DB/file)
  const parsedChunks = {};

  for (const key of subcomponents) {
    const items = arr(profile[key]);
    parsedChunks[key] = [];
    if (items.length === 0) continue;
    for (const chunk of chunkArray(items, batchSize)) {
      parsedChunks[key].push(chunk);
      if (onChunk) await onChunk(key, chunk); // Callback for each chunk
    }
  }

  // Return all chunks for further processing
  return {
    label: profile.custom ? profile.custom : undefined,
    chunks: parsedChunks,
    raw: profile,
  };
}

// Legacy: parse all at once (for compatibility)
export function parseProfile(profilePath) {
  const profileXml = readXml(profilePath);
  if (!profileXml || !profileXml.Profile) return null;
  const profile = profileXml.Profile;
  return {
    label: profile.custom ? profile.custom : undefined,
    applicationVisibilities: arr(profile.applicationVisibilities),
    classAccesses: arr(profile.classAccesses),
    fieldPermissions: arr(profile.fieldPermissions),
    objectPermissions: arr(profile.objectPermissions),
    userPermissions: arr(profile.userPermissions),
    layoutAssignments: arr(profile.layoutAssignments),
    recordTypeVisibilities: arr(profile.recordTypeVisibilities),
    tabVisibilities: arr(profile.tabVisibilities),
    pageAccesses: arr(profile.pageAccesses),
    flowAccesses: arr(profile.flowAccesses),
    // Add more as needed
    raw: profile,
  };
}

// CLI/test entrypoint
if (
  import.meta &&
  import.meta.url &&
  process.argv[1] &&
  process.argv[1].endsWith("profileParser.js")
) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node src/parser/profileParser.js <profile-xml-file>");
    process.exit(1);
  }
  (async () => {
    let total = {};
    await parseProfileChunked(file, 100, (key, chunk) => {
      total[key] = (total[key] || 0) + chunk.length;
      console.log(`[CHUNK] ${key}: ${chunk.length} items`);
    });
    console.log("---");
    Object.entries(total).forEach(([k, v]) =>
      console.log(`[SUMMARY] ${k}: ${v} items`)
    );
  })();
}
