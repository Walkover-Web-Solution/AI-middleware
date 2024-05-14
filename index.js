<<<<<<< Updated upstream
const express = require('express');
const cors = require('cors');
const db = require("./models/index.js")
const modelController = require('./src/controllers/modelController');
const configurationController = require('./src/controllers/configController');
const app = express();
const PORT = process.env.PORT || 7072;
const mongoose = require('mongoose');
const config = require('./config/config.js');
const metrisRoutes = require('./routes/metrics_routes.js');
const interfaceUtilties = require('./routes/interface_utility_routes.js');
const chatbot = require('./routes/chatBot_routes.js')
=======
import express, { json } from 'express';
import cors from 'cors';
// import db from "./models/index.js";
import modelController from './src/controllers/modelController.js';
import configurationController from './src/controllers/configController.js';
const app = express();
const PORT = process.env.PORT || 7072;
import { set, connect } from 'mongoose';
import config from './config/config.js';
import metrisRoutes from './routes/metrics_routes.js';
import chatbot from './routes/chatBot_routes.js';

const { mongo } = config;
>>>>>>> Stashed changes
app.use(
  cors({
    origin: '*',
    maxAge: 86400,
    preflightContinue: true,
  }),
);

app.use(json());
try {
  set("strictQuery", false);
  connect(mongo.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
} catch (err) {
  console.log('database connection error: ', err.message);
  // logger.error('database connection error: ' + err.message);
}
app.get('/healthcheck', async (req, res) => {
  res.status(200).send('OK running good...');
});
app.use('/api/v1/model', modelController);
app.use('/api/v1/config', configurationController);
// app.use('/interface',interfaces);
app.use('/chatbot', chatbot);

//Metrics
app.use('/api/v1/metrics', metrisRoutes)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});