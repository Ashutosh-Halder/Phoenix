import { getDb } from "../db/db.js";
import {
  notionMcpRequest,
  fetchAllDatabaseRows,
  notionApiRequest,
  fetchChildDatabases,
} from "./notionClient.js";
import { templateManager } from "../templates/templateManager.js";

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

// For now, just log the intended Notion structure
export async function syncObjectToNotion(parsed) {
  const {
    object,
    fields,
    recordTypes,
    businessProcesses,
    compactLayouts,
    validationRules,
    listViews,
  } = parsed;

  try {
    // First, check for NOTION_DATABASE_ID or NOTION_ROOT_PAGE_ID in env
    let parentId =
      process.env.NOTION_DATABASE_ID || process.env.NOTION_ROOT_PAGE_ID;
    let parentType = null;
    if (process.env.NOTION_DATABASE_ID) {
      parentType = "database_id";
    } else if (process.env.NOTION_ROOT_PAGE_ID) {
      parentType = "page_id";
    }

    // If no specific parent is set, search for accessible pages
    if (!parentId) {
      console.log("Searching for accessible pages...");
      const searchResult = await notionMcpRequest("/search", "POST", {
        filter: { property: "object", value: "page" },
        page_size: 5,
      });
      console.log("Found pages:", searchResult.results?.length || 0);
      if (searchResult.results && searchResult.results.length > 0) {
        parentId = searchResult.results[0].id;
        parentType = "page_id";
        console.log("Using first accessible page as parent:", parentId);
      }
    }

    if (!parentId) {
      console.log("No parent page found. Creating page in workspace...");
      // Create page in workspace (no parent specified)
      const pagePayload = {
        parent: { type: "workspace" },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: object.label || object.api_name,
                },
              },
            ],
          },
        },
        children: [
          {
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                {
                  text: {
                    content: object.label || object.api_name,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content:
                      object.description || "Salesforce Object Documentation",
                  },
                },
              ],
            },
          },
        ],
      };

      const response = await notionMcpRequest("/pages", "POST", pagePayload);
      console.log("Created new page in workspace:", response.id);
      parentId = response.id;
      parentType = "page_id";
    }

    // Prepare object data for the template
    const objectData = {
      OBJECT_NAME: object.label || object.api_name,
      OBJECT_LABEL: object.label || object.api_name,
      OBJECT_API_NAME: object.api_name,
      OBJECT_DESCRIPTION:
        object.description || "Salesforce Object Documentation",
      OBJECT_TYPE: object.type || "Standard Object",
      DEPLOYMENT_STATUS: object.deployment_status || "Deployed",
      SHARING_MODEL: object.sharing_model || "Read/Write",
      IS_EXTERNAL: object.is_external ? "Yes" : "No",
      IS_CUSTOMIZABLE: object.is_customizable ? "Yes" : "No",
      IS_QUERYABLE: object.is_queryable ? "Yes" : "No",
      IS_SEARCHABLE: object.is_searchable ? "Yes" : "No",
      IS_TRIGGERABLE: object.is_triggerable ? "Yes" : "No",
      FIELD_COUNT: fields.length,
      RECORD_TYPE_COUNT: recordTypes.length,
      BUSINESS_PROCESS_COUNT: businessProcesses.length,
      COMPACT_LAYOUT_COUNT: compactLayouts.length,
      VALIDATION_RULE_COUNT: validationRules.length,
      LIST_VIEW_COUNT: listViews.length,
      SHARING_RULE_COUNT: object.sharing_rule_count || 0,
      TRIGGER_COUNT: object.trigger_count || 0,
      WORKFLOW_COUNT: object.workflow_count || 0,
      EMAIL_TEMPLATE_COUNT: object.email_template_count || 0,
    };

    // Check for existing main documentation page in the parent database
    let mainPage;
    let mainPageId;
    if (process.env.NOTION_DATABASE_ID) {
      // Fetch all rows in the parent database, index by API Name
      const existingRows = await fetchAllDatabaseRows(
        process.env.NOTION_DATABASE_ID,
        "API Name"
      );
      // Try to find a row with the same API Name as the object
      const apiNameKey = objectData.OBJECT_API_NAME;
      let found = null;
      for (const key in existingRows) {
        if (key === apiNameKey) {
          found = existingRows[key];
          break;
        }
      }
      if (found) {
        mainPage = found;
        mainPageId = found.id;
        // Optionally update properties if needed (patch)
        // (You can add logic here to update missing/incomplete columns)
        console.log(
          "Found existing main documentation page by API Name:",
          mainPageId
        );
        console.log("Page URL:", found.url || "(open in Notion)");
      } else {
        // Create as a row in the database
        mainPage = await templateManager.createPageFromTemplate(
          "objects",
          "overview",
          objectData,
          process.env.NOTION_DATABASE_ID,
          notionMcpRequest,
          true // pass a flag to indicate database parent
        );
        mainPageId = mainPage.id;
        console.log(
          "Notion Object template page created in database:",
          mainPageId
        );
        console.log("Page URL:", mainPage.url);
      }
    } else {
      // Fallback to previous logic (should not happen in your case)
      mainPage = await templateManager.createPageFromTemplate(
        "objects",
        "overview",
        objectData,
        parentId,
        notionMcpRequest
      );
      mainPageId = mainPage.id;
      console.log(
        "Notion Object template page created successfully:",
        mainPageId
      );
      console.log("Page URL:", mainPage.url);
    }

    // Fetch all child databases of the main page (by title)
    let childDatabases = {};
    if (mainPageId) {
      childDatabases = await fetchChildDatabases(mainPageId);
    }

    // Use the Object template for all subcomponent databases, as subpages of the main page
    // Fields
    if (fields.length > 0) {
      const fieldsDbTitle = `🏷️ ${objectData.OBJECT_NAME} - All Fields`;
      let fieldsDbId = childDatabases[fieldsDbTitle];
      let fieldsDb;
      if (fieldsDbId) {
        fieldsDb = { id: fieldsDbId };
        console.log("Found existing Fields database:", fieldsDbId);
      } else {
        fieldsDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "fields",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        fieldsDbId = fieldsDb.id;
        console.log("Fields database created:", fieldsDbId);
      }
      console.time("Fields sync");
      await templateManager.addDataToDatabase(
        fieldsDbId,
        "objects",
        "fields",
        fields, // pass full array
        notionMcpRequest,
        [], // allData
        3 // concurrency
      );
      console.timeEnd("Fields sync");
      console.log(`Added all ${fields.length} fields to database`);
    }
    // Repeat for recordTypes, businessProcesses, compactLayouts, validationRules, listViews
    if (recordTypes.length > 0) {
      const recordTypeDbTitle = `📝 ${objectData.OBJECT_NAME} - Record Types`;
      let recordTypeDbId = childDatabases[recordTypeDbTitle];
      let recordTypeDb;
      if (recordTypeDbId) {
        recordTypeDb = { id: recordTypeDbId };
        console.log("Found existing Record Types database:", recordTypeDbId);
      } else {
        recordTypeDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "recordTypes",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        recordTypeDbId = recordTypeDb.id;
        console.log("Record types database created:", recordTypeDbId);
      }
      console.time("RecordTypes sync");
      await templateManager.addDataToDatabase(
        recordTypeDbId,
        "objects",
        "recordTypes",
        recordTypes,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("RecordTypes sync");
      console.log(`Added ${recordTypes.length} record types to database`);
    }
    if (businessProcesses.length > 0) {
      const bpDbTitle = `🔄 ${objectData.OBJECT_NAME} - Business Processes`;
      let bpDbId = childDatabases[bpDbTitle];
      let bpDb;
      if (bpDbId) {
        bpDb = { id: bpDbId };
        console.log("Found existing Business Processes database:", bpDbId);
      } else {
        bpDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "businessProcesses",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        bpDbId = bpDb.id;
        console.log("Business processes database created:", bpDbId);
      }
      console.time("BusinessProcesses sync");
      await templateManager.addDataToDatabase(
        bpDbId,
        "objects",
        "businessProcesses",
        businessProcesses,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("BusinessProcesses sync");
      console.log(
        `Added ${businessProcesses.length} business processes to database`
      );
    }
    if (compactLayouts.length > 0) {
      const clDbTitle = `📱 ${objectData.OBJECT_NAME} - Compact Layouts`;
      let clDbId = childDatabases[clDbTitle];
      let clDb;
      if (clDbId) {
        clDb = { id: clDbId };
        console.log("Found existing Compact Layouts database:", clDbId);
      } else {
        clDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "compactLayouts",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        clDbId = clDb.id;
        console.log("Compact layouts database created:", clDbId);
      }
      console.time("CompactLayouts sync");
      await templateManager.addDataToDatabase(
        clDbId,
        "objects",
        "compactLayouts",
        compactLayouts,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("CompactLayouts sync");
      console.log(`Added ${compactLayouts.length} compact layouts to database`);
    }
    if (validationRules.length > 0) {
      const vrDbTitle = `✅ ${objectData.OBJECT_NAME} - Validation Rules`;
      let vrDbId = childDatabases[vrDbTitle];
      let vrDb;
      if (vrDbId) {
        vrDb = { id: vrDbId };
        console.log("Found existing Validation Rules database:", vrDbId);
      } else {
        vrDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "validationRules",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        vrDbId = vrDb.id;
        console.log("Validation rules database created:", vrDbId);
      }
      console.time("ValidationRules sync");
      await templateManager.addDataToDatabase(
        vrDbId,
        "objects",
        "validationRules",
        validationRules,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("ValidationRules sync");
      console.log(
        `Added ${validationRules.length} validation rules to database`
      );
    }
    if (listViews.length > 0) {
      const listViewDbTitle = `👁️ ${objectData.OBJECT_NAME} - List Views`;
      let listViewDbId = childDatabases[listViewDbTitle];
      let listViewDb;
      if (listViewDbId) {
        listViewDb = { id: listViewDbId };
        console.log("Found existing List Views database:", listViewDbId);
      } else {
        listViewDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "listViews",
          objectData,
          mainPageId,
          notionMcpRequest
        );
        listViewDbId = listViewDb.id;
        console.log("List views database created:", listViewDbId);
      }
      console.time("ListViews sync");
      await templateManager.addDataToDatabase(
        listViewDbId,
        "objects",
        "listViews",
        listViews,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("ListViews sync");
      console.log(`Added ${listViews.length} list views to database`);
    }

    console.log(
      "✅ Complete documentation created successfully using Object template!"
    );
  } catch (err) {
    console.error("Notion MCP sync failed:", err);
  }
}

export async function syncFlowToNotion(parsed) {
  const {
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
    details,
  } = parsed;

  // Prepare flow data for the template
  const flowData = {
    FLOW_NAME: label || api_name,
    FLOW_API_NAME: api_name,
    FLOW_DESCRIPTION: description,
    FLOW_STATUS: status,
    FLOW_PROCESS_TYPE: process_type,
    OBJECT: object || "",
    OPERATOR: operator || "",
    CRITERIA:
      start &&
      start.filters &&
      start.filters.length > 0 &&
      start.filters[0].field
        ? `${start.filters[0].field} ${operator}`
        : "",
    SCHEDULE: start && start.schedule ? start.schedule : "",
    VARIABLES_TABLE: "(Variables table rendering TBD)",
    INPUT_PARAMS_TABLE: "(Input params table rendering TBD)",
    OUTPUT_PARAMS_TABLE: "(Output params table rendering TBD)",
    MERMAID_DIAGRAM: `graph TD\n  Start((Start)) --> D1[Decision: ...]`, // Placeholder, can be improved
    STEP_1: "Describe step 1",
    STEP_2: "Describe step 2",
    APEX_CLASSES: "(List Apex classes if any)",
    CUSTOM_OBJECTS: object || "",
    OTHER_FLOWS: "(List other flows if any)",
    LIMITATIONS: "(List limitations)",
    PERFORMANCE: "(Performance notes)",
    BULK_NOTES: "(Bulk processing notes)",
    TEST_SCENARIOS: "(Test scenarios)",
    EXPECTED_OUTCOMES: "(Expected outcomes)",
    EDGE_CASES: "(Edge cases)",
    CHANGELOG_TABLE: "(Changelog table rendering TBD)",
  };

  // Notion parent logic (same as syncObjectToNotion)
  let parentId =
    process.env.NOTION_DATABASE_ID || process.env.NOTION_ROOT_PAGE_ID;
  let parentType = null;
  if (process.env.NOTION_DATABASE_ID) {
    parentType = "database_id";
  } else if (process.env.NOTION_ROOT_PAGE_ID) {
    parentType = "page_id";
  }
  if (!parentId) {
    console.log("Searching for accessible pages...");
    const searchResult = await notionMcpRequest("/search", "POST", {
      filter: { property: "object", value: "page" },
      page_size: 5,
    });
    if (searchResult.results && searchResult.results.length > 0) {
      parentId = searchResult.results[0].id;
      parentType = "page_id";
      console.log("Using first accessible page as parent:", parentId);
    }
  }
  if (!parentId) {
    // Create page in workspace (no parent specified)
    const pagePayload = {
      parent: { type: "workspace" },
      properties: {
        title: {
          title: [
            {
              text: {
                content: flowData.FLOW_NAME,
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "heading_1",
          heading_1: {
            rich_text: [
              {
                text: {
                  content: flowData.FLOW_NAME,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                text: {
                  content: flowData.FLOW_DESCRIPTION,
                },
              },
            ],
          },
        },
      ],
    };
    const response = await notionMcpRequest("/pages", "POST", pagePayload);
    parentId = response.id;
    parentType = "page_id";
  }

  // Create the Flow documentation page using the template
  const mainPage = await templateManager.createPageFromTemplate(
    "flows",
    "overview",
    flowData,
    parentId,
    notionMcpRequest
  );
  console.log("Notion Flow template page created successfully:", mainPage.id);
  console.log("Page URL:", mainPage.url);
}

// Read from DB and sync to Notion MCP
export async function syncOpportunityFromDbToNotion() {
  const db = await getDb();
  // Get Opportunity object
  const obj = await db.get(
    "SELECT * FROM objects WHERE api_name = ?",
    "Opportunity"
  );
  if (!obj) {
    console.log("No Opportunity object found in DB.");
    await db.close();
    return;
  }
  // Get subcomponents
  const fields = await db.all(
    "SELECT * FROM fields WHERE object_id = ?",
    obj.id
  );
  const recordTypes = await db.all(
    "SELECT * FROM record_types WHERE object_id = ?",
    obj.id
  );
  const businessProcesses = await db.all(
    "SELECT * FROM business_processes WHERE object_id = ?",
    obj.id
  );
  const compactLayouts = await db.all(
    "SELECT * FROM compact_layouts WHERE object_id = ?",
    obj.id
  );
  const validationRules = await db.all(
    "SELECT * FROM validation_rules WHERE object_id = ?",
    obj.id
  );
  const listViews = await db.all(
    "SELECT * FROM list_views WHERE object_id = ?",
    obj.id
  );

  try {
    // First, check for NOTION_DATABASE_ID or NOTION_ROOT_PAGE_ID in env
    let parentId =
      process.env.NOTION_DATABASE_ID || process.env.NOTION_ROOT_PAGE_ID;
    let parentType = null;
    if (process.env.NOTION_DATABASE_ID) {
      parentType = "database_id";
    } else if (process.env.NOTION_ROOT_PAGE_ID) {
      parentType = "page_id";
    }

    // If no specific parent is set, search for accessible pages
    if (!parentId) {
      console.log("Searching for accessible pages...");
      const searchResult = await notionMcpRequest("/search", "POST", {
        filter: { property: "object", value: "page" },
        page_size: 5,
      });
      console.log("Found pages:", searchResult.results?.length || 0);
      if (searchResult.results && searchResult.results.length > 0) {
        parentId = searchResult.results[0].id;
        parentType = "page_id";
        console.log("Using first accessible page as parent:", parentId);
      }
    }

    if (!parentId) {
      console.log("No parent page found. Creating page in workspace...");
      // Create page in workspace (no parent specified)
      const pagePayload = {
        parent: { type: "workspace" },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: obj.label || obj.api_name,
                },
              },
            ],
          },
        },
        children: [
          {
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                {
                  text: {
                    content: obj.label || obj.api_name,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content:
                      obj.description ||
                      "Salesforce Opportunity Object Documentation",
                  },
                },
              ],
            },
          },
        ],
      };

      const response = await notionMcpRequest("/pages", "POST", pagePayload);
      console.log("Created new page in workspace:", response.id);
      parentId = response.id;
      parentType = "page_id";
    }

    // Prepare Opportunity data for the template
    const opportunityData = {
      OBJECT_NAME: obj.label || obj.api_name,
      OBJECT_LABEL: obj.label || obj.api_name,
      OBJECT_API_NAME: obj.api_name,
      OBJECT_DESCRIPTION:
        obj.description || "Salesforce Opportunity Object Documentation",
      OBJECT_TYPE: obj.type || "Standard Object",
      DEPLOYMENT_STATUS: obj.deployment_status || "Deployed",
      SHARING_MODEL: obj.sharing_model || "Read/Write",
      IS_EXTERNAL: obj.is_external ? "Yes" : "No",
      IS_CUSTOMIZABLE: obj.is_customizable ? "Yes" : "No",
      IS_QUERYABLE: obj.is_queryable ? "Yes" : "No",
      IS_SEARCHABLE: obj.is_searchable ? "Yes" : "No",
      IS_TRIGGERABLE: obj.is_triggerable ? "Yes" : "No",
      FIELD_COUNT: fields.length,
      RECORD_TYPE_COUNT: recordTypes.length,
      BUSINESS_PROCESS_COUNT: businessProcesses.length,
      COMPACT_LAYOUT_COUNT: compactLayouts.length,
      VALIDATION_RULE_COUNT: validationRules.length,
      LIST_VIEW_COUNT: listViews.length,
      SHARING_RULE_COUNT: obj.sharing_rule_count || 0,
      TRIGGER_COUNT: obj.trigger_count || 0,
      WORKFLOW_COUNT: obj.workflow_count || 0,
      EMAIL_TEMPLATE_COUNT: obj.email_template_count || 0,
    };

    // Check for existing main documentation page in the parent database
    let mainPage;
    let mainPageId;
    if (process.env.NOTION_DATABASE_ID) {
      // Fetch all rows in the parent database, index by API Name
      const existingRows = await fetchAllDatabaseRows(
        process.env.NOTION_DATABASE_ID,
        "API Name"
      );
      // Try to find a row with the same API Name as the object
      const apiNameKey = opportunityData.OBJECT_API_NAME;
      let found = null;
      for (const key in existingRows) {
        if (key === apiNameKey) {
          found = existingRows[key];
          break;
        }
      }
      if (found) {
        mainPage = found;
        mainPageId = found.id;
        // Optionally update properties if needed (patch)
        // (You can add logic here to update missing/incomplete columns)
        console.log(
          "Found existing main documentation page by API Name:",
          mainPageId
        );
        console.log("Page URL:", found.url || "(open in Notion)");
      } else {
        // Create as a row in the database
        mainPage = await templateManager.createPageFromTemplate(
          "objects",
          "overview",
          opportunityData,
          process.env.NOTION_DATABASE_ID,
          notionMcpRequest,
          true // pass a flag to indicate database parent
        );
        mainPageId = mainPage.id;
        console.log(
          "Notion Object template page created in database:",
          mainPageId
        );
        console.log("Page URL:", mainPage.url);
      }
    } else {
      // Fallback to previous logic (should not happen in your case)
      mainPage = await templateManager.createPageFromTemplate(
        "objects",
        "overview",
        opportunityData,
        parentId,
        notionMcpRequest
      );
      mainPageId = mainPage.id;
      console.log(
        "Notion Object template page created successfully:",
        mainPageId
      );
      console.log("Page URL:", mainPage.url);
    }

    // Fetch all child databases of the main page (by title)
    let childDatabases = {};
    if (mainPageId) {
      childDatabases = await fetchChildDatabases(mainPageId);
    }

    // Use the Object template for all subcomponent databases, as subpages of the main page
    // Fields
    if (fields.length > 0) {
      const fieldsDbTitle = `🏷️ ${opportunityData.OBJECT_NAME} - All Fields`;
      let fieldsDbId = childDatabases[fieldsDbTitle];
      let fieldsDb;
      if (fieldsDbId) {
        fieldsDb = { id: fieldsDbId };
        console.log("Found existing Fields database:", fieldsDbId);
      } else {
        fieldsDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "fields",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        fieldsDbId = fieldsDb.id;
        console.log("Fields database created:", fieldsDbId);
      }
      console.time("Fields sync");
      await templateManager.addDataToDatabase(
        fieldsDbId,
        "objects",
        "fields",
        fields, // pass full array
        notionMcpRequest,
        [], // allData
        3 // concurrency
      );
      console.timeEnd("Fields sync");
      console.log(`Added all ${fields.length} fields to database`);
    }
    // Repeat for recordTypes, businessProcesses, compactLayouts, validationRules, listViews
    if (recordTypes.length > 0) {
      const recordTypeDbTitle = `📝 ${opportunityData.OBJECT_NAME} - Record Types`;
      let recordTypeDbId = childDatabases[recordTypeDbTitle];
      let recordTypeDb;
      if (recordTypeDbId) {
        recordTypeDb = { id: recordTypeDbId };
        console.log("Found existing Record Types database:", recordTypeDbId);
      } else {
        recordTypeDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "recordTypes",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        recordTypeDbId = recordTypeDb.id;
        console.log("Record types database created:", recordTypeDbId);
      }
      console.time("RecordTypes sync");
      await templateManager.addDataToDatabase(
        recordTypeDbId,
        "objects",
        "recordTypes",
        recordTypes,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("RecordTypes sync");
      console.log(`Added ${recordTypes.length} record types to database`);
    }
    if (businessProcesses.length > 0) {
      const bpDbTitle = `🔄 ${opportunityData.OBJECT_NAME} - Business Processes`;
      let bpDbId = childDatabases[bpDbTitle];
      let bpDb;
      if (bpDbId) {
        bpDb = { id: bpDbId };
        console.log("Found existing Business Processes database:", bpDbId);
      } else {
        bpDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "businessProcesses",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        bpDbId = bpDb.id;
        console.log("Business processes database created:", bpDbId);
      }
      console.time("BusinessProcesses sync");
      await templateManager.addDataToDatabase(
        bpDbId,
        "objects",
        "businessProcesses",
        businessProcesses,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("BusinessProcesses sync");
      console.log(
        `Added ${businessProcesses.length} business processes to database`
      );
    }
    if (compactLayouts.length > 0) {
      const clDbTitle = `📱 ${opportunityData.OBJECT_NAME} - Compact Layouts`;
      let clDbId = childDatabases[clDbTitle];
      let clDb;
      if (clDbId) {
        clDb = { id: clDbId };
        console.log("Found existing Compact Layouts database:", clDbId);
      } else {
        clDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "compactLayouts",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        clDbId = clDb.id;
        console.log("Compact layouts database created:", clDbId);
      }
      console.time("CompactLayouts sync");
      await templateManager.addDataToDatabase(
        clDbId,
        "objects",
        "compactLayouts",
        compactLayouts,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("CompactLayouts sync");
      console.log(`Added ${compactLayouts.length} compact layouts to database`);
    }
    if (validationRules.length > 0) {
      const vrDbTitle = `✅ ${opportunityData.OBJECT_NAME} - Validation Rules`;
      let vrDbId = childDatabases[vrDbTitle];
      let vrDb;
      if (vrDbId) {
        vrDb = { id: vrDbId };
        console.log("Found existing Validation Rules database:", vrDbId);
      } else {
        vrDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "validationRules",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        vrDbId = vrDb.id;
        console.log("Validation rules database created:", vrDbId);
      }
      console.time("ValidationRules sync");
      await templateManager.addDataToDatabase(
        vrDbId,
        "objects",
        "validationRules",
        validationRules,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("ValidationRules sync");
      console.log(
        `Added ${validationRules.length} validation rules to database`
      );
    }
    if (listViews.length > 0) {
      const listViewDbTitle = `👁️ ${opportunityData.OBJECT_NAME} - List Views`;
      let listViewDbId = childDatabases[listViewDbTitle];
      let listViewDb;
      if (listViewDbId) {
        listViewDb = { id: listViewDbId };
        console.log("Found existing List Views database:", listViewDbId);
      } else {
        listViewDb = await templateManager.createDatabaseFromTemplate(
          "objects",
          "listViews",
          opportunityData,
          mainPageId,
          notionMcpRequest
        );
        listViewDbId = listViewDb.id;
        console.log("List views database created:", listViewDbId);
      }
      console.time("ListViews sync");
      await templateManager.addDataToDatabase(
        listViewDbId,
        "objects",
        "listViews",
        listViews,
        notionMcpRequest,
        [],
        3
      );
      console.timeEnd("ListViews sync");
      console.log(`Added ${listViews.length} list views to database`);
    }

    console.log(
      "✅ Complete documentation created successfully using Object template!"
    );
  } catch (err) {
    console.error("Notion MCP sync failed:", err);
  }
  await db.close();
}
