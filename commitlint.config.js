export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding or updating tests
        "chore", // Maintenance tasks
        "revert", // Revert a previous commit
        "build", // Build system changes
        "ci" // CI/CD changes
      ]
    ]
  }
};
