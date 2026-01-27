# GTWY.AI Middleware (Node.js Backend)

**CRUD Operations & Management Layer for GTWY.AI Platform**

This is the Node.js/Express backend that provides the management and configuration layer for the GTWY.AI platform. It handles all CRUD operations for agents, chatbots, RAG collections, API keys, and other platform resources that power the main AI orchestration system.

## 🎯 Purpose

This project serves as the **configuration and management backend** for GTWY.AI. While the main Python FastAPI service handles AI orchestration and real-time inference, this Node.js middleware manages:

- Agent configuration and versioning
- Chatbot setup and customization
- RAG collection management
- API key storage and management
- User authentication and organization management
- Usage metrics and reporting
- Template and prompt libraries

**Key Components:**

- **Express.js Server**: RESTful API with async error handling
- **MongoDB**: Primary data store for configurations, chatbots, RAG collections
- **PostgreSQL**: Relational history (conversation logs, orchestrator history)
- **TimescaleDB**: Time-series metrics for analytics
- **Redis**: Caching, rate limiting, and session management
- **RabbitMQ**: Asynchronous job processing

For detailed architecture documentation, see [`docs/architecture.mf`](docs/architecture.mf).

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)
- **PostgreSQL** (v12 or higher)
- **TimescaleDB** extension for PostgreSQL
- **Redis** (v6 or higher)
- **RabbitMQ** (optional, for queue processing)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Walkover-Web-Solution/AI-middleware.git
cd AI-middleware
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration values for MongoDB, PostgreSQL, Redis, JWT secrets, and other services. See `.env.example` for all available configuration options.

### 4. Database Setup

#### MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# MongoDB will automatically create the database on first connection
```

#### PostgreSQL with TimescaleDB

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS

# Create databases
psql -U postgres
CREATE DATABASE gtwy_ai;
CREATE DATABASE gtwy_ai_metrics;

# Enable TimescaleDB extension
\c gtwy_ai_metrics;
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q

# Run migrations (if available)
npm run migrate
# or manually import schema files from models/postgres/ and models/timescale/
```

#### Redis

```bash
# Start Redis service
sudo systemctl start redis  # Linux
brew services start redis  # macOS

# Test connection
redis-cli ping  # Should return PONG
```

### 5. Run the Application

#### Development Mode

```bash
npm run dev
# or
yarn dev
```

#### Production Mode

```bash
npm start
# or
yarn start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### 6. Verify Installation

Check the health endpoint:

```bash
curl http://localhost:3000/healthcheck
```

## 📁 Project Structure

For detailed project structure and architecture, see [`docs/architecture.mf`](docs/architecture.mf).

## 🔐 Authentication

The API uses JWT-based authentication. Most endpoints require an `Authorization` header:

```bash
Authorization: Bearer <your_jwt_token>
```

Different authentication flows are available:

- **Organization tokens** for standard API access
- **Chatbot tokens** for public chatbot interfaces
- **Embed tokens** for embedded chatbot users

## 🧪 Development Guidelines

### Adding a New Feature

Follow the established pattern described in [`docs/architecture.mf`](docs/architecture.mf):

1. **Identify the surface** - Choose or create a route under `src/routes/`
2. **Model + service first** - Create Mongoose/SQL models and service layer
3. **Controller + validation** - Add route handlers with Joi validation
4. **Middleware & auth** - Apply appropriate authentication middleware
5. **Cache considerations** - Handle Redis invalidation if needed
6. **Observability** - Add logging and update documentation

### Code Style

- Use `async/await` for asynchronous operations
- Handle errors with `express-async-errors`
- Controllers should NOT call `res.send()` directly - use `res.locals` + `req.statusCode`
- Use the centralized `logger` instead of `console.log`
- Validate all inputs with Joi schemas

## 🔧 Common Tasks

### Clear Redis Cache

```bash
curl -X POST http://localhost:3000/api/utils/clear-cache \
  -H "Authorization: Bearer <token>"
```

### Run Database Migrations

```bash
npm run migrate
```

### View Logs

```bash
# Development logs are output to console
# Production logs can be configured in src/logger.js
tail -f logs/app.log
```

## 🤝 Related Projects

This Node.js middleware works in conjunction with:

- **[AI-middleware-python](https://github.com/Walkover-Web-Solution/AI-middleware-python)** - Main AI orchestration engine (FastAPI)
- **GTWY.AI Frontend** - Web dashboard for managing agents and chatbots

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Verify connection string in .env
# Ensure MongoDB is accessible on the specified host/port
```

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U your_username -d gtwy_ai
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Verify Redis host/port in .env
```

### Port Already in Use

```bash
# Find process using the port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check the [architecture documentation](docs/architecture.mf)
- Review the main project: [gtwy-ai](https://github.com/Walkover-Web-Solution/gtwy-ai)

---

Built with ❤️ by the Walkover team
