// ----------------- PATH HELPER -----------------
function setValueByPath(obj, path, value) {
    const parts = path
        .replace(/\]/g, "")
        .split(/\.|\[/) // "children[0].children[1].value" -> ["children","0","children","1","value"]
        .filter(Boolean);

    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];

        if (!(key in current)) {
            console.warn("Invalid path:", path, "Missing key:", key);
            return;
        }

        current = current[key];
    }

    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
}

function applyVariables(cardJson, variables) {
    for (const path in variables) {
        if (Object.prototype.hasOwnProperty.call(variables, path)) {
            setValueByPath(cardJson, path, variables[path]);
        }
    }
    return cardJson;
}

// ----------------- RENDERER -----------------
function renderNode(node) {
    if (!node || typeof node !== "object") return "";

    switch (node.type) {
        // CARD WRAPPER
        case "Card": {
            let paddingClasses = "";

            // support: padding: 8 OR padding: { x: 4, y: 6 }
            if (typeof node.padding === "number") {
                paddingClasses = `p-${node.padding}`;
            } else if (node.padding && typeof node.padding === "object") {
                if (node.padding.y != null) paddingClasses += ` py-${node.padding.y}`;
                if (node.padding.x != null) paddingClasses += ` px-${node.padding.x}`;
            } else {
                paddingClasses =
                    node.size === "sm"
                        ? "p-4"
                        : node.size === "lg"
                            ? "p-7"
                            : "p-6";
            }

            const body = (node.children || []).map(renderNode).join("\n");

            // footer buttons (confirm / cancel)
            let footer = "";
            if (node.confirm || node.cancel) {
                const buttons = [];

                if (node.cancel?.label) {
                    buttons.push(
                        renderNode({
                            type: "Button",
                            label: node.cancel.label,
                            style: "secondary",
                            pill: true
                        })
                    );
                }

                if (node.confirm?.label) {
                    buttons.push(
                        renderNode({
                            type: "Button",
                            label: node.confirm.label,
                            style: "primary",
                            pill: true
                        })
                    );
                }

                footer = `
<div class="card-actions justify-end mt-4">
  ${buttons.join("\n")}
</div>
`.trim();
            }

            return `
<div class="card bg-base-100 shadow-xl max-w-xl w-full ${paddingClasses}">
  <div class="card-body space-y-4">
    ${body}
    ${footer}
  </div>
</div>
`.trim();
        }

        // COLUMN LAYOUT
        case "Col": {
            const gap = node.gap != null ? `gap-${node.gap}` : "gap-3";

            let paddingClasses = "";
            if (typeof node.padding === "number") {
                paddingClasses = `p-${node.padding}`;
            } else if (node.padding && typeof node.padding === "object") {
                if (node.padding.x != null) paddingClasses += ` px-${node.padding.x}`;
                if (node.padding.y != null) paddingClasses += ` py-${node.padding.y}`;
                if (node.padding.top != null) paddingClasses += ` pt-${node.padding.top}`;
                if (node.padding.bottom != null) paddingClasses += ` pb-${node.padding.bottom}`;
                if (node.padding.left != null) paddingClasses += ` pl-${node.padding.left}`;
                if (node.padding.right != null) paddingClasses += ` pr-${node.padding.right}`;
            }

            const alignMap = {
                center: "items-center",
                start: "items-start",
                end: "items-end"
            };
            const alignClass = node.align ? alignMap[node.align] || "" : "";

            const flexClass = node.flex ? "flex-1" : "";

            const children = (node.children || []).map(renderNode).join("\n");
            return `
<div class="flex flex-col ${gap} ${paddingClasses} w-full ${alignClass} ${flexClass}">
  ${children}
</div>
`.trim();
        }

        // ROW LAYOUT
       case "Row": {
    const gap = node.gap != null ? `gap-${node.gap}` : "gap-3";

    let paddingClasses = "";
    if (typeof node.padding === "number") {
        paddingClasses = `p-${node.padding}`;
    } else if (node.padding && typeof node.padding === "object") {
        if (node.padding.x != null) paddingClasses += ` px-${node.padding.x}`;
        if (node.padding.y != null) paddingClasses += ` py-${node.padding.y}`;
        if (node.padding.top != null) paddingClasses += ` pt-${node.padding.top}`;
        if (node.padding.bottom != null) paddingClasses += ` pb-${node.padding.bottom}`;
    }

    const alignMap = {
        center: "items-center",
        start: "items-start",
        end: "items-end"
    };
    const alignClass = node.align ? alignMap[node.align] : "items-stretch";

    const justifyMap = {
        center: "justify-center",
        start: "justify-start",
        end: "justify-end",
        between: "justify-between"
    };
    const justifyClass = justifyMap[node.justify] || "justify-start";

    const radiusMap = {
        sm: "rounded-md",
        md: "rounded-xl",
        lg: "rounded-2xl"
    };
    const radiusClass = node.radius ? radiusMap[node.radius] : "";

    const bgClass =
        node.background && !node.background.startsWith("#")
            ? node.background
            : "";

    const borderClass =
        node.border?.bottom
            ? "border-b border-slate-200"
            : "";

    const children = (node.children || []).map(renderNode).join("\n");

   return `
<div class="flex flex-row ${gap} ${paddingClasses} ${alignClass} ${justifyClass}
            ${radiusClass} ${bgClass} ${borderClass} w-full flex-nowrap">
  ${children}
</div>
`.trim();

}

        // SPACER
        case "Spacer": {
            return `<div class="flex-1"></div>`;
        }

        // DIVIDER
        case "Divider": {
            const flushClass = node.flush ? "mx-0" : "mx-2";
            return `
<div class="divider ${flushClass}"></div>
`.trim();
        }

        // BOX
        case "Box": {
            let paddingClasses = "";
            if (typeof node.padding === "number") {
                const approx = Math.max(0, Math.round(node.padding));
                if (approx > 0) paddingClasses = `p-${approx}`;
            } else if (node.padding && typeof node.padding === "object") {
                if (node.padding.x != null) paddingClasses += ` px-${node.padding.x}`;
                if (node.padding.y != null) paddingClasses += ` py-${node.padding.y}`;
            }

            const radiusMap = {
                sm: "rounded-md",
                md: "rounded-xl",
                lg: "rounded-2xl"
            };
            const radiusClass = radiusMap[node.radius] || "rounded-xl";

            const alignMap = {
                center: "items-center",
                start: "items-start",
                end: "items-end"
            };
            const justifyMap = {
                center: "justify-center",
                start: "justify-start",
                end: "justify-end",
                between: "justify-between"
            };

            const alignClass = node.align ? alignMap[node.align] || "" : "items-center";
            const justifyClass = node.justify ? justifyMap[node.justify] || "" : "justify-center";
            const flexClass = node.flex ? `flex-[${node.flex}_0_0%]` : "";
const widthStyle = node.width ? `width:${node.width}px;flex:0 0 ${node.width}px;` : "";


            const bgClass =
                node.background && !String(node.background).startsWith("#")
                    ? node.background
                    : "";

            const bgStyle = node.background && String(node.background).startsWith("#")
                ? `background:${node.background};`
                : "";

            const children = (node.children || []).map(renderNode).join("\n");

            return `
<div
  class="flex ${flexClass} ${alignClass} ${justifyClass} ${radiusClass} ${paddingClasses} ${bgClass}"
  style="${bgStyle}${widthStyle}"
>
  ${children}
</div>
`.trim();

        }

        // IMAGE
        case "Image": {
            const size = node.size || 48;
            const shapeClass = node.frame ? "rounded-xl" : "mask mask-circle";
            const frameClass = node.frame ? "" : "avatar";

            return `
<div class="${frameClass}">
  <div class="${shapeClass} w-${Math.round(size/4)}">
    <img
      src="${node.src}"
      alt="${node.alt || ""}"
      class="object-cover"
    />
  </div>
</div>
`.trim();
        }

        // TITLE
        case "Title": {
            const sizeMap = {
                "3xl": "text-4xl md:text-5xl",
                "2xl": "text-3xl md:text-4xl",
                xl: "text-2xl md:text-3xl",
                sm: "text-sm md:text-base"
            };
            const sizeClass = sizeMap[node.size] || "text-xl md:text-2xl";

            const weightClass =
                node.weight === "semibold"
                    ? "font-semibold"
                    : node.weight === "normal"
                        ? "font-normal"
                        : "font-semibold";

            let colorClass = "text-base-content";
            if (node.color === "white") colorClass = "text-base-100";

            const textAlignMap = {
                center: "text-center",
                left: "text-left",
                right: "text-right"
            };
            const alignClass = node.textAlign
                ? textAlignMap[node.textAlign] || ""
                : "";

            const maxLinesClass = node.maxLines ? `line-clamp-${node.maxLines}` : "";

            return `
<h2 class="card-title ${sizeClass} ${weightClass} ${colorClass} ${alignClass} ${maxLinesClass}">
  ${node.value}
</h2>
`.trim();
        }

        // TEXT
        case "Text": {
            const sizeMap = {
                xs: "text-xs",
                sm: "text-sm",
                md: "text-base",
                lg: "text-lg",
                xl: "text-xl"
            };
            const sizeClass = sizeMap[node.size] || "text-sm";

            const weightMap = {
                normal: "font-normal",
                medium: "font-medium",
                semibold: "font-semibold",
                bold: "font-bold"
            };
            const weightClass = weightMap[node.weight] || "font-normal";

            let colorClass = "text-base-content";
            if (node.color === "secondary") colorClass = "text-base-content/70";
            else if (node.color === "emphasis") colorClass = "text-base-content";
            else if (node.color === "white") colorClass = "text-base-100";
            else if (node.color && node.color.startsWith("#")) {
                colorClass = "";
            }

            const textAlignMap = {
                center: "text-center",
                left: "text-left",
                right: "text-right"
            };
            const alignClass = node.textAlign ? textAlignMap[node.textAlign] || "" : "";

            const maxLinesClass = node.maxLines ? `line-clamp-${node.maxLines}` : "";

            const style = node.color && node.color.startsWith("#") ? `style="color:${node.color};"` : "";

            return `
<p class="${sizeClass} ${weightClass} ${colorClass} ${alignClass} ${maxLinesClass}" ${style}>
  ${node.value || ""}
</p>
`.trim();
        }

        // ICON
        case "Icon": {
            const colorMap = {
                success: "text-success",
                danger: "text-error",
                warning: "text-warning",
                info: "text-info"
            };
            const colorClass = node.color ? (colorMap[node.color] || "") : "text-base-content/70";

            const sizeMap = {
                sm: "h-4 w-4",
                md: "h-5 w-5",
                lg: "h-6 w-6",
                xl: "h-7 w-7"
            };
            const sizeClass = sizeMap[node.size] || "h-5 w-5";

            return `
<span class="inline-flex ${sizeClass} items-center justify-center ${colorClass}">
  <span class="text-[0.7rem] uppercase tracking-tight">${node.name}</span>
</span>
`.trim();
        }

        // BUTTON
        case "Button": {
            const styleKey = node.style || node.variant || "secondary";

            const styleMap = {
                primary: "btn-primary",
                secondary: "btn-secondary",
                outline: "btn-outline",
                subtle: "btn-ghost",
                accent: "btn-accent",
                success: "btn-success",
                warning: "btn-warning",
                error: "btn-error"
            };

            const styleClass = styleMap[styleKey] || "btn-secondary";
            const blockClass = node.block ? "btn-block" : "";
            const sizeClass = node.size === "sm" ? "btn-sm" : node.size === "lg" ? "btn-lg" : "";

            let iconStartHtml = "";
            if (node.iconStart) {
                iconStartHtml = `
<span class="inline-flex h-5 w-5 items-center justify-center">
  <span class="text-[0.7rem] uppercase tracking-tight">${node.iconStart}</span>
</span>`;
            }

            let dataAttrs = "";
            if (node.onClickAction) {
                if (node.onClickAction.type) {
                    dataAttrs += ` data-action-type="${node.onClickAction.type}"`;
                }
                if (node.onClickAction.payload) {
                    dataAttrs += ` data-action-payload='${JSON.stringify(node.onClickAction.payload)}'`;
                }
            }

            return `
<button
  type="${node.submit ? "submit" : "button"}"
  class="btn ${styleClass} ${blockClass} ${sizeClass}"${dataAttrs}
>
  ${iconStartHtml}${iconStartHtml ? " " : ""}${node.label}
</button>
`.trim();
        }

        default: {
            if (Array.isArray(node.children)) {
                return node.children.map(renderNode).join("\n");
            }
            return "";
        }
    }
}

function renderCardToTailwind(cardJson) {
    return renderNode(cardJson);
}


/**
 * Generates a JSON schema from a card template
 * @param {Object} cardJson - The card JSON template
 * @param {string} schemaName - Name for the schema (default: "nested_ui_components")
 * @param {string} varPrefix - Variable prefix (default: "vars")
 * @returns {Object} - Object containing schema and variables
 */
function generateSchemaFromCard(cardJson, schemaName = "nested_ui_components", varPrefix = "vars") {
  const descMap = buildDescriptions(cardJson);
  const variables = buildVariables(cardJson, descMap, varPrefix);
  const schema = buildSchemaFromVariables(schemaName, variables);
  return { schema, variables };
}

function buildDescriptions(template) {
  const result = {};

  function makeDescription(prop, parent, path) {
    const type = parent?.type;
    const key = parent?.key;

    switch (prop) {
      case "name":
        if (type === "Input") return "Input field name used to bind the user’s typed value.";
        if (type === "Button") return "Name/identifier used to reference this button.";
        return "Logical name used to reference this field.";

      case "label":
        if (type === "Button") return key ? `Button label for the "${key}" action.` : "Button label text shown to the user.";
        return "Display label text shown to the user.";

      case "placeholder":
        return "Placeholder text shown when the input field is empty.";

      case "defaultValue":
        return "Default value shown before the user edits this field.";

      case "value":
        if (type === "Text" || type === "Title" || type === "Caption") return "Static text content displayed in the UI.";
        return "Value used for this field.";

      case "src":
        return "Source URL/path for the image to display.";

      case "alt":
        return "Alternative text describing the image for accessibility.";

      case "iconStart":
        if (type === "Button") return "Icon identifier shown at the start (left side) of the button.";
        return "Icon identifier displayed before the main content.";

      default:
        return `Value for field at path "${path}".`;
    }
  }

  function walk(node, path) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => {
        const childPath = path ? `${path}[${index}]` : `[${index}]`;
        walk(child, childPath);
      });
      return;
    }

    if (node && typeof node === "object") {
      for (const key of Object.keys(node)) {
        const value = node[key];

        // Keep children arrays as children[0].children[1]...
        if (Array.isArray(value) && key === "children") {
          const nextPath = path ? `${path}.${key}` : key;
          value.forEach((child, index) => walk(child, `${nextPath}[${index}]`));
          continue;
        }

        const nextPath = path ? `${path}.${key}` : key;

        // Collect descriptions for interesting props
        if (["name", "label", "placeholder", "defaultValue", "value", "src", "alt", "iconStart"].includes(key)) {
          result[nextPath] = makeDescription(key, node, nextPath);
        }

        // Recurse
        if (value && typeof value === "object") walk(value, nextPath);
      }
    }
  }

  walk(template, "");
  return result; // path -> description
}

function buildSchemaFromDescriptionMap(name, descMap) {
  const properties = {};
  const required = [];

  for (const path of Object.keys(descMap)) {
    properties[path] = { type: "string", description: descMap[path] || "" };
    required.push(path);
  }

  return {
    name,
    schema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
    strict: true,
  };
}

function buildSchemaFromVariables(name, variables) {
  const properties = {};
  const required = [];

  for (const path of Object.keys(variables)) {
    properties[path] = { 
      type: "string", 
      description: variables[path].description || "" 
    };
    required.push(path);
  }

  return {
    name,
    schema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
    strict: true,
  };
}

function getByPath(obj, path) {
  try {
    const tokens = [];
    path.split(".").forEach((part) => {
      const re = /([^\[]+)|\[(\d+)\]/g;
      let m;
      while ((m = re.exec(part))) {
        if (m[1]) tokens.push(m[1]);
        if (m[2]) tokens.push(Number(m[2]));
      }
    });

    let cur = obj;
    for (const t of tokens) {
      if (cur == null) return undefined;
      cur = cur[t];
    }
    return cur;
  } catch {
    return undefined;
  }
}

function buildVariables(template, descMap, varPrefix = "vars") {
  const vars = {};
  for (const path of Object.keys(descMap)) {
    vars[path] = {
      description: descMap[path] || "",
      example: getByPath(template, path),
      value: `{{${varPrefix}.${path}}}`, // variable placeholder
    };
  }
  return vars;
}

export { renderCardToTailwind, applyVariables, renderNode, generateSchemaFromCard, buildVariables, buildSchemaFromVariables };
