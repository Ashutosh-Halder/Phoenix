import "dotenv/config";
import path from "path";
import { parseObject } from "./parser/objectParser.js";
import { syncOpportunityFromDbToNotion } from "./notion/sync.js";
import { syncObjectToDb } from "./sync.js";
import { templateManager } from "./templates/templateManager.js";
import { templateImporter } from "./templates/templateImporter.js";
import fs from "fs";
import { syncObjectToNotion } from "./notion/sync.js";
import { parseFlow } from "./parser/flowParser.js";
import { syncFlowToDb } from "./sync.js";
import { syncFlowToNotion } from "./notion/sync.js";

const opportunityDir = path.resolve("Opportunity");

async function main() {
  const arg = process.argv[2];

  if (arg === "notion-dryrun") {
    await syncOpportunityFromDbToNotion();
    return;
  }

  if (arg === "sync-notion") {
    // Support --objects-path argument
    const objectsPathArg = process.argv.find((a) =>
      a.startsWith("--objects-path")
    );
    let objectsPath = null;
    if (objectsPathArg) {
      const split = objectsPathArg.split("=");
      objectsPath =
        split.length > 1
          ? split[1]
          : process.argv[process.argv.indexOf(objectsPathArg) + 1];
    }

    if (objectsPath) {
      // Iterate all subdirectories (objects)
      const objectDirs = fs.readdirSync(objectsPath).filter((f) => {
        const full = path.join(objectsPath, f);
        return fs.statSync(full).isDirectory();
      });
      for (const objDir of objectDirs) {
        const fullPath = path.join(objectsPath, objDir);
        try {
          const parsed = parseObject(fullPath);
          if (parsed && parsed.object && parsed.object.api_name) {
            console.log(`\n--- Syncing object: ${parsed.object.api_name} ---`);
            await syncObjectToNotion(parsed);
          } else {
            console.warn(
              `Skipping ${objDir}: could not parse object metadata.`
            );
          }
        } catch (e) {
          console.error(`Error syncing ${objDir}:`, e.message);
        }
      }
      return;
    } else {
      // Fallback: sync Opportunity only (legacy)
      await syncOpportunityFromDbToNotion();
      return;
    }
  }

  if (arg === "sync-db") {
    const parsed = parseObject(opportunityDir);
    console.log("Parsed object:", JSON.stringify(parsed, null, 2));
    await syncObjectToDb(parsed);
    console.log("DB sync complete.");
    return;
  }

  if (arg === "sync-flows") {
    // Support --flows-path argument
    const flowsPathArg = process.argv.find((a) => a.startsWith("--flows-path"));
    let flowsPath = null;
    if (flowsPathArg) {
      const split = flowsPathArg.split("=");
      flowsPath =
        split.length > 1
          ? split[1]
          : process.argv[process.argv.indexOf(flowsPathArg) + 1];
    }
    if (flowsPath) {
      // Iterate all .flow-meta.xml files
      const flowFiles = fs
        .readdirSync(flowsPath)
        .filter((f) => f.endsWith(".flow-meta.xml"));
      for (const flowFile of flowFiles) {
        const fullPath = path.join(flowsPath, flowFile);
        try {
          const parsed = parseFlow(fullPath);
          if (parsed && parsed.api_name) {
            console.log(`\n--- Syncing flow: ${parsed.api_name} ---`);
            await syncFlowToDb(parsed);
            await syncFlowToNotion(parsed);
          } else {
            console.warn(
              `Skipping ${flowFile}: could not parse flow metadata.`
            );
          }
        } catch (e) {
          console.error(`Error syncing ${flowFile}:`, e.message);
        }
      }
      return;
    } else {
      console.warn("No --flows-path provided for sync-flows command.");
      return;
    }
  }

  if (arg === "sync-flow-single") {
    // Support --file argument
    const fileArg = process.argv.find((a) => a.startsWith("--file"));
    let flowFile = null;
    if (fileArg) {
      const split = fileArg.split("=");
      flowFile =
        split.length > 1
          ? split[1]
          : process.argv[process.argv.indexOf(fileArg) + 1];
    }
    if (flowFile) {
      try {
        const parsed = parseFlow(flowFile);
        if (parsed && parsed.api_name) {
          console.log(`\n--- Syncing flow: ${parsed.api_name} ---`);
          await syncFlowToDb(parsed);
          await syncFlowToNotion(parsed);
        } else {
          console.warn(`Could not parse flow metadata from file: ${flowFile}`);
        }
      } catch (e) {
        console.error(`Error syncing ${flowFile}:`, e.message);
      }
      return;
    } else {
      console.warn("No --file provided for sync-flow-single command.");
      return;
    }
  }

  if (arg === "templates") {
    console.log("🎯 Salesforce Documentation Templates");
    console.log("=====================================\n");

    const componentTypes = templateManager.getAvailableComponentTypes();
    console.log("Available Component Types:");
    componentTypes.forEach((type) => {
      console.log(`  📁 ${type}`);
      const templates = templateManager.getAvailableTemplates(type);
      templates.forEach((template) => {
        console.log(`    └── ${template}`);
      });
    });

    console.log("\n📋 Template Usage Examples:");
    console.log("  node src/cli.js templates");
    console.log("  node src/cli.js template-demo");
    console.log("  node src/cli.js template-import");
    return;
  }

  if (arg === "template-demo") {
    console.log("🚀 Template System Demo");
    console.log("=======================\n");

    // Demo data for Opportunity object
    const demoData = {
      OBJECT_NAME: "Opportunity",
      OBJECT_LABEL: "Opportunity",
      OBJECT_API_NAME: "Opportunity",
      OBJECT_DESCRIPTION: "Represents a sales opportunity in the CRM system",
      OBJECT_TYPE: "Custom Object",
      DEPLOYMENT_STATUS: "Deployed",
      SHARING_MODEL: "Read/Write",
      IS_EXTERNAL: "No",
      IS_CUSTOMIZABLE: "Yes",
      IS_QUERYABLE: "Yes",
      IS_SEARCHABLE: "Yes",
      IS_TRIGGERABLE: "Yes",
      FIELD_COUNT: "156",
      RECORD_TYPE_COUNT: "5",
      BUSINESS_PROCESS_COUNT: "4",
      COMPACT_LAYOUT_COUNT: "3",
      VALIDATION_RULE_COUNT: "19",
      LIST_VIEW_COUNT: "18",
      SHARING_RULE_COUNT: "2",
      TRIGGER_COUNT: "3",
      WORKFLOW_COUNT: "8",
      EMAIL_TEMPLATE_COUNT: "5",
    };

    try {
      // Render overview template
      const overviewTemplate = templateManager.renderTemplate(
        "objects",
        "overview",
        demoData
      );
      console.log("✅ Overview Template Rendered:");
      console.log("Title:", overviewTemplate.title);
      console.log("Structure Items:", overviewTemplate.structure.length);

      // Render fields template
      const fieldsTemplate = templateManager.renderTemplate(
        "objects",
        "fields",
        demoData
      );
      console.log("\n✅ Fields Template Rendered:");
      console.log("Database Title:", fieldsTemplate.database.title);
      console.log(
        "Properties:",
        Object.keys(fieldsTemplate.database.properties).length
      );

      // Render validation rules template
      const validationTemplate = templateManager.renderTemplate(
        "objects",
        "validationRules",
        demoData
      );
      console.log("\n✅ Validation Rules Template Rendered:");
      console.log("Database Title:", validationTemplate.database.title);
      console.log(
        "Properties:",
        Object.keys(validationTemplate.database.properties).length
      );

      // Validate template data
      const validation = templateManager.validateTemplateData(
        "objects",
        "overview",
        demoData
      );
      console.log("\n✅ Template Validation:");
      console.log("Is Valid:", validation.isValid);
      if (!validation.isValid) {
        console.log("Errors:", validation.errors);
      }

      console.log("\n🎉 Template system is working correctly!");
      console.log("\nNext steps:");
      console.log(
        "1. Use 'node src/cli.js sync-notion' to create documentation with templates"
      );
      console.log(
        "2. Use 'node src/cli.js template-import' to create from exported template"
      );
      console.log("3. Add more component templates (fields, workflows, etc.)");
      console.log("4. Customize templates for your specific needs");
    } catch (error) {
      console.error("❌ Template demo failed:", error.message);
    }
    return;
  }

  if (arg === "template-import") {
    console.log("📦 Template Import Demo");
    console.log("=======================\n");

    // Demo data for Opportunity object
    const demoData = {
      OBJECT_NAME: "Opportunity",
      OBJECT_LABEL: "Opportunity",
      OBJECT_API_NAME: "Opportunity",
      OBJECT_DESCRIPTION: "Represents a sales opportunity in the CRM system",
      OBJECT_TYPE: "Custom Object",
      DEPLOYMENT_STATUS: "Deployed",
      SHARING_MODEL: "Read/Write",
      IS_EXTERNAL: "No",
      IS_CUSTOMIZABLE: "Yes",
      IS_QUERYABLE: "Yes",
      IS_SEARCHABLE: "Yes",
      IS_TRIGGERABLE: "Yes",
      FIELD_COUNT: "156",
      RECORD_TYPE_COUNT: "5",
      BUSINESS_PROCESS_COUNT: "4",
      COMPACT_LAYOUT_COUNT: "3",
      VALIDATION_RULE_COUNT: "19",
      LIST_VIEW_COUNT: "18",
      SHARING_RULE_COUNT: "2",
      TRIGGER_COUNT: "3",
      WORKFLOW_COUNT: "8",
      EMAIL_TEMPLATE_COUNT: "5",
    };

    try {
      // Validate template data
      const validation = templateImporter.validateTemplateData(demoData);
      console.log("✅ Template Data Validation:");
      console.log("Is Valid:", validation.isValid);
      if (!validation.isValid) {
        console.log("Errors:", validation.errors);
        return;
      }

      // Create documentation in workspace (no parent page)
      console.log("🚀 Creating object documentation from template...");

      // Search for an accessible page to use as parent
      const { notionMcpRequest } = await import("./notion/notionClient.js");
      const searchResult = await notionMcpRequest("/search", "POST", {
        filter: { property: "object", value: "page" },
        page_size: 1,
      });

      let parentPageId;
      if (searchResult.results && searchResult.results.length > 0) {
        parentPageId = searchResult.results[0].id;
        console.log("✅ Using existing page as parent:", parentPageId);
      } else {
        console.log("❌ No accessible pages found");
        return;
      }

      // Create documentation using template importer
      const result = await templateImporter.createObjectDocumentation(
        demoData,
        parentPageId
      );

      console.log("\n🎉 Template import completed successfully!");
      console.log("Main Page ID:", result.mainPage.id);
      console.log("Main Page URL:", result.mainPage.url);
      console.log("\nCreated Databases:");
      Object.entries(result.databases).forEach(([name, db]) => {
        console.log(`  📊 ${name}: ${db.id}`);
      });

      console.log("\n📋 Next Steps:");
      console.log("1. Add data to the databases using the template structure");
      console.log("2. Customize the template for your specific needs");
      console.log("3. Use this as a master template for other objects");
      console.log("4. Export this as a new template for reuse");
    } catch (error) {
      console.error("❌ Template import failed:", error.message);
    }
    return;
  }

  // Default: parse and display object
  const parsed = parseObject(opportunityDir);
  console.dir(parsed, { depth: 3 });
}

main();
