const extractVariables = (template = "") => {
  const matches = template.matchAll(/{{\s*([^}]+)\s*}}/g);
  const vars = [];
  for (const match of matches) {
    if (match[1]) vars.push(match[1].trim());
  }
  return [...new Set(vars)];
};

export { extractVariables };
