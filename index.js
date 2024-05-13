const express = require('express');
const cors = require('cors');
const db = require("./models/index.js")
const modelController=require('./src/controllers/modelController');
const configurationController=require('./src/controllers/configController');
const app = express();
const PORT = process.env.PORT || 7072;
const mongoose = require('mongoose');
const config=require('./config/config.js');
const  metrisRoutes  =require('./routes/metrics_routes.js');
const interfaceUtilties = require('./routes/interface_utility_routes.js');
const chatbot = require('./routes/chatBot_routes.js') 
app.use(
  cors({
    origin: '*',
    maxAge: 86400,
    preflightContinue: true,
  }),
);

app.use(express.json());
try {
  mongoose.set("strictQuery", false);
  mongoose.connect(config.mongo.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
} catch (err) {
  console.log('database connection error: ',err.message);
  // logger.error('database connection error: ' + err.message);
}
app.get('/healthcheck', async (req, res) => {
  res.status(200).send('OK running good...');
});
app.use('/api/v1/model',modelController);
app.use('/api/v1/config',configurationController);
// app.use('/interface',interfaces);
app.use('/chatbot',chatbot);
app.use('/interfaceUtilites', interfaceUtilties);

//Metrics
app.use('/api/v1/metrics',metrisRoutes)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });