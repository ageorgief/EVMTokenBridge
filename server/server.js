const EventListenerService = require('./services/eventListenerService');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Server started');
});

const eventListenerService = new EventListenerService();
eventListenerService.start();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});