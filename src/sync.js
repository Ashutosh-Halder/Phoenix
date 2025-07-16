import { getDb } from "./db/db.js";

// Upsert object and fields into DB
export async function syncObjectToDb(parsed) {
  const db = await getDb();
  // Upsert object
  const { api_name, label, description } = parsed.object;
  let objectId;
  const objRow = await db.get(
    "SELECT id FROM objects WHERE api_name = ?",
    api_name
  );
  if (objRow) {
    await db.run(
      "UPDATE objects SET label = ?, description = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
      label,
      description,
      objRow.id
    );
    objectId = objRow.id;
  } else {
    const result = await db.run(
      "INSERT INTO objects (api_name, label, description) VALUES (?, ?, ?)",
      api_name,
      label,
      description
    );
    objectId = result.lastID;
  }
  // Upsert fields
  for (const field of parsed.fields) {
    const { api_name, label, type, description, details } = field;
    const fieldRow = await db.get(
      "SELECT id FROM fields WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (fieldRow) {
      await db.run(
        "UPDATE fields SET label = ?, type = ?, description = ?, details_json = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        label,
        type,
        description,
        JSON.stringify(details),
        fieldRow.id
      );
    } else {
      await db.run(
        "INSERT INTO fields (object_id, api_name, label, type, description, details_json) VALUES (?, ?, ?, ?, ?, ?)",
        objectId,
        api_name,
        label,
        type,
        description,
        JSON.stringify(details)
      );
    }
  }
  // Upsert record types
  for (const rt of parsed.recordTypes) {
    const { api_name, label, description, details } = rt;
    const rtRow = await db.get(
      "SELECT id FROM record_types WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (rtRow) {
      await db.run(
        "UPDATE record_types SET label = ?, description = ?, details_json = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        label,
        description,
        JSON.stringify(details),
        rtRow.id
      );
    } else {
      await db.run(
        "INSERT INTO record_types (object_id, api_name, label, description, details_json) VALUES (?, ?, ?, ?, ?)",
        objectId,
        api_name,
        label,
        description,
        JSON.stringify(details)
      );
    }
  }
  // Upsert business processes (use values_json)
  for (const bp of parsed.businessProcesses) {
    const { api_name, label, description, details } = bp;
    const bpRow = await db.get(
      "SELECT id FROM business_processes WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (bpRow) {
      await db.run(
        "UPDATE business_processes SET label = ?, description = ?, values_json = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        label,
        description,
        JSON.stringify(details),
        bpRow.id
      );
    } else {
      await db.run(
        "INSERT INTO business_processes (object_id, api_name, label, description, values_json) VALUES (?, ?, ?, ?, ?)",
        objectId,
        api_name,
        label,
        description,
        JSON.stringify(details)
      );
    }
  }
  // Upsert compact layouts (use fields_json)
  for (const cl of parsed.compactLayouts) {
    const { api_name, label, details } = cl;
    const clRow = await db.get(
      "SELECT id FROM compact_layouts WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (clRow) {
      await db.run(
        "UPDATE compact_layouts SET label = ?, fields_json = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        label,
        JSON.stringify(details),
        clRow.id
      );
    } else {
      await db.run(
        "INSERT INTO compact_layouts (object_id, api_name, label, fields_json) VALUES (?, ?, ?, ?)",
        objectId,
        api_name,
        label,
        JSON.stringify(details)
      );
    }
  }
  // Upsert validation rules (match schema)
  for (const vr of parsed.validationRules) {
    const {
      api_name,
      description,
      error_condition_formula,
      error_message,
      active,
    } = vr;
    const vrRow = await db.get(
      "SELECT id FROM validation_rules WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (vrRow) {
      await db.run(
        "UPDATE validation_rules SET description = ?, error_condition_formula = ?, error_message = ?, active = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        description,
        error_condition_formula,
        error_message,
        active,
        vrRow.id
      );
    } else {
      await db.run(
        "INSERT INTO validation_rules (object_id, api_name, description, error_condition_formula, error_message, active) VALUES (?, ?, ?, ?, ?, ?)",
        objectId,
        api_name,
        description,
        error_condition_formula,
        error_message,
        active
      );
    }
  }
  // Upsert list views
  for (const lv of parsed.listViews) {
    const { api_name, label, details } = lv;
    const lvRow = await db.get(
      "SELECT id FROM list_views WHERE api_name = ? AND object_id = ?",
      api_name,
      objectId
    );
    if (lvRow) {
      await db.run(
        "UPDATE list_views SET label = ?, details_json = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        label,
        JSON.stringify(details),
        lvRow.id
      );
    } else {
      await db.run(
        "INSERT INTO list_views (object_id, api_name, label, details_json) VALUES (?, ?, ?, ?)",
        objectId,
        api_name,
        label,
        JSON.stringify(details)
      );
    }
  }
  await db.close();
}
