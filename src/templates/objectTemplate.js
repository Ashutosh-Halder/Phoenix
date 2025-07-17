// Master Template for Salesforce Objects
export const objectTemplate = {
  // Main Object Overview Template
  overview: {
    title: "📋 {OBJECT_LABEL} ({OBJECT_API_NAME})",
    structure: [
      { type: "heading_1", content: "🗂️ {OBJECT_LABEL} (`{OBJECT_API_NAME}`)" },
      { type: "heading_2", content: "🔍 Overview Page" },
      {
        type: "bulleted_list",
        items: [
          "**Label**: {OBJECT_LABEL}",
          "**Plural Label**: {OBJECT_PLURAL_LABEL}",
          "**API Name**: `{OBJECT_API_NAME}`",
          "**Description**: {OBJECT_DESCRIPTION}",
          "**Record Type Count**: {RECORD_TYPE_COUNT}",
          "**Field Count**: {FIELD_COUNT}",
          "**Validation Rule Count**: {VALIDATION_RULE_COUNT}",
          "**Created By / Modified By**: {OBJECT_AUDIT_FIELDS}",
        ],
      },
      { type: "heading_2", content: "🧱 Fields Database" },
      {
        type: "paragraph",
        content:
          "See the full fields database below. Special logic in formulas or lookup filters is summarized as inline collapsible toggles.",
      },
      { type: "heading_2", content: "🧩 Record Types Database" },
      {
        type: "paragraph",
        content:
          "See the full record types database below. Include business logic if record type drives layouts, processes, or flows.",
      },
      { type: "heading_2", content: "📐 Compact Layouts" },
      {
        type: "paragraph",
        content:
          "See the full compact layouts database below. Highlight which layouts are used in Mobile vs Desktop.",
      },
      { type: "heading_2", content: "🧪 Validation Rules" },
      {
        type: "paragraph",
        content:
          "See the full validation rules database below. For each rule, details are provided including purpose, error message, error location, and logic breakdown.",
      },
      { type: "heading_2", content: "🔄 Process Automation" },
      { type: "heading_3", content: "Workflows" },
      { type: "paragraph", content: "See the full workflows database below." },
      { type: "heading_3", content: "Approval Processes" },
      {
        type: "paragraph",
        content: "See the full approval processes database below.",
      },
      { type: "heading_3", content: "Flow References" },
      {
        type: "paragraph",
        content: "See the full flow references database below.",
      },
      { type: "heading_2", content: "🔌 Integrations" },
      {
        type: "bulleted_list",
        items: [
          "Document any integration touchpoints related to this object:",
          "- External Systems: {OBJECT_EXTERNAL_SYSTEMS}",
          "- API Usage: {OBJECT_API_USAGE}",
          "- Custom Web Services: {OBJECT_CUSTOM_WEB_SERVICES}",
        ],
      },
      { type: "divider" },
      { type: "heading_2", content: "📝 Page Layouts" },
      { type: "paragraph", content: "Page Layout Structure" },
      {
        type: "code",
        content:
          'graph TD;\n    A["{LAYOUT_NAME}"] --> B["Section 1"];\n    A --> C["Section 2"];\n    B --> D["Field Group 1"];\n    B --> E["Field Group 2"];\n    C --> F["Related Lists"];',
        language: "mermaid",
      },
      { type: "heading_2", content: "🔐 Security Model" },
      {
        type: "paragraph",
        content: "See the full security model table below.",
      },
      { type: "heading_2", content: "📚 Documentation History" },
      {
        type: "paragraph",
        content: "See the documentation history table below.",
      },
    ],
  },

  // --- Database Definitions (unchanged) ---
  fields: {
    database: {
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
  },
  recordTypes: {
    database: {
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
  },
  validationRules: {
    database: {
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
  },
  businessProcesses: {
    database: {
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
  },
  compactLayouts: {
    database: {
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
  },
  listViews: {
    database: {
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
  // Relationships Template
  relationships: {
    database: {
      title: "🔗 {OBJECT_NAME} - Relationships",
      properties: {
        "Relationship Name": { type: "title" },
        Type: {
          type: "select",
          options: [
            { name: "Master-Detail", color: "red" },
            { name: "Lookup", color: "blue" },
            { name: "Many-to-Many", color: "green" },
            { name: "Self-Relationship", color: "purple" },
          ],
        },
        "Related Object": { type: "rich_text" },
        "Field API Name": { type: "rich_text" },
        Required: { type: "checkbox" },
        "Cascade Delete": { type: "checkbox" },
        Description: { type: "rich_text" },
        "Roll-up Summary Fields": { type: "rich_text" },
      },
    },
  },

  // Triggers Template
  triggers: {
    database: {
      title: "⚡ {OBJECT_NAME} - Triggers",
      properties: {
        "Trigger Name": { type: "title" },
        "API Name": { type: "rich_text" },
        Active: { type: "checkbox" },
        Events: {
          type: "select",
          options: [
            { name: "Before Insert", color: "blue" },
            { name: "After Insert", color: "green" },
            { name: "Before Update", color: "orange" },
            { name: "After Update", color: "purple" },
            { name: "Before Delete", color: "red" },
            { name: "After Delete", color: "pink" },
            { name: "After Undelete", color: "yellow" },
          ],
        },
        Description: { type: "rich_text" },
        "Handler Class": { type: "rich_text" },
        "Bulk Operations": { type: "checkbox" },
        Recursive: { type: "checkbox" },
        "Error Handling": { type: "rich_text" },
      },
    },
  },

  // Workflows Template
  workflows: {
    database: {
      title: "🔄 {OBJECT_NAME} - Workflows",
      properties: {
        "Workflow Name": { type: "title" },
        "API Name": { type: "rich_text" },
        Active: { type: "checkbox" },
        Type: {
          type: "select",
          options: [
            { name: "Field Update", color: "blue" },
            { name: "Email Alert", color: "green" },
            { name: "Task", color: "orange" },
            { name: "Outbound Message", color: "purple" },
          ],
        },
        Description: { type: "rich_text" },
        Trigger: { type: "rich_text" },
        Criteria: { type: "rich_text" },
        Actions: { type: "rich_text" },
      },
    },
  },

  // Security Template
  security: {
    database: {
      title: "🔐 {OBJECT_NAME} - Security & Sharing",
      properties: {
        "Security Component": { type: "title" },
        Type: {
          type: "select",
          options: [
            { name: "Sharing Rule", color: "blue" },
            { name: "Field Level Security", color: "green" },
            { name: "Object Permission", color: "orange" },
            { name: "Profile Permission", color: "purple" },
            { name: "Permission Set", color: "pink" },
          ],
        },
        Name: { type: "rich_text" },
        Active: { type: "checkbox" },
        Description: { type: "rich_text" },
        Criteria: { type: "rich_text" },
        "Access Level": { type: "rich_text" },
        "Target Users": { type: "rich_text" },
      },
    },
  },
};

// Flows Template
export const flowTemplate = {
  overview: {
    title: "🔁 {FLOW_NAME}",
    structure: [
      { type: "heading_1", content: "🔁 Flow - {FLOW_NAME}" },
      { type: "heading_2", content: "📋 Overview" },
      { type: "paragraph", content: "{FLOW_DESCRIPTION}" },
      { type: "heading_2", content: "🔄 Trigger Details" },
      {
        type: "bulleted_list",
        items: [
          "🧩 Trigger Type: {FLOW_PROCESS_TYPE}",
          "📦 Object: {OBJECT}",
          "⚙️ Operator: {OPERATOR}",
          "📝 Criteria: {CRITERIA}",
          "⏰ Schedule: {SCHEDULE}",
        ],
      },
      { type: "heading_2", content: "🧩 Flow Elements" },
      { type: "heading_3", content: "Variables" },
      { type: "paragraph", content: "{VARIABLES_TABLE}" },
      { type: "heading_3", content: "Input Parameters (if applicable)" },
      { type: "paragraph", content: "{INPUT_PARAMS_TABLE}" },
      { type: "heading_3", content: "Output Parameters (if applicable)" },
      { type: "paragraph", content: "{OUTPUT_PARAMS_TABLE}" },
      { type: "heading_2", content: "🔄 Process Flow" },
      { type: "code", content: "{MERMAID_DIAGRAM}", language: "mermaid" },
      {
        type: "numbered_list",
        items: ["Step 1: {STEP_1}", "Step 2: {STEP_2}", "..."],
      },
      { type: "heading_2", content: "🔗 Related Components" },
      {
        type: "bulleted_list",
        items: [
          "🧑‍💻 Apex Classes: {APEX_CLASSES}",
          "📦 Custom Objects: {CUSTOM_OBJECTS}",
          "🔁 Other Flows: {OTHER_FLOWS}",
        ],
      },
      { type: "heading_2", content: "⚠️ Considerations & Limitations" },
      {
        type: "bulleted_list",
        items: ["{LIMITATIONS}", "{PERFORMANCE}", "{BULK_NOTES}"],
      },
      { type: "heading_2", content: "🧪 Testing Notes" },
      {
        type: "bulleted_list",
        items: ["{TEST_SCENARIOS}", "{EXPECTED_OUTCOMES}", "{EDGE_CASES}"],
      },
      { type: "heading_2", content: "📝 Changelog" },
      { type: "paragraph", content: "{CHANGELOG_TABLE}" },
    ],
  },
};

// Template rendering functions
export function renderObjectTemplate(template, data) {
  let rendered = JSON.parse(JSON.stringify(template));

  // Replace placeholders with actual data
  const replacePlaceholders = (obj) => {
    if (typeof obj === "string") {
      return obj.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] || match;
      });
    } else if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(replacePlaceholders);
      } else {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = replacePlaceholders(value);
        }
        return newObj;
      }
    }
    return obj;
  };

  return replacePlaceholders(rendered);
}

// Helper function to get field type color
export function getFieldTypeColor(fieldType) {
  const colorMap = {
    Text: "blue",
    Number: "green",
    Date: "orange",
    DateTime: "orange",
    Boolean: "purple",
    Picklist: "pink",
    Reference: "yellow",
    Currency: "brown",
    Email: "blue",
    Phone: "blue",
    URL: "blue",
    "Long Text Area": "gray",
    "Rich Text Area": "gray",
    Location: "yellow",
  };
  return colorMap[fieldType] || "gray";
}

// Helper function to get validation rule purpose
export function getValidationPurpose(errorCondition, errorMessage) {
  const condition = errorCondition.toLowerCase();
  const message = errorMessage.toLowerCase();

  if (condition.includes("isblank") || condition.includes("isnull")) {
    return "Required Field Validation";
  } else if (condition.includes("len(") || condition.includes("length")) {
    return "Length Constraint Validation";
  } else if (condition.includes("regex") || condition.includes("contains")) {
    return "Format/Pattern Validation";
  } else if (condition.includes("date") || condition.includes("datetime")) {
    return "Date/Time Validation";
  } else if (condition.includes("amount") || condition.includes("currency")) {
    return "Financial Validation";
  } else if (condition.includes("stage") || condition.includes("status")) {
    return "Workflow State Validation";
  } else {
    return "Business Logic Validation";
  }
}
