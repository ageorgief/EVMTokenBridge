const EventListenerService = require('./services/eventListenerService');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27016/evm-bridge';

start();

app.get('/', (req, res) => {
  res.send('Server started');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function start() {
  console.log(MONGO_URI);
  await mongoose.connect(MONGO_URI);
    // .then(() => console.log("Connected to MongoDB"))
    // .catch((err) => console.error(err));
  console.log("Connected to MongoDB");
  const eventListenerService = new EventListenerService();
  eventListenerService.start();
}