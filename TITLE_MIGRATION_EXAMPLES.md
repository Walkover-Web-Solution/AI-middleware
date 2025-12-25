# Endpoint Name → Title Migration Examples

## Overview
The migration handles consolidation of `endpoint_name` and `title` fields to avoid redundancy.  
**Standard field:** `title` (kept)  
**Deprecated field:** `endpoint_name` (removed)

---

## Example 1: endpoint_name migrated to title

### BEFORE Migration:
```json
{
  "_id": "66386af561a4937ebbb5b254",
  "function_name": "getUserData",
  "title": null,
  "endpoint_name": "Get User Information",
  "description": "Fetches user details from the database"
}
```

### AFTER Migration:
```json
{
  "_id": "66386af561a4937ebbb5b254",
  "function_name": "getUserData",
  "title": "Get User Information",  ← Copied from endpoint_name
  "description": "Fetches user details from the database",
  "version": "v2"
  // endpoint_name field removed ✓
}
```

**What happened:**
- `title` was null
- `endpoint_name` had a value: "Get User Information"
- **Action:** Copied `endpoint_name` → `title`, then deleted `endpoint_name`

---

## Example 2: title already exists (endpoint_name ignored)

### BEFORE Migration:
```json
{
  "_id": "66290dd2910af758d6a4c0b8",
  "function_name": "fetchMembers",
  "title": "Fetch All Members",
  "endpoint_name": "Get Organization Members",
  "description": "Returns list of all organization members"
}
```

### AFTER Migration:
```json
{
  "_id": "66290dd2910af758d6a4c0b8",
  "function_name": "fetchMembers",
  "title": "Fetch All Members",  ← Unchanged!
  "description": "Returns list of all organization members",
  "version": "v2"
  // endpoint_name field removed ✓
}
```

**What happened:**
- `title` already had a value: "Fetch All Members"
- `endpoint_name` had a different value: "Get Organization Members"
- **Action:** Kept existing `title`, deleted `endpoint_name` (endpoint_name value was discarded)

---

## Example 3: Both null/empty

### BEFORE Migration:
```json
{
  "_id": "66486af561a4937ebbb5b333",
  "function_name": "helperFunction",
  "title": "",
  "endpoint_name": "",
  "description": "Helper function"
}
```

### AFTER Migration:
```json
{
  "_id": "66486af561a4937ebbb5b333",
  "function_name": "helperFunction",
  "title": "",  ← Remains empty
  "description": "Helper function",
  "version": "v2"
  // endpoint_name field removed ✓
}
```

**What happened:**
- Both `title` and `endpoint_name` were empty
- **Action:** Just removed `endpoint_name` field

---

## Example 4: Only endpoint_name field missing

### BEFORE Migration:
```json
{
  "_id": "66586af561a4937ebbb5b444",
  "function_name": "processData",
  "title": "Process Customer Data",
  "description": "Processes incoming data"
  // No endpoint_name field
}
```

### AFTER Migration:
```json
{
  "_id": "66586af561a4937ebbb5b444",
  "function_name": "processData",
  "title": "Process Customer Data",  ← Unchanged
  "description": "Processes incoming data",
  "version": "v2"
  // Nothing to migrate
}
```

**What happened:**
- `endpoint_name` field didn't exist
- **Action:** No migration needed, just added version marker

---

## Migration Logic Flowchart

```
┌─────────────────────────────────┐
│ Does endpoint_name field exist? │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    │ YES         │ NO
    │             └─────────────> Skip (nothing to do)
    │
    ▼
┌──────────────────────────┐
│ Is title null/empty?     │
└──────────┬───────────────┘
           │
    ┌──────┴──────┐
    │ YES         │ NO
    │             │
    ▼             ▼
┌─────────────┐ ┌──────────────┐
│ Copy        │ │ Keep existing│
│ endpoint_   │ │    title     │
│ name to     │ │              │
│   title     │ │              │
└──────┬──────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌───────────────────┐
        │ Remove endpoint_  │
        │   name field      │
        └───────────────────┘
```

---

## Summary Table

| Scenario | title | endpoint_name | Action |
|----------|-------|---------------|--------|
| Migrate value | `null` or `""` | `"Some Value"` | Copy `endpoint_name` → `title`, delete `endpoint_name` |
| Keep existing | `"Existing"` | `"Other Value"` | Keep `title`, delete `endpoint_name` |
| Both empty | `null` or `""` | `null` or `""` | Just delete `endpoint_name` |
| No endpoint_name | `"Existing"` | (not present) | No action needed |

---

## Why This Migration?

**Problem:** Some documents had both `endpoint_name` and `title` with the same or different values, causing:
- Data redundancy
- Confusion about which field to use
- Inconsistent API responses

**Solution:** Standardize on `title` as the single source of truth for endpoint display names.

**Benefit:** 
- ✅ Single field to maintain
- ✅ Consistent data model
- ✅ Less confusion in the codebase
- ✅ Original data preserved in `old_fields` if rollback needed

---

## Migration Code Logic

```javascript
// If endpoint_name exists
if (apiCall.endpoint_name !== undefined) {
    
    // If title is null/empty and endpoint_name has value
    if ((!apiCall.title || apiCall.title === null || apiCall.title === "") 
        && apiCall.endpoint_name && apiCall.endpoint_name !== "") {
        
        // Copy endpoint_name to title
        updateDoc.$set.title = apiCall.endpoint_name;
    }
    
    // Always delete endpoint_name
    updateDoc.$unset.endpoint_name = "";
}
```

---

## Real-World Example

Imagine you have an API configuration where users set a display name:

**Before migration:**
```json
{
  "function_name": "scrielBNwPh6",
  "title": "",                          // Empty
  "endpoint_name": "Get All Members",   // Has value
  "description": "This API returns all organization members"
}
```

**After migration:**
```json
{
  "function_name": "scrielBNwPh6",
  "title": "Get All Members",           // ✓ Now populated
  "description": "This API returns all organization members",
  "version": "v2"
  // endpoint_name removed
}
```

Now your frontend only needs to check the `title` field - no more confusion! 🎉
