// Master Template for Salesforce Profiles
export const profileTemplate = {
  // --- Main Overview Page Structure ---
  overview: {
    title: "👤 {PROFILE_LABEL} ({PROFILE_API_NAME})",
    structure: [
      {
        type: "heading_1",
        content: "👤 {PROFILE_LABEL} (`{PROFILE_API_NAME}`)",
      },
      { type: "heading_2", content: "🔍 Overview" },
      {
        type: "bulleted_list",
        items: [
          "**API Name**: `{PROFILE_API_NAME}`",
          "**User License**: `{USER_LICENSE}`",
          "**Description**: {PROFILE_DESCRIPTION}",
          "**Purpose**: {PROFILE_PURPOSE}",
        ],
      },
      { type: "divider" },
      // --- Object Permissions Section ---
      { type: "heading_2", content: "🔐 Object Permissions" },
      {
        type: "database",
        database: {
          title: "🔐 {PROFILE_LABEL} - Object Permissions",
          properties: {
            Object: { type: "title" },
            Read: { type: "checkbox" },
            Create: { type: "checkbox" },
            Edit: { type: "checkbox" },
            Delete: { type: "checkbox" },
            "View All": { type: "checkbox" },
            "Modify All": { type: "checkbox" },
          },
        },
      },
      { type: "divider" },
      // --- Field-Level Security Section ---
      { type: "heading_2", content: "🔑 Field-Level Security (FLS)" },
      {
        type: "callout",
        content: "Field-level security tables for each object are shown below.",
      },
      { type: "divider" },
      // --- Page Layout Assignments Section ---
      { type: "heading_2", content: "📄 Page Layout Assignments" },
      {
        type: "paragraph",
        content: "If defined, list assigned layouts per object.",
      },
      { type: "divider" },
      // --- Record Type Visibility Section ---
      { type: "heading_2", content: "🔗 Record Type Visibility" },
      {
        type: "database",
        database: {
          title: "🔗 {PROFILE_LABEL} - Record Type Visibility",
          properties: {
            Object: { type: "title" },
            "Record Types Visible": { type: "rich_text" },
            Default: { type: "rich_text" },
          },
        },
      },
      { type: "divider" },
      // --- App and Tab Visibility Section ---
      { type: "heading_2", content: "🧱 App and Tab Visibility" },
      { type: "heading_3", content: "Apps" },
      {
        type: "database",
        database: {
          title: "🧱 {PROFILE_LABEL} - App Visibility",
          properties: {
            "App Label": { type: "title" },
            Visible: { type: "checkbox" },
            Default: { type: "checkbox" },
          },
        },
      },
      { type: "heading_3", content: "Tabs" },
      {
        type: "database",
        database: {
          title: "🧱 {PROFILE_LABEL} - Tab Visibility",
          properties: {
            "Tab Name": { type: "title" },
            Visibility: { type: "rich_text" },
          },
        },
      },
      { type: "divider" },
      // --- Administrative Permissions Section ---
      { type: "heading_2", content: "⚙️ Administrative Permissions" },
      {
        type: "database",
        database: {
          title: "⚙️ {PROFILE_LABEL} - Administrative Permissions",
          properties: {
            Permission: { type: "title" },
            Enabled: { type: "checkbox" },
          },
        },
      },
      { type: "divider" },
      // --- Login Access & Restrictions Section ---
      { type: "heading_2", content: "🔐 Login Access & Restrictions" },
      {
        type: "database",
        database: {
          title: "🔐 {PROFILE_LABEL} - Login Access & Restrictions",
          properties: {
            Setting: { type: "title" },
            Value: { type: "rich_text" },
          },
        },
      },
      { type: "divider" },
      // --- Flow & Apex Class Access Section ---
      { type: "heading_2", content: "🔁 Flow & Apex Class Access" },
      { type: "heading_3", content: "Apex Classes" },
      {
        type: "database",
        database: {
          title: "🔁 {PROFILE_LABEL} - Apex Class Access",
          properties: {
            "Apex Class": { type: "title" },
            Enabled: { type: "checkbox" },
          },
        },
      },
      { type: "heading_3", content: "Flows" },
      {
        type: "database",
        database: {
          title: "🔁 {PROFILE_LABEL} - Flow Access",
          properties: {
            Flow: { type: "title" },
            Enabled: { type: "checkbox" },
          },
        },
      },
      { type: "divider" },
      // --- Notes / Recommendations Section ---
      { type: "heading_2", content: "🧠 Notes / Recommendations" },
      {
        type: "bulleted_list",
        items: [
          "Mention any risk areas (e.g. excessive access, outdated object usage)",
          "Recommend use of Permission Sets if applicable",
        ],
      },
    ],
  },

  // --- Subcomponent Database Templates (for direct use) ---
  objectPermissions: {
    database: {
      title: "🔐 Object Permissions",
      properties: {
        Object: { type: "title" },
        Read: { type: "checkbox" },
        Create: { type: "checkbox" },
        Edit: { type: "checkbox" },
        Delete: { type: "checkbox" },
        "View All": { type: "checkbox" },
        "Modify All": { type: "checkbox" },
      },
    },
  },
  fieldPermissions: {
    database: {
      title: "🔑 Field-Level Security (FLS)",
      properties: {
        Object: { type: "rich_text" },
        Field: { type: "title" },
        Readable: { type: "checkbox" },
        Editable: { type: "checkbox" },
      },
    },
  },
  recordTypeVisibilities: {
    database: {
      title: "🔗 Record Type Visibility",
      properties: {
        Object: { type: "rich_text" },
        "Record Type": { type: "title" },
        Visible: { type: "checkbox" },
        Default: { type: "checkbox" },
      },
    },
  },
  applicationVisibilities: {
    database: {
      title: "🧱 App Visibility",
      properties: {
        Application: { type: "title" },
        Visible: { type: "checkbox" },
        Default: { type: "checkbox" },
      },
    },
  },
  tabVisibilities: {
    database: {
      title: "🧱 Tab Visibility",
      properties: {
        Tab: { type: "title" },
        Visibility: { type: "rich_text" },
      },
    },
  },
  classAccesses: {
    database: {
      title: "🔁 Apex Class Access",
      properties: {
        "Apex Class": { type: "title" },
        Enabled: { type: "checkbox" },
      },
    },
  },
  flowAccesses: {
    database: {
      title: "🔁 Flow Access",
      properties: {
        Flow: { type: "title" },
        Enabled: { type: "checkbox" },
      },
    },
  },
  userPermissions: {
    database: {
      title: "⚙️ Administrative Permissions",
      properties: {
        Permission: { type: "title" },
        Enabled: { type: "checkbox" },
      },
    },
  },
  layoutAssignments: {
    database: {
      title: "📄 Page Layout Assignments",
      properties: {
        Object: { type: "rich_text" },
        Layout: { type: "title" },
        RecordType: { type: "rich_text" },
      },
    },
  },
  pageAccesses: {
    database: {
      title: "🔐 Login Access & Restrictions",
      properties: {
        Page: { type: "title" },
        Enabled: { type: "checkbox" },
      },
    },
  },
};

// Helper to replace placeholders in strings
function replacePlaceholders(str, data) {
  // Only call .replace if str is a string
  if (typeof str !== "string") return str;
  return str.replace(/\{([A-Z0-9_]+)\}/g, (_, key) => data[key] || "");
}

// Render function for profile template
export function renderProfileTemplate(overview, data) {
  // Only process if structure is an array
  if (!overview.structure || !Array.isArray(overview.structure))
    return overview;
  return {
    ...overview,
    title: replacePlaceholders(overview.title, data),
    structure: overview.structure.map((item) => {
      if (typeof item === "string") return replacePlaceholders(item, data);
      if (item.items) {
        return {
          ...item,
          items: item.items.map((sub) => replacePlaceholders(sub, data)),
        };
      }
      return item;
    }),
  };
}
