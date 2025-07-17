const NOTION_API_URL = "https://api.notion.com/v1";

export async function notionApiRequest(endpoint, method = "GET", body = null) {
  // Use MCP server endpoint instead of direct Notion API
  const MCP_API_URL = process.env.MCP_API_URL || "http://localhost:3000";
  const url = `${MCP_API_URL}${endpoint}`;
  const headers = {
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion MCP API request failed: ${res.status} ${text}`);
  }

  return res.json();
}

// Legacy function for backward compatibility
export async function notionMcpRequest(endpoint, method = "POST", body = {}) {
  console.warn("notionMcpRequest is deprecated. Use notionApiRequest instead.");
  return notionApiRequest(endpoint, method, body);
}

// Fetch all pages from a Notion database and index by a property (e.g., API Name)
export async function fetchAllDatabaseRows(
  databaseId,
  propertyName = "API Name"
) {
  let results = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = {
      page_size: 100,
      start_cursor: startCursor,
    };
    const res = await notionApiRequest(
      `/databases/${databaseId}/query`,
      "POST",
      body
    );
    results = results.concat(res.results || []);
    hasMore = res.has_more;
    startCursor = res.next_cursor;
  }

  // Index by propertyName (assume property is rich_text or title)
  const index = {};
  for (const page of results) {
    const props = page.properties || {};
    let value = "";
    if (props[propertyName]) {
      if (
        props[propertyName].type === "title" &&
        props[propertyName].title.length > 0
      ) {
        value = props[propertyName].title[0].plain_text;
      } else if (
        props[propertyName].type === "rich_text" &&
        props[propertyName].rich_text.length > 0
      ) {
        value = props[propertyName].rich_text[0].plain_text;
      } else if (
        props[propertyName].type === "select" &&
        props[propertyName].select
      ) {
        value = props[propertyName].select.name;
      }
    }
    if (value) {
      index[value] = page;
    }
  }
  return index;
}

// Fetch all child databases of a page and index by title
export async function fetchChildDatabases(parentPageId) {
  let results = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    // Build query string for pagination
    let url = `/blocks/${parentPageId}/children?page_size=100`;
    if (startCursor) {
      url += `&start_cursor=${startCursor}`;
    }
    // GET requests should not have a body
    const res = await notionApiRequest(url, "GET");
    results = results.concat(res.results || []);
    hasMore = res.has_more;
    startCursor = res.next_cursor;
  }

  // Index by title
  const index = {};
  for (const block of results) {
    if (
      block.type === "child_database" &&
      block.child_database &&
      block.child_database.title
    ) {
      index[block.child_database.title] = block.id;
    }
  }
  return index;
}

// Example usage:
// await notionMcpRequest('/v1/pages', 'POST', { ... })
