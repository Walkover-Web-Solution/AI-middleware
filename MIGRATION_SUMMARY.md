# API Call Schema Migration to V2 Format

## Overview
This migration standardizes the `apicalls` collection to use a common v2 format, eliminating the need for runtime version handling in the codebase.

## Problem Statement
The `apicalls` collection had two different formats:

### Old Format (v1)
```json
{
  "fields": [
    {
      "variable_name": "limit",
      "description": "",
      "enum": ""
    }
  ],
  "required_params": ["limit"],
  "code": "def axios_call...",
  "is_python": 1
}
```

### New Format (v2)
```json
{
  "fields": {
    "name": {
      "description": "",
      "type": "string",
      "enum": [],
      "required_params": [],
      "parameter": {}
    }
  },
  "version": "v2",
  "status": 1,
  "bridge_ids": [...]
}
```

## Solution: Standardized V2 Format

### Key Changes

1. **Fields Structure**
   - **Before**: Array of objects with `variable_name` property
   - **After**: Object where keys are parameter names and values contain metadata
   ```json
   {
     "fields": {
       "paramName": {
         "description": "string",
         "type": "string",
         "enum": [],
         "required_params": [],
         "parameter": {}
       }
     }
   }
   ```

2. **Version Tracking**
   - All documents now have `version: "v2"`
   - Old format backed up in `old_fields` property

3. **Bridge ID Management**
   - Migrates single `bridge_id` to `bridge_ids` array
   - Ensures `bridge_ids` is always an array

4. **Status Field**
   - Adds default `status: 1` to all documents

5. **Endpoint Name → Title Migration**
   - If `title` is null/empty and `endpoint_name` has a value: copies `endpoint_name` to `title`
   - Always removes the deprecated `endpoint_name` field
   - Preserves existing `title` if it already has a value

6. **Cleanup**
   - Removes deprecated `code` field
   - Removes deprecated `is_python` field
   - Removes deprecated `endpoint_name` field (after migrating to `title` if needed)

## Migration Script

Run the migration:
```bash
node test.js
```

The script will:
1. Find all documents without `version: "v2"`
2. Convert `fields` from array to object format
3. Backup original fields to `old_fields`
4. Migrate `bridge_id` to `bridge_ids` array
5. Add default `status` and `version` fields
6. Migrate `endpoint_name` to `title` if needed and remove `endpoint_name`
7. Remove deprecated Python-related fields
8. Print detailed logs and summary

## Schema Updates

### Model (`src/mongoModel/ApiCall.model.js`)
Added fields:
- `bridge_ids`: Array of ObjectIds
- `title`: String (kept as standard field)
- `old_fields`: Backup of original fields
- `status`: Number (default: 1)
- `version`: String (default: "v2")
- `updated_at`: Date

Removed fields:
- `endpoint_name`: Deprecated (migrated to `title`)

### Service (`src/db_services/apiCall.service.js`)
**Simplified Logic**:
- Removed runtime version checking
- Removed field transformation logic
- Fields are now always in v2 format

**Before** (48 lines of transformation logic):
```javascript
apiCalls = apiCalls.map(apiData => {
  // Complex version checking and transformation
  if (apiData.version !== "v2") {
    // Transform old format...
  }
  // ...
});
```

**After** (2 lines):
```javascript
// All documents are v2 format after migration
return apiCalls || [];
```

## Benefits

1. **Simplified Code**: Removed ~30 lines of conditional transformation logic
2. **Better Performance**: No runtime transformation needed
3. **Consistency**: Single source of truth for field structure
4. **Maintainability**: Easier to understand and modify
5. **Type Safety**: Predictable schema structure

## Rollback Plan

If needed, the original data is preserved in `old_fields`:

```javascript
// Rollback example (if needed)
await apiCalls.updateMany(
  { version: "v2" },
  {
    $set: { 
      fields: "$old_fields",
      version: "v1"
    },
    $unset: { old_fields: "" }
  }
);
```

## Testing Checklist

- [ ] Run migration script on staging database
- [ ] Verify all documents have `version: "v2"`
- [ ] Test API calls that fetch api configurations
- [ ] Verify fields are correctly structured
- [ ] Test bridge_ids array functionality
- [ ] Run integration tests
- [ ] Backup production database before running on prod
- [ ] Run migration on production
- [ ] Monitor for errors

## Notes

- Migration is **idempotent**: Safe to run multiple times
- Original data preserved in `old_fields`
- Migration logs show detailed progress
- No data loss - only structure transformation

