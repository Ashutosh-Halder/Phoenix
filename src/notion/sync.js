import { getDb } from "../db/db.js";
import {
  notionMcpRequest,
  fetchAllDatabaseRows,
  notionApiRequest,
  fetchChildDatabases,
} from "./notionClient.js";
import { profileTemplate } from "../templates/profileTemplate.js";
import { TemplateManager } from "../templates/templateManager.js";
const templateManager = new TemplateManager();

// Analysis functions for validation rules
function analyzeValidationRulePurpose(errorCondition, errorMessage) {
  const condition = errorCondition.toLowerCase();
  const message = errorMessage.toLowerCase();

  let purpose = "🧠 **Purpose:** ";

  // Analyze based on common patterns
  if (condition.includes("isblank") || condition.includes("isnull")) {
    purpose += "Ensures required fields are populated and not empty.";
  } else if (condition.includes("len(") || condition.includes("length")) {
    purpose +=
      "Validates field length constraints (minimum/maximum characters).";
  } else if (condition.includes("regex") || condition.includes("contains")) {
    purpose += "Validates data format and content patterns.";
  } else if (condition.includes("date") || condition.includes("datetime")) {
    purpose += "Ensures date/time fields meet chronological requirements.";
  } else if (condition.includes("amount") || condition.includes("currency")) {
    purpose += "Validates monetary values and financial constraints.";
  } else if (condition.includes("stage") || condition.includes("status")) {
    purpose += "Ensures proper workflow progression and state management.";
  } else if (condition.includes("owner") || condition.includes("assigned")) {
    purpose += "Validates ownership and assignment requirements.";
  } else if (condition.includes("probability") || condition.includes("close")) {
    purpose += "Ensures opportunity probability and close date logic.";
  } else {
    purpose += "Validates business logic and data integrity requirements.";
  }

  return purpose;
}

function analyzeValidationRuleLogic(errorCondition) {
  const condition = errorCondition;
  let breakdown = "⚙️ **Logic Breakdown:**\n\n";

  if (!condition) {
    return breakdown + "No error condition formula available.";
  }

  // Break down common Salesforce formula patterns
  const parts = condition
    .split(/(\|\||&&|\(|\))/)
    .filter((part) => part.trim());

  breakdown += "**Formula Structure:**\n";
  breakdown += `\`${condition}\`\n\n`;

  breakdown += "**Components:**\n";

  // Analyze logical operators
  if (condition.includes("||")) {
    breakdown += "• Uses OR logic (||) - triggers if ANY condition is true\n";
  }
  if (condition.includes("&&")) {
    breakdown +=
      "• Uses AND logic (&&) - triggers if ALL conditions are true\n";
  }

  // Analyze common functions
  if (condition.includes("ISBLANK(")) {
    breakdown += "• ISBLANK() - checks if field is empty or null\n";
  }
  if (condition.includes("ISNULL(")) {
    breakdown += "• ISNULL() - checks if field is null\n";
  }
  if (condition.includes("LEN(")) {
    breakdown += "• LEN() - gets the length of a text field\n";
  }
  if (condition.includes("TODAY()")) {
    breakdown += "• TODAY() - gets current date\n";
  }
  if (condition.includes("NOW()")) {
    breakdown += "• NOW() - gets current date and time\n";
  }
  if (condition.includes("TEXT(")) {
    breakdown += "• TEXT() - converts value to text format\n";
  }
  if (condition.includes("VALUE(")) {
    breakdown += "• VALUE() - converts text to number\n";
  }
  if (condition.includes("REGEX(")) {
    breakdown += "• REGEX() - validates against regular expression pattern\n";
  }

  // Analyze field references
  const fieldMatches =
    condition.match(
      /\b[A-Za-z_][A-Za-z0-9_]*__c\b|\b[A-Za-z_][A-Za-z0-9_]*\b/g
    ) || [];
  const uniqueFields = [...new Set(fieldMatches)].filter(
    (field) =>
      ![
        "true",
        "false",
        "null",
        "and",
        "or",
        "not",
        "isblank",
        "isnull",
        "len",
        "today",
        "now",
        "text",
        "value",
        "regex",
      ].includes(field.toLowerCase())
  );

  if (uniqueFields.length > 0) {
    breakdown += "\n**Fields Referenced:**\n";
    uniqueFields.forEach((field) => {
      breakdown += `• ${field}\n`;
    });
  }

  return breakdown;
}

function analyzeValidationRuleMerge(currentRule, allRules) {
  let analysis = "🔄 **Merge Analysis:**\n\n";

  if (allRules.length <= 1) {
    return analysis + "No other rules available for merge analysis.";
  }

  const currentCondition = (
    currentRule.error_condition_formula ||
    currentRule.errorConditionFormula ||
    ""
  ).toLowerCase();
  const currentMessage = (currentRule.error_message || "").toLowerCase();

  let potentialMerges = [];

  // Find rules with similar patterns
  allRules.forEach((otherRule) => {
    if (otherRule.api_name === currentRule.api_name) return; // Skip self

    const otherCondition = (
      otherRule.error_condition_formula ||
      otherRule.errorConditionFormula ||
      ""
    ).toLowerCase();
    const otherMessage = (otherRule.error_message || "").toLowerCase();

    let similarityScore = 0;
    let mergeReason = "";

    // Check for similar field references
    const currentFields =
      currentCondition.match(
        /\b[A-Za-z_][A-Za-z0-9_]*__c\b|\b[A-Za-z_][A-Za-z0-9_]*\b/g
      ) || [];
    const otherFields =
      otherCondition.match(
        /\b[A-Za-z_][A-Za-z0-9_]*__c\b|\b[A-Za-z_][A-Za-z0-9_]*\b/g
      ) || [];

    const commonFields = currentFields.filter((field) =>
      otherFields.includes(field)
    );
    if (commonFields.length > 0) {
      similarityScore += 30;
      mergeReason += `• Both reference fields: ${commonFields.join(", ")}\n`;
    }

    // Check for similar functions
    const functions = [
      "isblank",
      "isnull",
      "len",
      "today",
      "now",
      "text",
      "value",
      "regex",
    ];
    const currentFuncs = functions.filter((func) =>
      currentCondition.includes(func)
    );
    const otherFuncs = functions.filter((func) =>
      otherCondition.includes(func)
    );
    const commonFuncs = currentFuncs.filter((func) =>
      otherFuncs.includes(func)
    );

    if (commonFuncs.length > 0) {
      similarityScore += 20;
      mergeReason += `• Both use functions: ${commonFuncs.join(", ")}\n`;
    }

    // Check for similar error messages
    if (
      currentMessage &&
      otherMessage &&
      (currentMessage.includes(otherMessage.substring(0, 20)) ||
        otherMessage.includes(currentMessage.substring(0, 20)))
    ) {
      similarityScore += 25;
      mergeReason += "• Similar error messages\n";
    }

    // Check for similar logical structure
    if (
      (currentCondition.includes("||") && otherCondition.includes("||")) ||
      (currentCondition.includes("&&") && otherCondition.includes("&&"))
    ) {
      similarityScore += 15;
      mergeReason += "• Similar logical operators\n";
    }

    if (similarityScore >= 30) {
      potentialMerges.push({
        rule: otherRule,
        score: similarityScore,
        reason: mergeReason,
      });
    }
  });

  // Sort by similarity score
  potentialMerges.sort((a, b) => b.score - a.score);

  if (potentialMerges.length === 0) {
    analysis +=
      "**No potential merges found.** This rule appears to be unique.\n\n";
    analysis +=
      "**Reason:** No other rules share similar field references, functions, or logical patterns.";
  } else {
    analysis += `**Found ${potentialMerges.length} potential merge candidates:**\n\n`;

    potentialMerges.slice(0, 3).forEach((merge, index) => {
      analysis += `**${index + 1}. ${
        merge.rule.label || merge.rule.api_name
      }** (Score: ${merge.score}%)\n`;
      analysis += `**API Name:** ${merge.rule.api_name}\n`;
      analysis += `**Merge Reasons:**\n${merge.reason}`;
      analysis += `**How to Merge:** Combine conditions using OR (||) or AND (&&) operators, and create a unified error message.\n\n`;
    });
  }

  return analysis;
}

// --- Mapping functions for each subcomponent ---
function mapObjectPermissions(arr) {
  return arr.map((d) => ({
    Object: d.object || d.Object || "",
    Read: d.allowRead === true || d.allowRead === "true",
    Create: d.allowCreate === true || d.allowCreate === "true",
    Edit: d.allowEdit === true || d.allowEdit === "true",
    Delete: d.allowDelete === true || d.allowDelete === "true",
    "View All": d.viewAllRecords === true || d.viewAllRecords === "true",
    "Modify All": d.modifyAllRecords === true || d.modifyAllRecords === "true",
  }));
}
function mapFieldPermissions(arr) {
  return arr.map((d) => ({
    Object: d.object || d.Object || "",
    Field: d.field || d.Field || "",
    Readable: d.readable === true || d.readable === "true",
    Editable: d.editable === true || d.editable === "true",
  }));
}
function mapRecordTypeVisibilities(arr) {
  return arr.map((d) => ({
    Object: d.object || d.Object || "",
    "Record Type": d.recordType || d.recordTypeName || d["Record Type"] || "",
    Visible: d.visible === true || d.visible === "true",
    Default: d.default === true || d.default === "true",
  }));
}
function mapApplicationVisibilities(arr) {
  return arr.map((d) => ({
    Application: d.application || d.Application || "",
    Visible: d.visible === true || d.visible === "true",
    Default: d.default === true || d.default === "true",
  }));
}
function mapTabVisibilities(arr) {
  return arr.map((d) => ({
    Tab: d.tab || d.Tab || "",
    Visibility: d.visibility || d.Visibility || "",
  }));
}
function mapClassAccesses(arr) {
  return arr.map((d) => ({
    "Apex Class": d.apexClass || d["Apex Class"] || d.apexClassName || "",
    Enabled:
      d.enabled === true ||
      d.enabled === "true" ||
      d.hasAccess === true ||
      d.hasAccess === "true",
  }));
}
function mapFlowAccesses(arr) {
  return arr.map((d) => ({
    Flow: d.flow || d.Flow || d.flowName || "",
    Enabled:
      d.enabled === true ||
      d.enabled === "true" ||
      d.hasAccess === true ||
      d.hasAccess === "true",
  }));
}
function mapUserPermissions(arr) {
  return arr.map((d) => ({
    Permission: d.name || d.Permission || d.userPermission || "",
    Enabled:
      d.enabled === true ||
      d.enabled === "true" ||
      d.allowed === true ||
      d.allowed === "true",
  }));
}
function mapLayoutAssignments(arr) {
  return arr.map((d) => ({
    Object: d.object || d.Object || "",
    Layout: d.layout || d.Layout || "",
    RecordType: d.recordType || d.RecordType || "",
  }));
}
function mapPageAccesses(arr) {
  return arr.map((d) => ({
    Page: d.apexPage || d.Page || d.apexPageName || "",
    Enabled:
      d.enabled === true ||
      d.enabled === "true" ||
      d.hasAccess === true ||
      d.hasAccess === "true",
  }));
}

// Remove all object-related sync logic
// Only keep profile sync logic
export async function syncProfileToNotion(
  parsed,
  api_name,
  label = null,
  description = null
) {
  // Prepare profile data for the template
  const profileData = {
    PROFILE_LABEL: label || api_name,
    PROFILE_API_NAME: api_name,
    USER_LICENSE: parsed.raw.userLicense || "",
    PROFILE_DESCRIPTION: description || "",
    PROFILE_PURPOSE: "", // Optionally infer or allow user to provide
  };

  // Use MCP-compliant parent selection: do not fallback to any hardcoded ID
  let parentId = null;
  let parentType = null;
  if (process.env.NOTION_DATABASE_ID) {
    parentId = process.env.NOTION_DATABASE_ID;
    parentType = "database_id";
  } else if (process.env.NOTION_ROOT_PAGE_ID) {
    parentId = process.env.NOTION_ROOT_PAGE_ID;
    parentType = "page_id";
  }
  if (!parentId) {
    console.warn(
      "[WARNING] No Notion parent ID set. The page will be created in the workspace root or as allowed by MCP."
    );
  }
  console.log("[DEBUG] Using parentId:", parentId, "parentType:", parentType);

  // 1. Create the main profile page in Notion and get its ID
  const mainPage = await templateManager.createPageFromTemplate(
    "profiles",
    "overview",
    profileData,
    parentId,
    null // notionMcpRequest or similar, if needed
  );
  const mainPageId = mainPage.id;
  console.log("Profile documentation created in Notion.");

  // Log all available template keys for debugging
  console.log("[DEBUG] profileTemplate keys:", Object.keys(profileTemplate));
  console.log(
    "[DEBUG] templateManager.templates.profiles keys:",
    Object.keys(templateManager.templates.profiles)
  );

  // 2. Build Notion blocks for each section, matching the HTML template
  // --- Overview Section ---
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [
            { text: { content: `👤 Profile: ${profileData.PROFILE_LABEL}` } },
          ],
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔍 Overview" } }],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { text: { content: `API Name: ${profileData.PROFILE_API_NAME}` } },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { text: { content: `User License: ${profileData.USER_LICENSE}` } },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: `Description: ${profileData.PROFILE_DESCRIPTION}`,
              },
            },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { text: { content: `Purpose: ${profileData.PROFILE_PURPOSE}` } },
          ],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Object Permissions Table ---
  // Create Notion database for Object Permissions as a child of the main page
  const objectPermsDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "objectPermissions",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] objectPermissions data length:",
    (parsed.chunks?.objectPermissions?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.objectPermissions?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    objectPermsDb.id,
    "profiles",
    "objectPermissions",
    parsed.chunks?.objectPermissions?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔐 Object Permissions" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- FLS Table ---
  const flsDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "fieldPermissions",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] fieldPermissions data length:",
    (parsed.chunks?.fieldPermissions?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.fieldPermissions?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    flsDb.id,
    "profiles",
    "fieldPermissions",
    parsed.chunks?.fieldPermissions?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔑 Field-Level Security (FLS)" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Record Type Visibility Table ---
  const recordTypeDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "recordTypeVisibilities",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] recordTypeVisibilities data length:",
    (parsed.chunks?.recordTypeVisibilities?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.recordTypeVisibilities?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    recordTypeDb.id,
    "profiles",
    "recordTypeVisibilities",
    parsed.chunks?.recordTypeVisibilities?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔗 Record Type Visibility" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- App Visibility Table ---
  const appDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "applicationVisibilities",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] applicationVisibilities data length:",
    (parsed.chunks?.applicationVisibilities?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.applicationVisibilities?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    appDb.id,
    "profiles",
    "applicationVisibilities",
    parsed.chunks?.applicationVisibilities?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🧱 App and Tab Visibility" } }],
        },
      },
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: "Apps" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Tab Visibility Table ---
  const tabDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "tabVisibilities",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] tabVisibilities data length:",
    (parsed.chunks?.tabVisibilities?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.tabVisibilities?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    tabDb.id,
    "profiles",
    "tabVisibilities",
    parsed.chunks?.tabVisibilities?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: "Tabs" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Administrative Permissions Table ---
  const adminDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "userPermissions",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] userPermissions data length:",
    (parsed.chunks?.userPermissions?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.userPermissions?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    adminDb.id,
    "profiles",
    "userPermissions",
    parsed.chunks?.userPermissions?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "⚙️ Administrative Permissions" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Login Access & Restrictions Table ---
  const loginDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "pageAccesses",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] pageAccesses data length:",
    (parsed.chunks?.pageAccesses?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.pageAccesses?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    loginDb.id,
    "profiles",
    "pageAccesses",
    parsed.chunks?.pageAccesses?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔐 Login Access & Restrictions" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Flow & Apex Class Access Tables ---
  const classDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "classAccesses",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] classAccesses data length:",
    (parsed.chunks?.classAccesses?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.classAccesses?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    classDb.id,
    "profiles",
    "classAccesses",
    parsed.chunks?.classAccesses?.flat() || []
  );
  const flowDb = await templateManager.createDatabaseFromTemplate(
    "profiles",
    "flowAccesses",
    profileData,
    mainPageId
  );
  console.log(
    "[DEBUG] flowAccesses data length:",
    (parsed.chunks?.flowAccesses?.flat() || []).length,
    "Sample:",
    (parsed.chunks?.flowAccesses?.flat() || [])[0]
  );
  await templateManager.addDataToDatabase(
    flowDb.id,
    "profiles",
    "flowAccesses",
    parsed.chunks?.flowAccesses?.flat() || []
  );
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🔁 Flow & Apex Class Access" } }],
        },
      },
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: "Apex Classes" } }],
        },
      },
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: "Flows" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
    ],
  });

  // --- Notes / Recommendations ---
  await notionApiRequest(`/blocks/${mainPageId}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "🧠 Notes / Recommendations" } }],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content:
                  "Mention any risk areas (e.g. excessive access, outdated object usage)",
              },
            },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: "Recommend use of Permission Sets if applicable",
              },
            },
          ],
        },
      },
    ],
  });
}

// CLI/test entrypoint for Notion sync (ESM compatible)
if (
  typeof process !== "undefined" &&
  typeof import.meta !== "undefined" &&
  import.meta.url &&
  process.argv[1] &&
  process.argv[1].endsWith("sync.js")
) {
  const fs = await import("fs");
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node src/notion/sync.js <parsed-profile.json>");
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(path, "utf-8"));
  const apiName =
    parsed.raw && parsed.raw.fullName ? parsed.raw.fullName : "Profile";
  await syncProfileToNotion(
    parsed,
    apiName,
    parsed.label || apiName,
    parsed.raw.description || ""
  );
  console.log("✅ Notion sync complete.");
}
