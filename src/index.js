import 'express-async-errors';
import express from "express";
import cors from "cors";
import { configDotenv } from 'dotenv';
import './atatus.js'
// import multer from 'multer';
import './consumers/index.js';
import configurationController from "./controllers/configController.js";
import apiKeyrouter from "./routes/apikeyRouter.js";
import helloRoutes from './routes/helloRoutes.js';
import threadRoutes from './routes/threadRoutes.js'
import metricsRoutes from "./routes/metrics_routes.js"
const app = express();
configDotenv();
const PORT = process.env.PORT || 7072;
import mongoose from "mongoose";
import config from "../config/config.js";
// import metrisRoutes from "./routes/metrics_routes.js";
import chatbot from "./routes/chatBot_routes.js";
import RagRouter from "./routes/rag_routers.js";
import userOrgLocalController from "./routes/userOrgLocal_route.js";
import initializeMonthlyLatencyReport from './cron/monthlyLatencyReport.js';
import AuthRouter from "./routes/AuthRoute.js";
import notFoundMiddleware from './middlewares/notFound.js';
import errorHandlerMiddleware from './middlewares/errorHandler.js';
import responseMiddleware from './middlewares/responseMiddleware.js';
import configurePostmanCollection from './routes/configurePostmanCollection.js';
import InternalRoutes from './routes/InternalRoutes.js';
import alerting from './routes/alerting_routes.js';
import showCaseRoutes from './routes/showCase_routes.js'
import testcaseRoutes from './routes/testcase_routes.js'
import templateRoute from './routes/template_route.js'
import reportRoute from './routes/report_route.js'
import ModelsConfigRoutes from './routes/modelConfigRoutes.js'
import gtwyEmbedRoutes from './routes/gtwyEmbedRoutes.js'
import { DocumentLoader } from './services/document-loader/index.js';
import('./services/cacheService.js')
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
app.get('/rag-testing-async', async (req, res) => {
  res.send('Done');
  setTimeout(async () => {
    const loader = new DocumentLoader();
    const content = await loader.getContent(req.query.url || 'https://viasocket.com');
    console.log(content);
  }, 10000)
})
app.get('/rag-testing', async (req, res) => {
  const loader = new DocumentLoader();
  const content = await loader.getContent(req.query.url || 'https://viasocket.com');
  res.send(content);
})
app.use('/api/v1/config', configurationController);
app.use('/apikeys', apiKeyrouter);
app.use('/chatbot', chatbot);
app.use('/gtwyEmbed', gtwyEmbedRoutes);
app.use('/user', userOrgLocalController);
app.use('/config',configurePostmanCollection)
app.use('/alerting', alerting)
app.use('/hello', helloRoutes);
app.use('/thread', threadRoutes);
app.use('/metrics', metricsRoutes);
app.use('/org', AuthRouter);
app.use('/internal', InternalRoutes);
app.use('/rag', RagRouter);
app.use('/showcase',showCaseRoutes);
app.use('/testcases',testcaseRoutes);
app.use('/report',reportRoute);
app.use('/modelConfiguration',ModelsConfigRoutes);
app.use('/Template',templateRoute)
app.use('/auth', AuthRouter)

//Metrics
// app.use('/api/v1/metrics', metrisRoutes);

app.use(responseMiddleware); // send response
app.use(notFoundMiddleware); // added at the last, so that it runs after all routes is being checked
app.use(errorHandlerMiddleware);


initializeMonthlyLatencyReport();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});