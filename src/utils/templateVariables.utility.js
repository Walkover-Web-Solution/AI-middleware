/**
 * templateVariables.utility.js
 *
 * Handles the structured AI response format:
 *
 *   {
 *     "ui":        { type:"Card", children:[...] },   ← template_format
 *     "variables": { "items": [...], "total": "..." } ← actual data / schema source
 *   }
 *
 * Placeholders inside "ui" use two patterns:
 *   - Simple:  {{total}}          → scalar variable
 *   - Indexed: {{items[0].name}}  → element of an array variable
 *
 * This module extracts those keys, builds JSON Schema for the AI prompt,
 * and generates sensible default_values for fallback rendering.
 */

// ─── Variable Structure Collector ──────────────────────────────────────────────

/**
 * Walk any JSON node (string | array | object) and collect the structure of all 
 * variables found in {{...}} placeholders.
 * Returns an object mapping root keys to their structure type and fields:
 *   {
 *     "items":  { type: "array",  fields: Set(["id", "name"]) },
 *     "source": { type: "object", fields: Set(["image", "name"]) },
 *     "total":  { type: "string", fields: Set() }
 *   }
 */
function collectVariableStructure(node, structure = {}) {
    if (typeof node === "string") {
        // Find all {{...}} patterns
        const matches = node.match(/\{\{([^\}]+)\}\}/g);
        if (matches) {
            for (const match of matches) {
                const inner = match.slice(2, -2).trim(); // removing {{ and }}

                // 1) Array-indexed field: items[0].name
                const arrayMatch = inner.match(/^([a-zA-Z_]\w*)\[\d+\]\.(\w+)$/);
                if (arrayMatch) {
                    const root = arrayMatch[1];
                    const field = arrayMatch[2];
                    if (!structure[root]) structure[root] = { type: 'array', fields: new Set() };
                    structure[root].type = 'array'; // promote to array if mixed
                    structure[root].fields.add(field);
                    continue;
                }

                // 2) Object property: source.name
                const objMatch = inner.match(/^([a-zA-Z_]\w*)\.(\w+)$/);
                if (objMatch) {
                    const root = objMatch[1];
                    const field = objMatch[2];
                    if (!structure[root]) structure[root] = { type: 'object', fields: new Set() };
                    if (structure[root].type !== 'array') structure[root].type = 'object';
                    structure[root].fields.add(field);
                    continue;
                }

                // 3) Scalar/simple: total
                const scalarMatch = inner.match(/^([a-zA-Z_]\w*)$/);
                if (scalarMatch) {
                    const root = scalarMatch[1];
                    if (!structure[root]) structure[root] = { type: 'string', fields: new Set() };
                    continue;
                }
            }
        }
    } else if (Array.isArray(node)) {
        node.forEach((item) => collectVariableStructure(item, structure));
    } else if (node && typeof node === "object") {
        Object.values(node).forEach((v) => collectVariableStructure(v, structure));
    }
    return structure;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract the list of distinct root variable names used in `templateFormat`.
 *
 * @param {Object} templateFormat  – the "ui" tree
 * @returns {string[]}
 */
function extractPlaceholderKeys(templateFormat) {
    return Object.keys(collectVariableStructure(templateFormat));
}

/**
 * Build a JSON Schema that describes the `variables` object the AI must produce,
 * inferred purely from the placeholder patterns in `templateFormat`.
 *
 * - Simple {{key}}         → { type:"string" }
 * - Object {{key.fld}}     → { type:"object", properties:{ fld:{ type:"string" } } }
 * - Indexed {{key[N].fld}} → { type:"array", items:{ type:"object", properties:{ fld:{ type:"string" } } } }
 *
 * @param {Object} templateFormat
 * @param {Object} typeOverrides  – optional map of rootKey → JSON-Schema fragment
 * @returns {Object}  JSON Schema for the "variables" object
 */
function buildSchemaFromTemplateFormat(templateFormat, typeOverrides = {}) {
    const structure = collectVariableStructure(templateFormat);
    const rootKeys = Object.keys(structure);
    const properties = {};

    rootKeys.forEach((key) => {
        if (typeOverrides[key]) {
            properties[key] = typeOverrides[key];
            return;
        }

        const info = structure[key];

        if (info.type === 'array') {
            const itemProperties = {};
            info.fields.forEach((f) => {
                itemProperties[f] = { type: "string", description: `Field "${f}" of a ${key} item` };
            });
            properties[key] = {
                type: "array",
                description: `Array of ${key} items`,
                items: {
                    type: "object",
                    properties: itemProperties,
                    required: Array.from(info.fields),
                    additionalProperties: false,
                },
            };
        } else if (info.type === 'object') {
            const objProperties = {};
            info.fields.forEach((f) => {
                objProperties[f] = { type: "string", description: `Field "${f}" of the ${key} object` };
            });
            properties[key] = {
                type: "object",
                description: `Object for ${key}`,
                properties: objProperties,
                required: Array.from(info.fields),
                additionalProperties: false,
            };
        } else {
            // Scalar / simple
            properties[key] = { type: "string", description: `Value for ${key}` };
        }
    });

    const rootSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        title: "RichUI Variables",
        description: "Variables the AI must populate to fill the richUI template",
        properties,
        required: rootKeys,
    };

    _applyStrict(rootSchema);

    return {
        name: "RichUI_Variables",
        strict: true,
        schema: rootSchema,
    };
}

// Private helper to recursively apply additionalProperties: false
function _applyStrict(node) {
    if (node && typeof node === "object") {
        if (node.type === "object" && node.additionalProperties === undefined) {
            node.additionalProperties = false;
        }
        if (node.properties) {
            Object.values(node.properties).forEach(_applyStrict);
        }
        if (node.items) {
            _applyStrict(node.items);
        }
    }
}

/**
 * Backward-compat alias — builds schema from a plain list of keys.
 * Prefer `buildSchemaFromTemplateFormat` when you have the template tree.
 *
 * @param {string[]} keys
 * @param {Object}   typeOverrides
 * @returns {Object}
 */
function buildSchemaFromKeys(keys, typeOverrides = {}) {
    const properties = {};
    keys.forEach((key) => {
        properties[key] = typeOverrides[key] ?? { type: "string", description: `Value for ${key}` };
    });
    const rootSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties,
        required: keys,
    };
    _applyStrict(rootSchema);
    return {
        name: "Simple_Keys_Variables",
        strict: true,
        schema: rootSchema,
    };
}

/**
 * Build a `default_values` map from a template_format tree.
 *
 * - Simple keys           → ""
 * - Indexed array keys    → [] (empty array; Python fallback will skip rendering)
 *
 * @param {Object} templateFormat
 * @returns {Object}
 */
function buildDefaultValues(templateFormat) {
    const defaults = {};
    const structure = collectVariableStructure(templateFormat);

    Object.keys(structure).forEach((key) => {
        const info = structure[key];
        if (info.type === 'array') {
            defaults[key] = [];
        } else if (info.type === 'object') {
            defaults[key] = {};
        } else {
            defaults[key] = "";
        }
    });

    return defaults;
}

/**
 * Build a JSON Schema from an explicit variables object.
 *
 * @param {string} name
 * @param {Object} data 
 * @returns {Object} JSON Schema
 */
function buildSchemaFromVariablesObject(name, data) {
    function getSchemaForValue(value) {
        if (Array.isArray(value)) {
            if (value.length > 0) {
                return {
                    type: "array",
                    items: getSchemaForValue(value[0])
                };
            }
            return { type: "array" };
        } else if (value !== null && typeof value === "object") {
            const properties = {};
            const required = [];
            for (const key in value) {
                properties[key] = getSchemaForValue(value[key]);
                required.push(key);
            }
            return {
                type: "object",
                properties,
                required,
                additionalProperties: false
            };
        } else if (typeof value === "number") {
            return { type: "number" };
        } else if (typeof value === "boolean") {
            return { type: "boolean" };
        } else {
            return { type: "string" };
        }
    }

    const schema = getSchemaForValue(data);
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.title = name;
    
    return {
        name,
        strict: true,
        schema
    };
}

export {
    extractPlaceholderKeys,
    buildSchemaFromTemplateFormat,
    buildSchemaFromKeys,
    buildDefaultValues,
    buildSchemaFromVariablesObject,
};
