const { Command } = require('commander');
const BridgeSDK = require('../sdk/bridge/bridge.js');
const blockchainsConfig = require('./config.json');

const program = new Command();
let blockchains = {};

function initialize() {
  blockchainsConfig.blockchains.forEach(config => {
    blockchains[config.name] = {
      chainId: config.chainId,
      contractAddress: config.contractAddress
    };
  });
}

initialize();

program.version('1.0.0');
program
  .command('lock <tokenAddress> <amount> <sourceChain> <targetChain> <targetWalletAddress> <privateKey>')
  .description('Locks tokens on the source chain for a chosen target chain where they can be claimed by a given target wallet address')
  .action(async (tokenAddress, amount, sourceChain, targetChain, targetWalletAddress, privateKey) => {

    const blockchain = blockchains[sourceChain];
    const contractAddress = blockchain.contractAddress;
    const sourceChainId = blockchain.chainId;
    const targetChainId = blockchains[targetChain].chainId

    const bridgeSDK = new BridgeSDK(sourceChainId, contractAddress, privateKey);

    try {
      await bridgeSDK.lockToken(tokenAddress, amount, targetChainId, targetWalletAddress, privateKey);
    } catch (error) {
      console.error('Error while locking tokens:', error.message);
    }
  });

program
  .command('claim <tokenAddress> <sourceChain> <targetChain> <privateKey>')
  .description('Claims tokens that have been locked on a source chain')
  .action(async (tokenAddress, sourceChain, targetChain, privateKey) => {

    const blockchain = blockchains[targetChain];
    const contractAddress = blockchain.contractAddress;
    const targetChainId = blockchain.chainId;
    const sourceChainId = blockchains[sourceChain].chainId

    console.log('contractAddress:', contractAddress);
    console.log('targetChainId:', targetChainId);
    console.log('sourceChainId:', sourceChainId);


    const bridgeSDK = new BridgeSDK(targetChainId, contractAddress, privateKey);

    try {
      await bridgeSDK.claimToken(tokenAddress, sourceChainId);
    } catch (error) {
      console.error('Error while claiming tokens:', error.message);
    }
  });

program
  .command('burn <wrappedTokenAddress> <amount> <sourceChain> <targetChain> <targetAddress> <privateKey>')
  .description('Burns wrapped tokens on a source chain, so that on a target chain where the tokens were locked a given user can release(retrieve) them')
  .action(async (wrappedTokenAddress, amount, sourceChain, targetChain, targetAddress, privateKey) => {
    const blockchain = blockchains[sourceChain];
    const contractAddress = blockchain.contractAddress;
    const sourceChainId = blockchain.chainId;
    const targetChainId = blockchains[targetChain].chainId

    const bridgeSDK = new BridgeSDK(sourceChainId, contractAddress, privateKey);

    try {
      await bridgeSDK.burnToken(wrappedTokenAddress, amount, targetChainId, targetAddress);
    } catch (error) {
      console.error('Error while burning tokens:', error.message);
    }
  });

program
  .command('release <originTokenAddress> <sourceChain> <privateKey>')
  .description('Releases token that has been locked on a source chain')
  .action(async (originTokenAddress, sourceChain, privateKey) => {
    const blockchain = blockchains[sourceChain];
    const contractAddress = blockchain.contractAddress;
    const sourceChainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(sourceChainId, contractAddress, privateKey);

    try {
      await bridgeSDK.releaseToken(originTokenAddress);
    } catch (error) {
      console.error('Error while burning tokens:', error.message);
    }
  });

program
  .command('setFeePercentage <network> <feePercentage> <privateKey>')
  .description('Sets the fee percentage of the bridge')
  .action(async (network, feePercentage, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.setFeePercentage(feePercentage);
    } catch (error) {
      console.error('Error while setting fee percentage:', error.message);
    }
  });

program
  .command('mint <network> <tokenAddress> <recepient> <amount> <privateKey>')
  .description('Mints token to recepient')
  .action(async (network, tokenAddress, recepient, amount, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.mintMyToken(tokenAddress, recepient, amount);
    } catch (error) {
      console.error('Error while minting tokens:', error.message);
    }
  });

program
  .command('balanceOf <network> <tokenAddress> <recepient> <privateKey>')
  .description('Returns balance of token for a recepient')
  .action(async (network, tokenAddress, recepient, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.getBalanceOf(tokenAddress, recepient);
    } catch (error) {
      console.error('Error while minting tokens:', error.message);
    }
  });

  program
  .command('getTokenName <network> <tokenAddress> <privateKey>')
  .description('Returns balance of token for a recepient')
  .action(async (network, tokenAddress, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.getTokenName(tokenAddress,chainId);
    } catch (error) {
      console.error('Error while minting tokens:', error.message);
    }
  });

program
  .command('getClaimableTokens <network> <lockerAddress> <sourceChain> <originTokenAddress> <privateKey>')
  .description('Returns amount of claimable tokens for a chosen blockchain by user -> source chain-> address of origin token')
  .action(async (network, lockerAddress, sourceChain, originTokenAddress, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;
    const sourceChainId = blockchains[sourceChain].chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.getClaimableTokensAmount(lockerAddress, sourceChainId, originTokenAddress);
    } catch (error) {
      console.error('Error while minting tokens:', error.message);
    }
  });

program
  .command('getWrappedTokenByOriginToken <network> <sourceChain> <originTokenAddress> <privateKey>')
  .description('Mints token to recepient')
  .action(async (network, sourceChain, originTokenAddress, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;
    const sourceChainId = blockchains[sourceChain].chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.getWrappedByOriginByChain(sourceChainId, originTokenAddress);
    } catch (error) {
      console.error('Error while minting tokens:', error.message);
    }
  });

program
  .command('transfer <network> <wrappedTokenFactoryAddress> <privateKey>')
  .description('Transfers ownership of wrappedTokenFactory to the bridge')
  .action(async (network, wrappedTokenFactoryAddress, privateKey) => {
    const blockchain = blockchains[network];
    const contractAddress = blockchain.contractAddress;
    const chainId = blockchain.chainId;

    const bridgeSDK = new BridgeSDK(chainId, contractAddress, privateKey);

    try {
      await bridgeSDK.transferWrappedTokenFactoryOwnership(wrappedTokenFactoryAddress);
    } catch (error) {
      console.error('Error while locking tokens:', error.message);
    }
  });


program.parse(process.argv);
