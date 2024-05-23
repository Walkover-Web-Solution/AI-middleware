import express from "express";
import cors from "cors";
import modelController from "./src/controllers/modelController.js";
import configurationController from "./src/controllers/configController.js";
const app = express();
const PORT = process.env.PORT || 7072;
import mongoose from "mongoose";
import config from "./config/config.js";
import metrisRoutes from "./routes/metrics_routes.js";
import utlilityRoutes from "./routes/utlility_routes.js";
import chatbot from "./routes/chatBot_routes.js";
app.use(cors({
  origin: '*',
  maxAge: 86400,
  preflightContinue: true
}));
app.use(express.json());
try {
  mongoose.set("strictQuery", false);
  mongoose.connect(config.mongo.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
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

//Metrics
app.use('/api/v1/metrics', metrisRoutes);
app.listen(PORT, () => {
   
  console.log(`Server is running on port ${PORT}`);
});