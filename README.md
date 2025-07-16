# Salesforce Metadata to Notion CLI

A CLI tool to parse Salesforce org metadata XML (starting with Objects), store context in SQLite, and generate/update hierarchical Notion documentation with tables, lists, and flowcharts.

## Features

- Watches Salesforce metadata folders for changes
- Parses XML for Objects, Fields, Record Types, Business Processes, etc.
- Stores parsed data and change history in SQLite
- Syncs to Notion: creates/updates hierarchical pages, appends changes with timestamps
- Supports tables, lists, and flowcharts (Mermaid)
- Modular for future expansion (Flows, Apex, Profiles, etc.)

## Setup

1. Clone this repo and `cd` into the directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Notion API credentials (see `src/notion/notionClient.js`)

## Usage

- `npm run watch` — Watch for file changes and auto-sync
- `npm run sync` — Manual one-time sync
- `npm start` — Run CLI tool (see options)

## Architecture

```
/cli-tool/
  /src/
    parser/         # XML parsing logic
    db/             # SQLite schema and access
    notion/         # Notion API integration
    watcher.js      # File watching logic
    cli.js          # CLI entry point
```

## Expansion

- Add support for Flows, Apex, Profiles, PermissionSets, Org Architecture, etc.

## License

MIT
