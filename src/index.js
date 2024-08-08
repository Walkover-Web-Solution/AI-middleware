import 'express-async-errors';
import express from "express";
import cors from "cors";
// import multer from 'multer';
import modelController from "./controllers/modelController.js";
import configurationController from "./controllers/configController.js";
const app = express();
const PORT = process.env.PORT || 7072;
import mongoose from "mongoose";
import config from "../config/config.js";
import metrisRoutes from "./routes/metrics_routes.js";
import utlilityRoutes from "./routes/utlility_routes.js";
import chatbot from "./routes/chatBot_routes.js";
import userOrgLocalController from "./routes/userOrgLocal_route.js";
import notFoundMiddleware from './middlewares/notFound.js';
import errorHandlerMiddleware from './middlewares/errorHandler.js';
import responseMiddleware from './middlewares/responseMiddleware.js';
import configurePostmanCollection from './routes/configurePostmanCollection.js';
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
  res.status(200).send('OK running good...');
});
app.use('/api/v1/model', modelController);
app.use('/api/v1/config', configurationController);
app.use('/utility', utlilityRoutes);
app.use('/chatbot', chatbot);
app.use('/user', userOrgLocalController);
app.use('/config',configurePostmanCollection)

//Metrics
app.use('/api/v1/metrics', metrisRoutes);

app.use(responseMiddleware); // send response
app.use(notFoundMiddleware); // added at the last, so that it runs after all routes is being checked
app.use(errorHandlerMiddleware);
app.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);
});