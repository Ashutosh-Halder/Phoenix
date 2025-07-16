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

export function parseObject(objectDir) {
  // 1. Parse main object XML
  const objectMetaPath = path.join(
    objectDir,
    path.basename(objectDir) + ".object-meta.xml"
  );
  const objectMeta = readXml(objectMetaPath)?.CustomObject || {};

  // Extract api_name, label, description
  const api_name = path.basename(objectDir);
  const label = objectMeta.label || api_name;
  const description = objectMeta.description || "";

  // 2. Parse fields
  const fieldsDir = path.join(objectDir, "fields");
  let fields = [];
  if (fs.existsSync(fieldsDir)) {
    fields = fs
      .readdirSync(fieldsDir)
      .filter((f) => f.endsWith(".field-meta.xml"))
      .map((f) => {
        const fieldXml = readXml(path.join(fieldsDir, f));
        if (!fieldXml) return null;
        const field = fieldXml.CustomField || {};
        return {
          api_name: field.fullName || f.replace(".field-meta.xml", ""),
          label: field.label || field.fullName || "",
          type: field.type || "",
          description: field.description || "",
          details: field,
        };
      })
      .filter(Boolean);
  }

  // 3. Parse record types
  const rtDir = path.join(objectDir, "recordTypes");
  let recordTypes = [];
  if (fs.existsSync(rtDir)) {
    recordTypes = fs
      .readdirSync(rtDir)
      .filter((f) => f.endsWith(".recordType-meta.xml"))
      .map((f) => {
        const rtXml = readXml(path.join(rtDir, f));
        const rt = rtXml?.RecordType || {};
        return {
          api_name: rt.fullName || f.replace(".recordType-meta.xml", ""),
          label: rt.label || rt.fullName || "",
          description: rt.description || "",
          details: rt,
        };
      })
      .filter(Boolean);
  }

  // 4. Parse business processes
  const bpDir = path.join(objectDir, "businessProcesses");
  let businessProcesses = [];
  if (fs.existsSync(bpDir)) {
    businessProcesses = fs
      .readdirSync(bpDir)
      .filter((f) => f.endsWith(".businessProcess-meta.xml"))
      .map((f) => {
        const bpXml = readXml(path.join(bpDir, f));
        const bp = bpXml?.BusinessProcess || {};
        return {
          api_name: bp.fullName || f.replace(".businessProcess-meta.xml", ""),
          label: bp.fullName || "",
          description: bp.description || "",
          details: bp,
        };
      })
      .filter(Boolean);
  }

  // 5. Parse compact layouts
  const clDir = path.join(objectDir, "compactLayouts");
  let compactLayouts = [];
  if (fs.existsSync(clDir)) {
    compactLayouts = fs
      .readdirSync(clDir)
      .filter((f) => f.endsWith(".compactLayout-meta.xml"))
      .map((f) => {
        const clXml = readXml(path.join(clDir, f));
        const cl = clXml?.CompactLayout || {};
        return {
          api_name: cl.fullName || f.replace(".compactLayout-meta.xml", ""),
          label: cl.label || cl.fullName || "",
          details: cl,
        };
      })
      .filter(Boolean);
  }

  // 6. Parse validation rules
  const vrDir = path.join(objectDir, "validationRules");
  let validationRules = [];
  if (fs.existsSync(vrDir)) {
    validationRules = fs
      .readdirSync(vrDir)
      .filter((f) => f.endsWith(".validationRule-meta.xml"))
      .map((f) => {
        const vrXml = readXml(path.join(vrDir, f));
        const vr = vrXml?.ValidationRule || {};
        return {
          api_name: vr.fullName || f.replace(".validationRule-meta.xml", ""),
          description: vr.description || "",
          error_condition_formula: vr.errorConditionFormula || "",
          error_message: vr.errorMessage || "",
          active: vr.active === "true" || vr.active === true,
          details: vr,
        };
      })
      .filter(Boolean);
  }

  // 7. Parse list views
  const lvDir = path.join(objectDir, "listViews");
  let listViews = [];
  if (fs.existsSync(lvDir)) {
    listViews = fs
      .readdirSync(lvDir)
      .filter((f) => f.endsWith(".listView-meta.xml"))
      .map((f) => {
        const lvXml = readXml(path.join(lvDir, f));
        const lv = lvXml?.ListView || {};
        return {
          api_name: lv.fullName || f.replace(".listView-meta.xml", ""),
          label: lv.label || lv.fullName || "",
          details: lv,
        };
      })
      .filter(Boolean);
  }

  return {
    object: { api_name, label, description },
    fields,
    recordTypes,
    businessProcesses,
    compactLayouts,
    validationRules,
    listViews,
  };
}
