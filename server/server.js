const EventListenerService = require('./services/eventListenerService');
const express = require('express');
const mongoose = require('mongoose');
const ApiController = require('./api/apiController');
const app = express();
const port = 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27016/evm-bridge';

app.use(express.json());

start();

app.get('/', (req, res) => {
  res.send('Server started');
});

app.get('/api/bridgedTokensByWallet/:walletAddress?/:chainId?', async (req, res) => {
  const walletAddress = req.params.walletAddress;
  const chainId = req.params.chainId;

  const result = await new ApiController().getBridgedTokensByWalletAddress(walletAddress, chainId);

  if (result.isError) {
    res.status(400).send(result.data);
  } else {
    res.json(result.data);
  }
});

app.get('/api/bridgedTokens/:chainId?', async (req, res) => {
  const chainId = req.params.chainId;

  const result = await new ApiController().getBridgedTokens(chainId);

  if (result.isError) {
    res.status(400).send(result.data);
  } else {
    res.json(result.data);
  }
});

app.get('/api/waitingToBeClaimedTokens/:chainId?', async (req, res) => {
  const chainId = req.params.chainId;

  const result = await new ApiController().getWaitingToBeClaimedTokens(chainId);

  if (result.isError) {
    res.status(400).send(result.data);
  } else {
    res.json(result.data);
  }
});

app.get('/api/waitingToBeReleasedTokens/:chainId?', async (req, res) => {
  const chainId = req.params.chainId;

  const result = await new ApiController().getWaitingToBeReleasedTokens(chainId);

  if (result.isError) {
    res.status(400).send(result.data);
  } else {
    res.json(result.data);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

async function start() {
  await mongoose.connect(MONGO_URI);
  // .then(() => console.log("Connected to MongoDB"))
  // .catch((err) => console.error(err));
  console.log("Connected to MongoDB");
  
  const eventListenerService = new EventListenerService();
  eventListenerService.start();
}
