-- Table for Salesforce Objects
CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT UNIQUE,
    label TEXT,
    description TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for Fields
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    label TEXT,
    type TEXT,
    description TEXT,
    details_json TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Record Types
CREATE TABLE IF NOT EXISTS record_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    label TEXT,
    description TEXT,
    business_process TEXT,
    details_json TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Business Processes
CREATE TABLE IF NOT EXISTS business_processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    label TEXT,
    description TEXT,
    values_json TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Compact Layouts
CREATE TABLE IF NOT EXISTS compact_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    label TEXT,
    fields_json TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Validation Rules
CREATE TABLE IF NOT EXISTS validation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    description TEXT,
    error_condition_formula TEXT,
    error_message TEXT,
    active BOOLEAN,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Change Log
CREATE TABLE IF NOT EXISTS change_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_type TEXT,
    component_api_name TEXT,
    object_api_name TEXT,
    change_type TEXT,
    change_details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for List Views
CREATE TABLE IF NOT EXISTS list_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    api_name TEXT,
    label TEXT,
    details_json TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(object_id) REFERENCES objects(id)
);

-- Table for Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT UNIQUE,
    label TEXT,
    description TEXT,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_field_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    field TEXT,
    readable BOOLEAN,
    editable BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_object_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    object TEXT,
    allowCreate BOOLEAN,
    allowRead BOOLEAN,
    allowEdit BOOLEAN,
    allowDelete BOOLEAN,
    modifyAllRecords BOOLEAN,
    viewAllRecords BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    name TEXT,
    enabled BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_application_visibilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    application TEXT,
    visible BOOLEAN,
    default BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_class_accesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    apexClass TEXT,
    enabled BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_layout_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    layout TEXT,
    recordType TEXT,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_record_type_visibilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    recordType TEXT,
    visible BOOLEAN,
    default BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_tab_visibilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    tab TEXT,
    visibility TEXT,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_page_accesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    apexPage TEXT,
    enabled BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS profile_flow_accesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    flow TEXT,
    enabled BOOLEAN,
    details_json TEXT,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
);
