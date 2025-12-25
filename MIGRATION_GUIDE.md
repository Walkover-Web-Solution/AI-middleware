# API Call Format Comparison

## Before Migration (Mixed Formats)

### Format 1 (Old - Array-based fields)
```json
{
  "_id": "66386af561a4937ebbb5b254",
  "org_id": "1249",
  "bridge_id": "65eed0b9723dfaa329f4cb51",
  "function_name": "scriMgpUGY4l",
  "fields": [                              ← ARRAY FORMAT
    {
      "variable_name": "limit",
      "description": "",
      "enum": ""
    },
    {
      "variable_name": "pageNo",
      "description": "",
      "enum": ""
    }
  ],
  "required_params": ["limit", "pageNo"],
  "code": "def axios_call(params)...",    ← Python code
  "is_python": 1,                         ← Deprecated field
  "bridge_ids": []                        ← Empty array
}
```

### Format 2 (New - Object-based fields)
```json
{
  "_id": "66290dd2910af758d6a4c0b8",
  "org_id": "1289",
  "bridge_id": "65e5bb925d22b5bb59f07d36",
  "function_name": "scrielBNwPh6",
  "fields": {                              ← OBJECT FORMAT
    "name": {
      "description": "",
      "type": "string",
      "enum": [],
      "required_params": [],
      "parameter": {}
    }
  },
  "version": "v2",                         ← Version marker
  "status": 1,                             ← Status field
  "bridge_ids": ["661a512ae0c3d82d12f2b9d6"], ← Populated array
  "old_fields": { ... }                    ← Backup
}
```

---

## After Migration (Standardized V2)

### All Documents Now Follow This Format
```json
{
  "_id": "66386af561a4937ebbb5b254",
  "org_id": "1249",
  "bridge_id": "65eed0b9723dfaa329f4cb51",
  "function_name": "scriMgpUGY4l",
  
  "fields": {                              ✓ Standardized OBJECT format
    "limit": {
      "description": "",
      "type": "string",
      "enum": [],
      "required_params": [],
      "parameter": {}
    },
    "pageNo": {
      "description": "",
      "type": "string",
      "enum": [],
      "required_params": [],
      "parameter": {}
    }
  },
  
  "old_fields": [                          ✓ Original fields backed up
    {
      "variable_name": "limit",
      "description": "",
      "enum": ""
    }
  ],
  
  "version": "v2",                         ✓ Version marked
  "status": 1,                             ✓ Status added
  "bridge_ids": ["65eed0b9723dfaa329f4cb51"], ✓ Migrated from bridge_id
  "required_params": ["limit", "pageNo"],
  "updated_at": "2025-12-25T10:30:00.000Z" ✓ Migration timestamp
  
  // Removed fields:
  // ✗ "code" - removed
  // ✗ "is_python" - removed
  // ✗ "endpoint_name" - removed (migrated to title if needed)
}
```

---

## Endpoint Name → Title Migration

The migration consolidates `endpoint_name` and `title` fields:

### Rules:
1. **If `title` is null/empty AND `endpoint_name` has a value:**
   - Copy `endpoint_name` value to `title`
   - Delete `endpoint_name` field

2. **If `title` already has a value:**
   - Keep `title` as is
   - Delete `endpoint_name` field

3. **Always remove `endpoint_name` field**

### Examples:

```javascript
// Case 1: title is null, endpoint_name has value
// BEFORE
{ 
  title: null,
  endpoint_name: "Get User Data"
}

// AFTER
{ 
  title: "Get User Data"  // ✓ Copied from endpoint_name
  // endpoint_name is removed
}

// Case 2: title exists, endpoint_name exists
// BEFORE
{ 
  title: "Fetch Users",
  endpoint_name: "Get User Data"
}

// AFTER
{ 
  title: "Fetch Users"  // ✓ Unchanged (endpoint_name ignored)
  // endpoint_name is removed
}

// Case 3: Both are null
// BEFORE
{ 
  title: null,
  endpoint_name: null
}

// AFTER
{ 
  title: null  // ✓ Remains null
  // endpoint_name is removed
}
```

---

## Code Impact

### Before: Complex Runtime Handling

```javascript
// src/db_services/apiCall.service.js
async function getAllApiCallsByOrgId(org_id, folder_id, user_id, isEmbedUser) {
    // ... query logic ...
    
    // ❌ Complex transformation needed for every query
    apiCalls = apiCalls.map(apiData => {
        const fields = apiData.fields || {};
        let transformedData = {};

        if (Object.keys(fields).length === 0) {
            transformedData = {};
        } else if (apiData.version !== "v2") {
            // Handle old array format
            transformedData = {};
            for (const key in fields) {
                const item = fields[key];
                transformedData[item.variable_name] = {
                    description: item.description,
                    enum: (item.enum === '') ? [] : (item.enum || []),
                    type: "string",
                    parameter: {}
                };
            }
        } else {
            // Handle v2 format
            transformedData = fields;
        }

        return { ...apiData, fields: transformedData };
    });

    return apiCalls || [];
}
```

### After: Simple & Clean

```javascript
// src/db_services/apiCall.service.js
async function getAllApiCallsByOrgId(org_id, folder_id, user_id, isEmbedUser) {
    // ... query logic ...
    
    // ✓ No transformation needed - all data is already in v2 format
    return apiCalls || [];
}
```

---

## Migration Transformation Rules

| Field | Old Format | New Format | Notes |
|-------|------------|------------|-------|
| `fields` | Array of objects | Object with keys | **Main transformation** |
| `fields[].variable_name` | String | Becomes object key | Converted to key |
| `fields[].enum` | String or Array | Always Array | `""` → `[]` |
| `fields[].type` | Not present | `"string"` | Default added |
| `fields[].required_params` | Not present | `[]` | Default added |
| `fields[].parameter` | Not present | `{}` | Default added |
| `bridge_id` | String | Kept + copied to array | Preserved for compatibility |
| `bridge_ids` | Array | Array with bridge_id | Populated if was empty |
| `version` | Not present | `"v2"` | Added marker |
| `status` | Not present | `1` | Default status |
| `old_fields` | Not present | Copy of original | Backup for rollback |
| `title` | String | String | **Gets endpoint_name value if null** |
| `endpoint_name` | String or null | Removed | **Migrated to title if needed** |
| `code` | Python string | Removed | Deprecated |
| `is_python` | Number | Removed | Deprecated |
| `updated_at` | Date | Updated | Migration timestamp |

---

## Benefits Summary

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Code Complexity** | 48 lines of transformation | 2 lines | 96% reduction |
| **Runtime Performance** | Transform on every query | No transformation | Faster queries |
| **Maintainability** | Handle 2 formats | Handle 1 format | Simpler codebase |
| **Type Safety** | Unpredictable structure | Predictable structure | Better DX |
| **Data Consistency** | Mixed formats in DB | Uniform format | Reliable |

---

## Quick Start

1. **Backup database** (important!)
   ```bash
   # Create backup of apicalls collection
   mongodump --uri="mongodb+srv://..." --db=AI_Middleware --collection=apicalls
   ```

2. **Run migration**
   ```bash
   node test.js
   ```

3. **Verify results**
   ```javascript
   // All documents should have version: "v2"
   db.apicalls.find({ version: { $ne: "v2" } }).count() // Should be 0
   
   // Check a few documents
   db.apicalls.find().limit(5).pretty()
   ```

4. **Deploy updated code**
   - New model schema recognizes v2 fields
   - Service layer simplified (no transformation)

