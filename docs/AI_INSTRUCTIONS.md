# AI Coding Instructions for GTWY.AI Middleware

This document provides concise coding guidelines and conventions for AI assistants and developers working on the GTWY.AI middleware codebase.

---

## Architecture Principles

### Separation of Concerns

- **Controllers**: Handle HTTP requests/responses only - keep them thin
- **Services**: Contain business logic and cross-layer operations
- **DB Services**: Encapsulate all database operations (CRUD)
- **Models**: Define data schemas (Mongoose/Sequelize)
- **Middleware**: Handle auth, validation, and formatting
- **Utils**: Reusable helper functions

### Golden Rules

1. Controllers must be lightweight - delegate all logic to services
2. Always use `async/await` - never use callbacks
3. Never use try-catch blocks - use `express-async-errors` (custom error handler in `src/middlewares/errorHandler.js`)
4. All inputs must be validated with Joi schemas
5. Use the centralized `logger` - never use `console.log`
6. All database operations must go through service layers

---

## Naming Conventions

### Code Naming

| Type               | Convention                | Example                         |
| ------------------ | ------------------------- | ------------------------------- |
| Variables          | camelCase                 | `userId`, `agentConfig`         |
| Functions          | camelCase with verb       | `createAgent`, `validateConfig` |
| Classes            | PascalCase                | `AgentService`, `ApiError`      |
| Constants          | UPPER_SNAKE_CASE          | `MAX_RETRY_ATTEMPTS`            |
| MongoDB Fields     | camelCase                 | `agentName`, `orgId`            |
| PostgreSQL Columns | snake_case                | `thread_id`, `created_at`       |
| Booleans           | Prefix with is/has/should | `isActive`, `hasPermission`     |

### API Endpoints

- Use plural nouns: `/api/agents`, `/api/chatbots`
- Use kebab-case for multi-word: `/api/api-keys`
- Nest resources logically: `/api/agents/:agentId/versions`

---

## File Creation Order

When adding a new feature, create files in this exact order:

1. **Model** - Define schema in `src/mongoModel/` (MongoDB) or `models/postgres/` (PostgreSQL)
2. **DB Service** - Create CRUD operations in `src/db_services/{feature}.service.js`
3. **Business Service** - Add business logic in `src/services/{feature}.service.js` (if needed)
4. **Validation** - Define Joi schemas in `src/validation/joi_validation/{feature}.validation.js`
5. **Controller** - Create route handlers in `src/controllers/{feature}.controller.js`
6. **Routes** - Define endpoints in `src/routes/{feature}.routes.js`
7. **Register** - Add route to `src/index.js` with pattern: `app.use('/api/{feature}', {feature}Routes)`

---

## Controller Rules

### Must Follow

- Always use `async` functions
- Read auth context from `req.profile`, `req.org_id`, `req.ownerId`
- Call service layer for all business logic
- Place response data in `res.locals.data`
- Set status code in `req.statusCode`
- Return `next()` at the end
- Throw `ApiError` for errors - don't use try-catch (express-async-errors handles it)

## Additional Resources

- **Architecture**: [`docs/architecture.mf`](./architecture.mf)
- **Main Project**: [gtwy-ai](https://github.com/Walkover-Web-Solution/gtwy-ai)
- **Environment Setup**: `.env.example`

---

**Last Updated**: January 2026
