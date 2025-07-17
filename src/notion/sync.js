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

  // Create the main profile page in Notion
  await templateManager.createPageFromTemplate(
    "profiles",
    "overview",
    profileData,
    parentId,
    null // notionMcpRequest or similar, if needed
  );
  console.log("Profile documentation created in Notion.");
}
