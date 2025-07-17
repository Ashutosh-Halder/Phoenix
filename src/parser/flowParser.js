import fs from "fs";
import path from "path";
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

export function parseFlow(flowFilePath) {
  const flowXml = readXml(flowFilePath);
  if (!flowXml || !flowXml.Flow) return null;
  const flow = flowXml.Flow;

  // Extract key fields
  const api_name = path.basename(flowFilePath).replace(/\.flow-meta\.xml$/, "");
  const label = flow.label || api_name;
  const description = flow.description || "";
  const status = flow.status || "";
  const process_type = flow.processType || "";

  // Extract subcomponents (decisions, recordUpdates, etc.)
  const decisions = flow.decisions || [];
  const recordUpdates = flow.recordUpdates || [];
  const start = flow.start || {};

  // Extract object and operator from start
  const object = start.object || null;
  let operator = null;
  if (
    start.filters &&
    Array.isArray(start.filters) &&
    start.filters.length > 0
  ) {
    operator = start.filters[0].operator || null;
  } else if (start.filters && start.filters.operator) {
    // If filters is a single object
    operator = start.filters.operator || null;
  }

  return {
    api_name,
    label,
    description,
    status,
    process_type,
    decisions,
    recordUpdates,
    start,
    object,
    operator,
    details: flow,
  };
}
