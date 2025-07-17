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

export function parseProfile(profilePath) {
  const profileXml = readXml(profilePath);
  if (!profileXml || !profileXml.Profile) return null;
  const profile = profileXml.Profile;

  // Helper to always return array
  const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

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
