import { notionMcpRequest } from "../notion/notionClient.js";

// Template Importer for using exported Notion templates
export class TemplateImporter {
  constructor() {
    this.templateStructure = {
      mainPage: {
        title: "📋 {OBJECT_NAME} - Object Documentation",
        structure: [
          {
            type: "heading_1",
            content: "{OBJECT_LABEL} ({OBJECT_API_NAME})",
          },
          {
            type: "paragraph",
            content: "{OBJECT_DESCRIPTION}",
          },
          {
            type: "heading_2",
            content: "📊 Object Summary",
          },
          {
            type: "bulleted_list",
            items: [
              "🔹 **Object Type:** {OBJECT_TYPE}",
              "🔹 **Deployment Status:** {DEPLOYMENT_STATUS}",
              "🔹 **Sharing Model:** {SHARING_MODEL}",
              "🔹 **External Object:** {IS_EXTERNAL}",
              "🔹 **Customizable:** {IS_CUSTOMIZABLE}",
              "🔹 **Queryable:** {IS_QUERYABLE}",
              "🔹 **Searchable:** {IS_SEARCHABLE}",
              "🔹 **Triggerable:** {IS_TRIGGERABLE}",
            ],
          },
          {
            type: "heading_2",
            content: "📈 Component Statistics",
          },
          {
            type: "bulleted_list",
            items: [
              "🏷️ **Fields:** {FIELD_COUNT}",
              "📝 **Record Types:** {RECORD_TYPE_COUNT}",
              "🔄 **Business Processes:** {BUSINESS_PROCESS_COUNT}",
              "📱 **Compact Layouts:** {COMPACT_LAYOUT_COUNT}",
              "✅ **Validation Rules:** {VALIDATION_RULE_COUNT}",
              "👁️ **List Views:** {LIST_VIEW_COUNT}",
              "🔐 **Sharing Rules:** {SHARING_RULE_COUNT}",
              "⚡ **Triggers:** {TRIGGER_COUNT}",
              "🔄 **Workflows:** {WORKFLOW_COUNT}",
              "📧 **Email Templates:** {EMAIL_TEMPLATE_COUNT}",
            ],
          },
        ],
      },
      databases: {
        fields: {
          title: "🏷️ {OBJECT_NAME} - All Fields",
          properties: {
            "Field Name": { type: "title" },
            "API Name": { type: "rich_text" },
            Type: {
              type: "select",
              options: [
                { name: "Text", color: "blue" },
                { name: "Number", color: "green" },
                { name: "Date", color: "orange" },
                { name: "DateTime", color: "orange" },
                { name: "Boolean", color: "purple" },
                { name: "Picklist", color: "pink" },
                { name: "Multi-Select Picklist", color: "pink" },
                { name: "Reference", color: "yellow" },
                { name: "Currency", color: "brown" },
                { name: "Percent", color: "green" },
                { name: "Email", color: "blue" },
                { name: "Phone", color: "blue" },
                { name: "URL", color: "blue" },
                { name: "Long Text Area", color: "gray" },
                { name: "Rich Text Area", color: "gray" },
                { name: "Location", color: "yellow" },
                { name: "Other", color: "gray" },
              ],
            },
            Required: { type: "checkbox" },
            Unique: { type: "checkbox" },
            "External ID": { type: "checkbox" },
            Description: { type: "rich_text" },
            "Help Text": { type: "rich_text" },
            "Default Value": { type: "rich_text" },
            Formula: { type: "rich_text" },
            "Reference To": { type: "rich_text" },
            "Field Level Security": { type: "rich_text" },
          },
        },
        validationRules: {
          title: "✅ {OBJECT_NAME} - Validation Rules",
          properties: {
            "Rule Name": { type: "title" },
            "API Name": { type: "rich_text" },
            "Error Message": { type: "rich_text" },
            Active: { type: "checkbox" },
            "Error Condition": { type: "rich_text" },
            Purpose: { type: "rich_text" },
            "Logic Breakdown": { type: "rich_text" },
            "Merge Analysis": { type: "rich_text" },
            "Impact Analysis": { type: "rich_text" },
            "Testing Scenarios": { type: "rich_text" },
          },
        },
        recordTypes: {
          title: "📝 {OBJECT_NAME} - Record Types",
          properties: {
            "Record Type Name": { type: "title" },
            "API Name": { type: "rich_text" },
            Active: { type: "checkbox" },
            Description: { type: "rich_text" },
            "Available Fields": { type: "rich_text" },
            "Required Fields": { type: "rich_text" },
            "Page Layout": { type: "rich_text" },
            "Business Process": { type: "rich_text" },
            "Picklist Values": { type: "rich_text" },
          },
        },
        businessProcesses: {
          title: "🔄 {OBJECT_NAME} - Business Processes",
          properties: {
            "Process Name": { type: "title" },
            "API Name": { type: "rich_text" },
            Active: { type: "checkbox" },
            Description: { type: "rich_text" },
            Stages: { type: "rich_text" },
            "Entry Criteria": { type: "rich_text" },
            "Exit Criteria": { type: "rich_text" },
            "Related Record Types": { type: "rich_text" },
          },
        },
        compactLayouts: {
          title: "📱 {OBJECT_NAME} - Compact Layouts",
          properties: {
            "Layout Name": { type: "title" },
            "API Name": { type: "rich_text" },
            Active: { type: "checkbox" },
            Description: { type: "rich_text" },
            "Fields in Layout": { type: "rich_text" },
            "Field Order": { type: "rich_text" },
            "Related Record Types": { type: "rich_text" },
          },
        },
        listViews: {
          title: "👁️ {OBJECT_NAME} - List Views",
          properties: {
            "View Name": { type: "title" },
            "API Name": { type: "rich_text" },
            Type: {
              type: "select",
              options: [
                { name: "Standard", color: "blue" },
                { name: "Custom", color: "green" },
                { name: "Recent", color: "orange" },
              ],
            },
            Visible: { type: "checkbox" },
            Description: { type: "rich_text" },
            "Filter Criteria": { type: "rich_text" },
            Columns: { type: "rich_text" },
            "Sort Order": { type: "rich_text" },
            Scope: { type: "rich_text" },
          },
        },
      },
    };
  }

  // Create complete object documentation from template
  async createObjectDocumentation(objectData, parentPageId) {
    console.log("🚀 Creating object documentation from template...");

    try {
      // 1. Create main documentation page
      const mainPage = await this.createMainPage(objectData, parentPageId);
      console.log("✅ Main page created:", mainPage.id);

      // 2. Create all databases
      const databases = {};

      for (const [dbName, dbTemplate] of Object.entries(
        this.templateStructure.databases
      )) {
        if (objectData[`${dbName.toUpperCase()}_COUNT`] > 0) {
          console.log(`📊 Creating ${dbName} database...`);
          const database = await this.createDatabase(
            dbTemplate,
            objectData,
            mainPage.id
          );
          databases[dbName] = database;
          console.log(`✅ ${dbName} database created:`, database.id);
        }
      }

      return {
        mainPage,
        databases,
      };
    } catch (error) {
      console.error("❌ Template import failed:", error);
      throw error;
    }
  }

  // Create main documentation page
  async createMainPage(objectData, parentPageId) {
    const template = this.templateStructure.mainPage;
    const title = this.replacePlaceholders(template.title, objectData);

    const children = this.convertStructureToNotionBlocks(
      template.structure,
      objectData
    );

    const pagePayload = {
      parent: { type: "page_id", page_id: parentPageId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: children,
    };

    return await notionMcpRequest("/pages", "POST", pagePayload);
  }

  // Create database from template
  async createDatabase(dbTemplate, objectData, parentPageId) {
    const title = this.replacePlaceholders(dbTemplate.title, objectData);

    const databasePayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [
        {
          text: {
            content: title,
          },
        },
      ],
      properties: dbTemplate.properties,
    };

    return await notionMcpRequest("/databases", "POST", databasePayload);
  }

  // Replace placeholders in template
  replacePlaceholders(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Convert template structure to Notion blocks
  convertStructureToNotionBlocks(structure, data) {
    const blocks = [];

    structure.forEach((item) => {
      switch (item.type) {
        case "heading_1":
          blocks.push({
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                {
                  text: {
                    content: this.replacePlaceholders(item.content, data),
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
                    content: this.replacePlaceholders(item.content, data),
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
                    content: this.replacePlaceholders(item.content, data),
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
                        content: this.replacePlaceholders(listItem, data),
                      },
                    },
                  ],
                },
              });
            });
          }
          break;
      }
    });

    return blocks;
  }

  // Add data to database from template
  async addDataToDatabase(databaseId, dbTemplate, data) {
    const properties = {};
    const templateProperties = dbTemplate.properties;

    // Map data to template properties
    Object.keys(templateProperties).forEach((propertyName) => {
      const propertyType = templateProperties[propertyName].type;
      const value =
        data[propertyName] || data[propertyName.toLowerCase()] || "";

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
            (opt) => opt.name.toLowerCase() === String(value).toLowerCase()
          );
          properties[propertyName] = {
            select: matchingOption ? { name: matchingOption.name } : null,
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
    });

    const pagePayload = {
      parent: { database_id: databaseId },
      properties: properties,
    };

    return await notionMcpRequest("/pages", "POST", pagePayload);
  }

  // Get template structure for a specific component
  getTemplateStructure(componentType) {
    return (
      this.templateStructure[componentType] ||
      this.templateStructure.databases[componentType]
    );
  }

  // Validate template data
  validateTemplateData(objectData) {
    const requiredFields = [
      "OBJECT_NAME",
      "OBJECT_LABEL",
      "OBJECT_API_NAME",
      "OBJECT_DESCRIPTION",
    ];

    const errors = [];

    requiredFields.forEach((field) => {
      if (!objectData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

// Export singleton instance
export const templateImporter = new TemplateImporter();
