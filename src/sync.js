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

export async function syncProfileToDb(
  parsed,
  api_name,
  label = null,
  description = null
) {
  const db = await getDb();
  // Upsert profile
  let profileId;
  const profileRow = await db.get(
    "SELECT id FROM profiles WHERE api_name = ?",
    api_name
  );
  if (profileRow) {
    await db.run(
      "UPDATE profiles SET label = ?, description = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
      label,
      description,
      profileRow.id
    );
    profileId = profileRow.id;
  } else {
    const result = await db.run(
      "INSERT INTO profiles (api_name, label, description) VALUES (?, ?, ?)",
      api_name,
      label,
      description
    );
    profileId = result.lastID;
  }
  // Upsert applicationVisibilities
  for (const av of parsed.applicationVisibilities) {
    await db.run(
      `INSERT INTO profile_application_visibilities (profile_id, application, visible, default, details_json) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, application) DO UPDATE SET visible=excluded.visible, default=excluded.default, details_json=excluded.details_json`,
      profileId,
      av.application,
      av.visible === "true" || av.visible === true,
      av.default === "true" || av.default === true,
      JSON.stringify(av)
    );
  }
  // Upsert classAccesses
  for (const ca of parsed.classAccesses) {
    await db.run(
      `INSERT INTO profile_class_accesses (profile_id, apexClass, enabled, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, apexClass) DO UPDATE SET enabled=excluded.enabled, details_json=excluded.details_json`,
      profileId,
      ca.apexClass,
      ca.enabled === "true" || ca.enabled === true,
      JSON.stringify(ca)
    );
  }
  // Upsert fieldPermissions
  for (const fp of parsed.fieldPermissions) {
    await db.run(
      `INSERT INTO profile_field_permissions (profile_id, field, readable, editable, details_json) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, field) DO UPDATE SET readable=excluded.readable, editable=excluded.editable, details_json=excluded.details_json`,
      profileId,
      fp.field,
      fp.readable === "true" || fp.readable === true,
      fp.editable === "true" || fp.editable === true,
      JSON.stringify(fp)
    );
  }
  // Upsert objectPermissions
  for (const op of parsed.objectPermissions) {
    await db.run(
      `INSERT INTO profile_object_permissions (profile_id, object, allowCreate, allowRead, allowEdit, allowDelete, modifyAllRecords, viewAllRecords, details_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, object) DO UPDATE SET allowCreate=excluded.allowCreate, allowRead=excluded.allowRead, allowEdit=excluded.allowEdit, allowDelete=excluded.allowDelete, modifyAllRecords=excluded.modifyAllRecords, viewAllRecords=excluded.viewAllRecords, details_json=excluded.details_json`,
      profileId,
      op.object,
      op.allowCreate === "true" || op.allowCreate === true,
      op.allowRead === "true" || op.allowRead === true,
      op.allowEdit === "true" || op.allowEdit === true,
      op.allowDelete === "true" || op.allowDelete === true,
      op.modifyAllRecords === "true" || op.modifyAllRecords === true,
      op.viewAllRecords === "true" || op.viewAllRecords === true,
      JSON.stringify(op)
    );
  }
  // Upsert userPermissions
  for (const up of parsed.userPermissions) {
    await db.run(
      `INSERT INTO profile_user_permissions (profile_id, name, enabled, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, name) DO UPDATE SET enabled=excluded.enabled, details_json=excluded.details_json`,
      profileId,
      up.name,
      up.enabled === "true" || up.enabled === true,
      JSON.stringify(up)
    );
  }
  // Upsert layoutAssignments
  for (const la of parsed.layoutAssignments) {
    await db.run(
      `INSERT INTO profile_layout_assignments (profile_id, layout, recordType, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, layout, recordType) DO UPDATE SET details_json=excluded.details_json`,
      profileId,
      la.layout,
      la.recordType,
      JSON.stringify(la)
    );
  }
  // Upsert recordTypeVisibilities
  for (const rtv of parsed.recordTypeVisibilities) {
    await db.run(
      `INSERT INTO profile_record_type_visibilities (profile_id, recordType, visible, default, details_json) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, recordType) DO UPDATE SET visible=excluded.visible, default=excluded.default, details_json=excluded.details_json`,
      profileId,
      rtv.recordType,
      rtv.visible === "true" || rtv.visible === true,
      rtv.default === "true" || rtv.default === true,
      JSON.stringify(rtv)
    );
  }
  // Upsert tabVisibilities
  for (const tv of parsed.tabVisibilities) {
    await db.run(
      `INSERT INTO profile_tab_visibilities (profile_id, tab, visibility, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, tab) DO UPDATE SET visibility=excluded.visibility, details_json=excluded.details_json`,
      profileId,
      tv.tab,
      tv.visibility,
      JSON.stringify(tv)
    );
  }
  // Upsert pageAccesses
  for (const pa of parsed.pageAccesses) {
    await db.run(
      `INSERT INTO profile_page_accesses (profile_id, apexPage, enabled, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, apexPage) DO UPDATE SET enabled=excluded.enabled, details_json=excluded.details_json`,
      profileId,
      pa.apexPage,
      pa.enabled === "true" || pa.enabled === true,
      JSON.stringify(pa)
    );
  }
  // Upsert flowAccesses
  for (const fa of parsed.flowAccesses) {
    await db.run(
      `INSERT INTO profile_flow_accesses (profile_id, flow, enabled, details_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, flow) DO UPDATE SET enabled=excluded.enabled, details_json=excluded.details_json`,
      profileId,
      fa.flow,
      fa.enabled === "true" || fa.enabled === true,
      JSON.stringify(fa)
    );
  }
  await db.close();
}
