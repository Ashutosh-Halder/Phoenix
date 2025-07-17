import { profileTemplate, renderProfileTemplate } from "./profileTemplate.js";
import {
  fetchAllDatabaseRows,
  notionApiRequest,
} from "../notion/notionClient.js";

// Template Manager for all Salesforce components
export class TemplateManager {
  constructor() {
    this.templates = {
      profiles: profileTemplate,
    };
  }

  // Get template for a specific component type
  getTemplate(componentType, templateName) {
    // For profiles, return the overview section directly
    if (componentType === "profiles") {
      return this.templates[componentType][templateName];
    }
    throw new Error(`No template for componentType: ${componentType}`);
  }

  // Render a template with data
  renderTemplate(componentType, templateName, data) {
    const template = this.getTemplate(componentType, templateName);
    if (componentType === "profiles") {
      return renderProfileTemplate(template, data);
    }
    throw new Error(`No render function for componentType: ${componentType}`);
  }

  // Utility: Safe placeholder replacement for strings only, with debug logging
  safeReplacePlaceholders(str, data) {
    if (typeof str !== "string") {
      if (str !== undefined && str !== null) {
        console.warn(
          "[safeReplacePlaceholders] Non-string value:",
          str,
          "Type:",
          typeof str,
          new Error().stack
        );
      }
      return str;
    }
    return str.replace(/\{([A-Z0-9_]+)\}/g, (_, key) => data[key] || "");
  }

  // Create Notion database from template
  async createDatabaseFromTemplate(
    componentType,
    templateName,
    data,
    parentPageId
  ) {
    // For subcomponent templates, use the template directly
    let template = this.getTemplate(componentType, templateName);
    if (!template || !template.database) {
      throw new Error(
        `Template '${templateName}' for componentType '${componentType}' does not exist or is missing a 'database' property.`
      );
    }
    // Safe placeholder replacement for database title
    let dbTitle = this.safeReplacePlaceholders(template.database.title, data);
    // Safe placeholder replacement for property names
    const notionProperties = {};
    for (const [name, prop] of Object.entries(template.database.properties)) {
      let propName = this.safeReplacePlaceholders(name, data);
      notionProperties[propName] = (() => {
        switch (prop.type) {
          case "title":
            return { title: {} };
          case "rich_text":
            return { rich_text: {} };
          case "select":
            return { select: { options: prop.options || [] } };
          case "multi_select":
            return { multi_select: { options: prop.options || [] } };
          case "checkbox":
            return { checkbox: {} };
          case "number":
            return { number: {} };
          case "date":
            return { date: {} };
          case "url":
            return { url: {} };
          case "email":
            return { email: {} };
          case "phone_number":
            return { phone_number: {} };
          case "people":
            return { people: {} };
          case "files":
            return { files: {} };
          case "relation":
            return { relation: prop.relation || {} };
          case "rollup":
            return { rollup: prop.rollup || {} };
          case "formula":
            return { formula: prop.formula || {} };
          case "created_time":
            return { created_time: {} };
          case "created_by":
            return { created_by: {} };
          case "last_edited_time":
            return { last_edited_time: {} };
          case "last_edited_by":
            return { last_edited_by: {} };
          case "status":
            return { status: {} };
          case "button":
            return { button: {} };
          case "location":
            return { location: {} };
          case "verification":
            return { verification: {} };
          case "last_visited_time":
            return { last_visited_time: {} };
          case "place":
            return { place: {} };
          default:
            return { rich_text: {} };
        }
      })();
    }
    const databasePayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [
        {
          text: {
            content: dbTitle,
          },
        },
      ],
      properties: notionProperties,
    };
    return await notionApiRequest("/databases", "POST", databasePayload);
  }

  // Create Notion page from template
  async createPageFromTemplate(
    componentType,
    templateName,
    data,
    parentPageId,
    isDatabaseParent = false // new flag
  ) {
    const template = this.renderTemplate(componentType, templateName, data);

    if (!template.structure) {
      throw new Error(
        `Template '${templateName}' does not have a page structure`
      );
    }

    const children = this.convertStructureToNotionBlocks(template.structure);

    // Always set API Name property for duplicate prevention
    const properties = {
      title: {
        title: [
          {
            text: {
              content: template.title,
            },
          },
        ],
      },
      // Add API Name as rich_text property
      "API Name": {
        rich_text: [
          {
            text: {
              content: data.OBJECT_API_NAME || data.api_name || "",
            },
          },
        ],
      },
    };

    const parent = parentPageId
      ? {
          [parentPageId.length === 32 ? "database_id" : "page_id"]:
            parentPageId,
        }
      : { workspace: true };
    const pagePayload = {
      parent,
      properties,
      children: children,
    };

    return await notionApiRequest("/pages", "POST", pagePayload);
  }

  // Convert template structure to Notion blocks
  convertStructureToNotionBlocks(structure) {
    const blocks = [];

    // Add a callout summary at the top
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "📘" },
        rich_text: [
          {
            text: {
              content:
                "This page was auto-generated from Salesforce Profile XML. Use the toggles and links below to explore details!",
            },
          },
        ],
      },
    });
    // Section descriptions for summaries
    const sectionSummaries = {
      "🔐 Object Permissions":
        "This table shows CRUD and special permissions for each Salesforce object.",
      "🔑 Field-Level Security (FLS)":
        "Field-level security for each object and field.",
      "📄 Page Layout Assignments": "Assigned layouts per object.",
      "🔗 Record Type Visibility": "Record types visible to this profile.",
      "🧱 App and Tab Visibility": "App and tab visibility settings.",
      "⚙️ Administrative Permissions":
        "Administrative permissions enabled for this profile.",
      "🔐 Login Access & Restrictions":
        "Login access and restrictions for this profile.",
      "🔁 Flow & Apex Class Access":
        "Apex class and flow access for this profile.",
      "🧠 Notes / Recommendations":
        "Notes and recommendations for this profile.",
    };
    structure.forEach((item, idx) => {
      // Skip database placeholders (handled separately)
      if (item.type === "database") return;
      // Add a summary callout before each section/table
      if (
        item.type &&
        item.type.startsWith("heading_2") &&
        sectionSummaries[item.content]
      ) {
        blocks.push({
          object: "block",
          type: "callout",
          callout: {
            icon: { emoji: "💡" },
            rich_text: [{ text: { content: sectionSummaries[item.content] } }],
          },
        });
      }
      switch (item.type) {
        case "heading_1":
          blocks.push({
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
            },
          });
          break;

        case "heading_2":
          blocks.push({
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
            },
          });
          break;

        case "heading_3":
          blocks.push({
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
            },
          });
          break;

        case "paragraph":
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
            },
          });
          break;

        case "bulleted_list":
          if (item.items && Array.isArray(item.items)) {
            item.items.forEach((listItem) => {
              blocks.push({
                object: "block",
                type: "bulleted_list_item",
                bulleted_list_item: {
                  rich_text: [
                    {
                      text: {
                        content: listItem,
                      },
                    },
                  ],
                },
              });
            });
          }
          break;

        case "numbered_list":
          if (item.items && Array.isArray(item.items)) {
            item.items.forEach((listItem) => {
              blocks.push({
                object: "block",
                type: "numbered_list_item",
                numbered_list_item: {
                  rich_text: [
                    {
                      text: {
                        content: listItem,
                      },
                    },
                  ],
                },
              });
            });
          }
          break;

        case "code":
          blocks.push({
            object: "block",
            type: "code",
            code: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
              language: item.language || "text",
            },
          });
          break;

        case "quote":
          blocks.push({
            object: "block",
            type: "quote",
            quote: {
              rich_text: [
                {
                  text: {
                    content: item.content,
                  },
                },
              ],
            },
          });
          break;

        case "callout":
          blocks.push({
            object: "block",
            type: "callout",
            callout: {
              icon: { emoji: "💡" },
              rich_text: [{ text: { content: item.content } }],
            },
          });
          break;

        case "divider":
          blocks.push({ object: "block", type: "divider", divider: {} });
          break;

        default:
          // For unknown types, skip or add a divider for clarity
          blocks.push({ object: "block", type: "divider", divider: {} });
      }

      // Add a toggle after the overview section for advanced details
      if (item.type === "bulleted_list" && idx === 2) {
        blocks.push({
          object: "block",
          type: "toggle",
          toggle: {
            rich_text: [{ text: { content: "Show Advanced Details" } }],
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [
                    {
                      text: {
                        content:
                          "Here you can add more technical or audit info, links, or embed additional widgets.",
                      },
                    },
                  ],
                },
              },
            ],
          },
        });
      }
      // Add a toggle after each divider (after a table section) for field explanations
      if (item.type === "divider" && idx > 0) {
        blocks.push({
          object: "block",
          type: "toggle",
          toggle: {
            rich_text: [{ text: { content: "Field Explanations" } }],
            children: [
              {
                object: "block",
                type: "bulleted_list_item",
                bulleted_list_item: {
                  rich_text: [
                    {
                      text: {
                        content:
                          "Hover over each field in the table for more info. Common fields: 'Read' = can view, 'Edit' = can modify, 'Modify All' = full access, etc.",
                      },
                    },
                  ],
                },
              },
            ],
          },
        });
      }
    });

    return blocks;
  }

  // Add data to database from template
  async addDataToDatabase(
    databaseId,
    componentType,
    templateName,
    dataArray,
    allData = [], // pass all data for merge analysis if needed
    concurrency = 3 // limit parallel Notion API calls
  ) {
    // Accepts an array of data objects (fields, rules, etc.)
    if (!Array.isArray(dataArray)) dataArray = [dataArray];
    // --- Deduplicate rows by composite key of all property values ---
    const uniqueRows = [];
    const seen = new Set();
    for (const row of dataArray) {
      const key = Object.values(row).join("||");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      }
    }
    // --- Filter out rows where all values are empty or default ---
    const filteredRows = uniqueRows.filter((row) => {
      return Object.values(row).some((v) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return v.trim() !== "";
        return v != null;
      });
    });
    dataArray = filteredRows;
    const template = this.renderTemplate(
      componentType,
      templateName,
      dataArray[0] || {}
    );
    if (!template.database || !template.database.properties) {
      throw new Error(
        `Template '${templateName}' does not have database properties defined`
      );
    }
    const templateProperties = template.database.properties;

    // Helper to upsert a single row (existing logic)
    const subcomponentPropertyMaps = {
      objectPermissions: {
        Object: (d) => d.object || d.Object || "",
        Read: (d) => d.allowRead === true || d.allowRead === "true",
        Create: (d) => d.allowCreate === true || d.allowCreate === "true",
        Edit: (d) => d.allowEdit === true || d.allowEdit === "true",
        Delete: (d) => d.allowDelete === true || d.allowDelete === "true",
        "View All": (d) =>
          d.viewAllRecords === true || d.viewAllRecords === "true",
        "Modify All": (d) =>
          d.modifyAllRecords === true || d.modifyAllRecords === "true",
      },
      fieldPermissions: {
        Object: (d) => d.object || d.Object || "",
        Field: (d) => d.field || d.Field || "",
        Readable: (d) => d.readable === true || d.readable === "true",
        Editable: (d) => d.editable === true || d.editable === "true",
      },
      recordTypeVisibilities: {
        Object: (d) => d.object || d.Object || "",
        "Record Type": (d) =>
          d.recordType || d.recordTypeName || d["Record Type"] || "",
        Visible: (d) => d.visible === true || d.visible === "true",
        Default: (d) => d.default === true || d.default === "true",
      },
      applicationVisibilities: {
        Application: (d) => d.application || d.Application || "",
        Visible: (d) => d.visible === true || d.visible === "true",
        Default: (d) => d.default === true || d.default === "true",
      },
      tabVisibilities: {
        Tab: (d) => d.tab || d.Tab || "",
        Visibility: (d) => d.visibility || d.Visibility || "",
      },
      classAccesses: {
        "Apex Class": (d) =>
          d.apexClass || d["Apex Class"] || d.apexClassName || "",
        Enabled: (d) =>
          d.enabled === true ||
          d.enabled === "true" ||
          d.hasAccess === true ||
          d.hasAccess === "true",
      },
      flowAccesses: {
        Flow: (d) => d.flow || d.Flow || d.flowName || "",
        Enabled: (d) =>
          d.enabled === true ||
          d.enabled === "true" ||
          d.hasAccess === true ||
          d.hasAccess === "true",
      },
      userPermissions: {
        Permission: (d) => d.name || d.Permission || d.userPermission || "",
        Enabled: (d) =>
          d.enabled === true ||
          d.enabled === "true" ||
          d.allowed === true ||
          d.allowed === "true",
      },
      layoutAssignments: {
        Object: (d) => d.object || d.Object || "",
        Layout: (d) => d.layout || d.Layout || "",
        RecordType: (d) => d.recordType || d.RecordType || "",
      },
      pageAccesses: {
        Page: (d) => d.apexPage || d.Page || d.apexPageName || "",
        Enabled: (d) =>
          d.enabled === true ||
          d.enabled === "true" ||
          d.hasAccess === true ||
          d.hasAccess === "true",
      },
    };

    const upsertOne = async (data) => {
      const properties = {};
      // Use explicit mapping if available
      const propertyMap = subcomponentPropertyMaps[templateName] || {};
      for (const propertyName of Object.keys(templateProperties)) {
        let value = "";
        if (propertyMap[propertyName]) {
          value = propertyMap[propertyName](data);
        } else {
          value = data[propertyName] || data[propertyName.toLowerCase()] || "";
        }
        value = this.safeReplacePlaceholders(value, data);
        if (
          (value === null || value === undefined) &&
          ["title", "rich_text"].includes(templateProperties[propertyName].type)
        ) {
          value = "";
        }
        const propertyType = templateProperties[propertyName].type;
        switch (propertyType) {
          case "title":
            properties[propertyName] = {
              title: [
                {
                  text: {
                    content: String(value),
                  },
                },
              ],
            };
            break;
          case "rich_text":
            properties[propertyName] = {
              rich_text: [
                {
                  text: {
                    content: String(value),
                  },
                },
              ],
            };
            break;
          case "checkbox":
            properties[propertyName] = {
              checkbox: Boolean(value),
            };
            break;
          case "select":
            const options = templateProperties[propertyName].options || [];
            const matchingOption = options.find(
              (opt) =>
                typeof value === "string" &&
                opt.name.toLowerCase() === value.toLowerCase()
            );
            properties[propertyName] = {
              select: matchingOption ? { name: matchingOption.name } : null,
            };
            break;
          case "number":
            properties[propertyName] = {
              number: Number(value) || 0,
            };
            break;
          default:
            properties[propertyName] = {
              rich_text: [
                {
                  text: {
                    content: String(value),
                  },
                },
              ],
            };
        }
      }
      const pagePayload = {
        parent: { database_id: databaseId },
        properties: properties,
      };
      // Log the payload for debugging
      console.log(
        "[DEBUG] Inserting row into DB:",
        databaseId,
        templateName,
        JSON.stringify(properties, null, 2)
      );
      // --- Timeout and retry logic ---
      const TIMEOUT_MS = 30000; // 30 seconds
      const MAX_RETRIES = 2;
      let attempt = 0;
      while (attempt <= MAX_RETRIES) {
        attempt++;
        try {
          const result = await Promise.race([
            notionApiRequest("/pages", "POST", pagePayload),
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error("Timeout after 30s inserting row to Notion")
                  ),
                TIMEOUT_MS
              )
            ),
          ]);
          return result;
        } catch (err) {
          console.error(
            `[ERROR] Notion API row insert failed (attempt ${attempt}):`,
            err.message,
            JSON.stringify(pagePayload, null, 2)
          );
          if (attempt > MAX_RETRIES) {
            console.error("[ERROR] Max retries reached for row, skipping.");
            return null;
          }
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    };

    // Concurrency control
    const results = [];
    for (let i = 0; i < dataArray.length; i += concurrency) {
      const batch = dataArray.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(upsertOne));
      results.push(...batchResults);
    }
    return results;
  }

  // Get all available component types
  getAvailableComponentTypes() {
    return Object.keys(this.templates);
  }

  // Get all available templates for a component type
  getAvailableTemplates(componentType) {
    if (!this.templates[componentType]) {
      return [];
    }
    return Object.keys(this.templates[componentType]);
  }

  // Validate template data against template structure
  validateTemplateData(componentType, templateName, data) {
    const template = this.getTemplate(componentType, templateName);
    const errors = [];

    if (template.database && template.database.properties) {
      const requiredProperties = Object.keys(template.database.properties);

      requiredProperties.forEach((property) => {
        if (
          !data.hasOwnProperty(property) &&
          !data.hasOwnProperty(property.toLowerCase())
        ) {
          errors.push(`Missing required property: ${property}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();

// CLI/test entrypoint for mapping and doc generation
if (typeof require !== "undefined" && require.main === module) {
  const fs = require("fs");
  const path = process.argv[2];
  if (!path) {
    console.error(
      "Usage: node src/templates/templateManager.js <parsed-chunks.json>"
    );
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(path, "utf-8"));
  const subcomponents = Object.keys(parsed.chunks);
  for (const sub of subcomponents) {
    const template = new TemplateManager().getTemplate("profiles", sub);
    if (!template || !template.database) continue;
    const properties = Object.keys(template.database.properties);
    const chunk = parsed.chunks[sub][0] || [];
    if (chunk.length === 0) continue;
    // Print as Markdown table
    console.log(`\n### ${template.database.title}`);
    console.log("| " + properties.join(" | ") + " |");
    console.log("|" + properties.map(() => "---").join("|") + "|");
    for (const row of chunk) {
      const mapped = properties.map((p) => {
        const fn = (templateManager.subcomponentPropertyMaps || {})[sub]?.[p];
        let v = fn ? fn(row) : row[p] || row[p.toLowerCase()] || "";
        if (typeof v === "boolean") return v ? "✅" : "";
        return v;
      });
      console.log("| " + mapped.join(" | ") + " |");
    }
  }
}
