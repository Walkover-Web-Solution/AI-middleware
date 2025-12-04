import 'express-async-errors';
import express from "express";
import cors from "cors";
import { configDotenv } from 'dotenv';
import './atatus.js';
import './consumers/index.js';
import './services/cache.service.js';
import configurationController from "./controllers/conversationConfig.controller.js";
import configRoutes from './routes/config.routes.js';
import apikeyRoutes from "./routes/apikey.routes.js";
import helloRoutes from './routes/hello.routes.js';
import threadRoutes from './routes/thread.routes.js'
import metricsRoutes from "./routes/metrics.routes.js"
import mongoose from "mongoose";
import config from "../config/config.js";
// import metrisRoutes from "./routes/metrics.routes.js";
import chatbot from "./routes/chatBot.routes.js";
import RagRouter from "./routes/rag.routes.js";
import userOrgLocalController from "./routes/userOrgLocal.routes.js";
import initializeMonthlyLatencyReport from './cron/monthlyLatencyReport.js';
import initializeWeeklyLatencyReport from './cron/weeklyLatencyReport.js';
import initializeDailyUpdateCron from './cron/initializeDailyUpdateCron.js';
import AuthRouter from "./routes/auth.routes.js";
import notFoundMiddleware from './middlewares/notFound.js';
import errorHandlerMiddleware from './middlewares/errorHandler.js';
import responseMiddleware from './middlewares/responseMiddleware.js';
import InternalRoutes from './routes/internal.routes.js';
import alerting from './routes/alerting.routes.js';
import testcaseRoutes from './routes/testcase.routes.js'
import reportRoute from './routes/report.routes.js'
import ModelsConfigRoutes from './routes/modelConfig.routes.js'
import gtwyEmbedRoutes from './routes/gtwyEmbed.routes.js'
import agentLookupRoutes from './routes/agentLookup.routes.js'
import historyRoutes from './routes/history.routes.js'
import apiCallRoutes from './routes/apiCall.routes.js'
import bridgeVersionRoutes from './routes/bridgeVersion.routes.js'
import utilsRoutes from './routes/utils.routes.js'
import prebuiltPromptRoutes from './routes/prebuiltPrompt.routes.js'
import runAgentsRoutes from './routes/runAgents.routes.js'
import bridgeRoutes from './routes/bridge.routes.js'
import templateRoute from './routes/template.routes.js'
import serviceRoutes from './routes/service.routes.js'

const app = express();
configDotenv();
const PORT = process.env.PORT || 7072;


app.use(cors({
  origin: '*',
  maxAge: 86400,
  preflightContinue: true
}));
app.use(express.json());
// app.use(multer().array());
try {
  mongoose.set("strictQuery", false);
  mongoose.connect(config.mongo.uri, {
  });
} catch (err) {
  console.error('database connection error: ', err.message);
  // logger.error('database connection error: ' + err.message);
}

app.get('/healthcheck', async (req, res) => {
  res.status(200).send('OK running good...v1.1');
});
app.use('/api/v1/config', configurationController);
app.use('/api/agent', configRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/apikeys', apikeyRoutes);
app.use('/api/service', serviceRoutes);
app.use('/chatbot', chatbot);
app.use('/gtwyEmbed', gtwyEmbedRoutes);
app.use('/user', userOrgLocalController);
app.use('/alerting', alerting)
app.use('/hello', helloRoutes);
app.use('/thread', threadRoutes);
app.use('/metrics', metricsRoutes);
app.use('/org', AuthRouter);
app.use('/internal', InternalRoutes);
app.use('/rag', RagRouter);
app.use('/testcases', testcaseRoutes);
app.use('/report', reportRoute);
app.use('/modelConfiguration', ModelsConfigRoutes);
app.use('/auth', AuthRouter)
app.use('/data', agentLookupRoutes)
app.use('/functions', apiCallRoutes)
app.use('/bridge/versions', bridgeVersionRoutes)
app.use('/utils', utilsRoutes)
app.use('/prebuilt_prompt', prebuiltPromptRoutes)
app.use('/runagents', runAgentsRoutes)
app.use('/bridge', bridgeRoutes)
app.use('/Template', templateRoute)

//Metrics
// app.use('/api/v1/metrics', metrisRoutes);

app.use(responseMiddleware); // send response
app.use(notFoundMiddleware); // added at the last, so that it runs after all routes is being checked
app.use(errorHandlerMiddleware);


import { initModelConfiguration, backgroundListenForChanges } from './services/utils/loadModelConfigs.js';

initializeMonthlyLatencyReport();
initializeWeeklyLatencyReport();
initializeDailyUpdateCron()

initModelConfiguration();
backgroundListenForChanges();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});

// Graceful shutdown handler
const shutdown = async (signal, reason) => {
  console.log(`\nReceived ${signal} signal, starting graceful shutdown...`);
  console.log(`Reason: ${reason}`);

  try {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed successfully');

    // Close server
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    console.log('Server closed successfully');

    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle different types of shutdown signals
process.on('SIGINT', () => shutdown('SIGINT', 'User initiated shutdown (Ctrl+C)'));
process.on('SIGTERM', () => shutdown('SIGTERM', 'System shutdown'));
process.on('SIGQUIT', () => shutdown('SIGQUIT', 'Quit signal'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException', `Uncaught exception: ${error.message}`);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown('unhandledRejection', `Unhandled rejection: ${reason}`);
});
