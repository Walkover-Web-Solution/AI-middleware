import 'express-async-errors';
import express from "express";
import cors from "cors";
// import multer from 'multer';
import configurationController from "./controllers/configController.js";
import apiKeyrouter from "./routes/apikeyRouter.js";
import helloRoutes from './routes/helloRoutes.js';
import threadRoutes from './routes/threadRoutes.js'
import metricsRoutes from "./routes/metrics_routes.js"
const app = express();
const PORT = process.env.PORT || 7072;
import mongoose from "mongoose";
import config from "../config/config.js";
// import metrisRoutes from "./routes/metrics_routes.js";
import chatbot from "./routes/chatBot_routes.js";
import RagRouter from "./routes/rag_routers.js";
import userOrgLocalController from "./routes/userOrgLocal_route.js";
import AuthRouter from "./routes/AuthRoute.js";
import notFoundMiddleware from './middlewares/notFound.js';
import errorHandlerMiddleware from './middlewares/errorHandler.js';
import responseMiddleware from './middlewares/responseMiddleware.js';
import configurePostmanCollection from './routes/configurePostmanCollection.js';
import InternalRoutes from './routes/InternalRoutes.js';
import alerting from './routes/alerting_routes.js';
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
app.use('/api/v1/config', configurationController);
app.use('/apikeys', apiKeyrouter);
app.use('/chatbot', chatbot);
app.use('/user', userOrgLocalController);
app.use('/config',configurePostmanCollection)
app.use('/alerting', alerting)
app.use('/hello', helloRoutes);
app.use('/thread', threadRoutes);
app.use('/metrics', metricsRoutes);
app.use('/org', AuthRouter);
app.use('/internal', InternalRoutes);
app.use('/rag', RagRouter);

//Metrics
// app.use('/api/v1/metrics', metrisRoutes);

app.use(responseMiddleware); // send response
app.use(notFoundMiddleware); // added at the last, so that it runs after all routes is being checked
app.use(errorHandlerMiddleware);
app.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);
});