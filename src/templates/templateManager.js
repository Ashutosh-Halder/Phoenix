import { objectTemplate, renderObjectTemplate } from "./objectTemplate.js";
import { flowTemplate } from "./objectTemplate.js";
import {
  fetchAllDatabaseRows,
  notionApiRequest,
} from "../notion/notionClient.js";

// Template Manager for all Salesforce components
export class TemplateManager {
  constructor() {
    this.templates = {
      objects: objectTemplate,
      flows: flowTemplate,
      // Future templates will be added here
      // fields: fieldTemplate,
      // validationRules: validationRuleTemplate,
      // workflows: workflowTemplate,
      // etc.
    };
  }

  // Get template for a specific component type
  getTemplate(componentType, templateName) {
    if (!this.templates[componentType]) {
      throw new Error(
        `Template for component type '${componentType}' not found`
      );
    }

    if (!this.templates[componentType][templateName]) {
      throw new Error(
        `Template '${templateName}' not found for component type '${componentType}'`
      );
    }

    return this.templates[componentType][templateName];
  }

  // Render a template with data
  renderTemplate(componentType, templateName, data) {
    const template = this.getTemplate(componentType, templateName);
    return renderObjectTemplate(template, data);
  }

  // Create Notion database from template
  async createDatabaseFromTemplate(
    componentType,
    templateName,
    data,
    parentPageId,
    notionClient
  ) {
    const template = this.renderTemplate(componentType, templateName, data);

    if (!template.database) {
      throw new Error(
        `Template '${templateName}' does not have a database structure`
      );
    }

    // Map template property types to Notion API property definitions
    const mapPropertyType = (property) => {
      switch (property.type) {
        case "title":
          return { title: {} };
        case "rich_text":
          return { rich_text: {} };
        case "select":
          return { select: { options: property.options || [] } };
        case "multi_select":
          return { multi_select: { options: property.options || [] } };
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
          return { relation: property.relation || {} };
        case "rollup":
          return { rollup: property.rollup || {} };
        case "formula":
          return { formula: property.formula || {} };
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
    };

    // Build the Notion properties object
    const notionProperties = {};
    for (const [name, prop] of Object.entries(template.database.properties)) {
      notionProperties[name] = mapPropertyType(prop);
    }

    const databasePayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [
        {
          text: {
            content: template.database.title,
          },
        },
      ],
      properties: notionProperties,
    };

    return await notionClient("/databases", "POST", databasePayload);
  }

  // Create Notion page from template
  async createPageFromTemplate(
    componentType,
    templateName,
    data,
    parentPageId,
    notionClient,
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

    const pagePayload = {
      parent: isDatabaseParent
        ? { database_id: parentPageId }
        : { type: "page_id", page_id: parentPageId },
      properties,
      children: children,
    };

    return await notionClient("/pages", "POST", pagePayload);
  }

  // Convert template structure to Notion blocks
  convertStructureToNotionBlocks(structure) {
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

        default:
          // Default to paragraph for unknown types
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: item.content || JSON.stringify(item),
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
    notionClient,
    allData = [], // pass all data for merge analysis if needed
    concurrency = 3 // limit parallel Notion API calls
  ) {
    // Accepts an array of data objects (fields, rules, etc.)
    if (!Array.isArray(dataArray)) dataArray = [dataArray];
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
    const upsertOne = async (data) => {
      const properties = {};

      // Explicit mapping for fields template
      const fieldPropertyMap = {
        "Field Name": (f) => f.label || f.api_name || "",
        "API Name": (f) => f.api_name || "",
        Type: (f) => f.type || "Other",
        Required: (f) =>
          f.details?.required === true || f.details?.required === "true",
        Unique: (f) =>
          f.details?.unique === true || f.details?.unique === "true",
        "External ID": (f) =>
          f.details?.externalId === true || f.details?.externalId === "true",
        Description: (f) => f.description || "",
        "Help Text": (f) => f.details?.inlineHelpText || "",
        "Default Value": (f) => f.details?.defaultValue || "",
        Formula: (f) => f.details?.formula || "",
        "Reference To": (f) =>
          Array.isArray(f.details?.referenceTo)
            ? f.details.referenceTo.join(", ")
            : f.details?.referenceTo || "",
        "Field Level Security": (f) => f.details?.fieldLevelSecurity || "",
      };

      // Explicit mapping for validationRules template
      const validationRulePropertyMap = {
        "Rule Name": (v) => v.label || v.api_name || "",
        "API Name": (v) => v.api_name || "",
        "Error Message": (v) => v.error_message || "",
        Active: (v) => Boolean(v.active),
        "Error Condition": (v) => v.error_condition_formula || "",
        Purpose: (v) =>
          typeof analyzeValidationRulePurpose === "function"
            ? analyzeValidationRulePurpose(
                v.error_condition_formula || "",
                v.error_message || ""
              )
            : "",
        "Logic Breakdown": (v) =>
          typeof analyzeValidationRuleLogic === "function"
            ? analyzeValidationRuleLogic(v.error_condition_formula || "")
            : "",
        "Merge Analysis": (v) =>
          typeof analyzeValidationRuleMerge === "function"
            ? analyzeValidationRuleMerge(v, v._allValidationRules || [])
            : "",
        "Impact Analysis": (v) => v.details?.impactAnalysis || "",
        "Testing Scenarios": (v) => v.details?.testingScenarios || "",
      };

      // Explicit mapping for recordTypes template
      const recordTypePropertyMap = {
        "Record Type Name": (r) => r.label || r.api_name || "",
        "API Name": (r) => r.api_name || "",
        Active: (r) =>
          r.details?.active === true || r.details?.active === "true",
        Description: (r) => r.description || r.details?.description || "",
        "Available Fields": (r) =>
          Array.isArray(r.details?.availableFields)
            ? r.details.availableFields.join(", ")
            : r.details?.availableFields || "",
        "Required Fields": (r) =>
          Array.isArray(r.details?.requiredFields)
            ? r.details.requiredFields.join(", ")
            : r.details?.requiredFields || "",
        "Page Layout": (r) => r.details?.pageLayout || "",
        "Business Process": (r) =>
          r.business_process || r.details?.businessProcess || "",
        "Picklist Values": (r) =>
          Array.isArray(r.details?.picklistValues)
            ? r.details.picklistValues.join(", ")
            : r.details?.picklistValues || "",
      };

      // Explicit mapping for businessProcesses template
      const businessProcessPropertyMap = {
        "Process Name": (b) => b.label || b.api_name || "",
        "API Name": (b) => b.api_name || "",
        Active: (b) =>
          b.details?.active === true || b.details?.active === "true",
        Description: (b) => b.description || b.details?.description || "",
        Stages: (b) =>
          Array.isArray(b.details?.stages)
            ? b.details.stages.join(", ")
            : b.details?.stages || "",
        "Entry Criteria": (b) => b.details?.entryCriteria || "",
        "Exit Criteria": (b) => b.details?.exitCriteria || "",
        "Related Record Types": (b) =>
          Array.isArray(b.details?.relatedRecordTypes)
            ? b.details.relatedRecordTypes.join(", ")
            : b.details?.relatedRecordTypes || "",
      };

      // Explicit mapping for compactLayouts template
      const compactLayoutPropertyMap = {
        "Layout Name": (c) => c.label || c.api_name || "",
        "API Name": (c) => c.api_name || "",
        Active: (c) =>
          c.details?.active === true || c.details?.active === "true",
        Description: (c) => c.details?.description || "",
        "Fields in Layout": (c) =>
          Array.isArray(c.details?.fields)
            ? c.details.fields.join(", ")
            : c.details?.fields || "",
        "Field Order": (c) =>
          Array.isArray(c.details?.fieldOrder)
            ? c.details.fieldOrder.join(", ")
            : c.details?.fieldOrder || "",
        "Related Record Types": (c) =>
          Array.isArray(c.details?.relatedRecordTypes)
            ? c.details.relatedRecordTypes.join(", ")
            : c.details?.relatedRecordTypes || "",
      };

      // Explicit mapping for listViews template
      const listViewPropertyMap = {
        "View Name": (l) => l.label || l.api_name || "",
        "API Name": (l) => l.api_name || "",
        Type: (l) => l.details?.type || "",
        Visible: (l) =>
          l.details?.visible === true || l.details?.visible === "true",
        Description: (l) => l.details?.description || "",
        "Filter Criteria": (l) => l.details?.filterCriteria || "",
        Columns: (l) =>
          Array.isArray(l.details?.columns)
            ? l.details.columns.join(", ")
            : l.details?.columns || "",
        "Sort Order": (l) => l.details?.sortOrder || "",
        Scope: (l) => l.details?.scope || "",
      };

      // Determine unique key for each template
      let uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "fields")
        uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "validationRules")
        uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "recordTypes")
        uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "businessProcesses")
        uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "compactLayouts")
        uniqueKey = "API Name";
      if (componentType === "objects" && templateName === "listViews")
        uniqueKey = "API Name";
      // Fetch all existing rows in the database (cache outside loop for batch)
      const existingRows = await fetchAllDatabaseRows(databaseId, uniqueKey);
      // Compute the value for the unique key for this data
      let uniqueValue = "";
      if (
        componentType === "objects" &&
        templateName === "fields" &&
        data.api_name
      )
        uniqueValue = data.api_name;
      else if (componentType === "objects" && data.api_name)
        uniqueValue = data.api_name;
      // If row exists, check for missing/incomplete columns
      const existing = existingRows[uniqueValue];
      // Build the Notion properties object for this row
      Object.keys(templateProperties).forEach((propertyName) => {
        let value = "";
        if (
          componentType === "objects" &&
          templateName === "fields" &&
          fieldPropertyMap[propertyName]
        ) {
          value = fieldPropertyMap[propertyName](data);
        } else if (
          componentType === "objects" &&
          templateName === "validationRules" &&
          validationRulePropertyMap[propertyName]
        ) {
          // For merge analysis, pass all validation rules
          if (["Merge Analysis"].includes(propertyName)) {
            data._allValidationRules = allData;
          }
          value = validationRulePropertyMap[propertyName](data);
        } else if (
          componentType === "objects" &&
          templateName === "recordTypes" &&
          recordTypePropertyMap[propertyName]
        ) {
          value = recordTypePropertyMap[propertyName](data);
        } else if (
          componentType === "objects" &&
          templateName === "businessProcesses" &&
          businessProcessPropertyMap[propertyName]
        ) {
          value = businessProcessPropertyMap[propertyName](data);
        } else if (
          componentType === "objects" &&
          templateName === "compactLayouts" &&
          compactLayoutPropertyMap[propertyName]
        ) {
          value = compactLayoutPropertyMap[propertyName](data);
        } else if (
          componentType === "objects" &&
          templateName === "listViews" &&
          listViewPropertyMap[propertyName]
        ) {
          value = listViewPropertyMap[propertyName](data);
        } else {
          value = data[propertyName] || data[propertyName.toLowerCase()] || "";
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
              (opt) => opt.name.toLowerCase() === String(value).toLowerCase()
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
            // Default to rich_text
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
      // If row does not exist, create it
      if (!existing) {
        const pagePayload = {
          parent: { database_id: databaseId },
          properties: properties,
        };
        return await notionClient("/pages", "POST", pagePayload);
      } else {
        // If row exists, check for missing/incomplete columns and update only those
        const updateProps = {};
        let needsUpdate = false;
        for (const key of Object.keys(properties)) {
          const prop = properties[key];
          const existingProp = existing.properties[key];
          // Check if the property is missing or blank
          let isBlank = false;
          if (!existingProp) isBlank = true;
          else if (
            existingProp.type === "title" &&
            (!existingProp.title ||
              existingProp.title.length === 0 ||
              !existingProp.title[0].plain_text)
          )
            isBlank = true;
          else if (
            existingProp.type === "rich_text" &&
            (!existingProp.rich_text ||
              existingProp.rich_text.length === 0 ||
              !existingProp.rich_text[0].plain_text)
          )
            isBlank = true;
          else if (
            existingProp.type === "select" &&
            (!existingProp.select || !existingProp.select.name)
          )
            isBlank = true;
          else if (
            existingProp.type === "checkbox" &&
            typeof existingProp.checkbox !== "boolean"
          )
            isBlank = true;
          else if (
            existingProp.type === "number" &&
            (existingProp.number === null || existingProp.number === undefined)
          )
            isBlank = true;
          // If blank, add to updateProps
          if (isBlank) {
            updateProps[key] = prop;
            needsUpdate = true;
          }
        }
        if (needsUpdate) {
          // Patch the page with only missing/incomplete columns
          return await notionApiRequest(`/pages/${existing.id}`, "PATCH", {
            properties: updateProps,
          });
        }
        // Otherwise, skip
        return null;
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
