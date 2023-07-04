const { Command } = require('commander');
const BridgeSDK = require('../sdk/bridge/bridge.js');
//import { lockTokens, claimTokens } from './sdk'; // Import your SDK functions

const program = new Command();
program.version('1.0.0');

program
  .command('lock <tokenAddress> <amount> <sourceChainId> <targetChainId> <targetWalletAddress>')
  .description('Locks tokens on the source chain and transfer them to the target chain')
  .action(async (tokenAddress, amount, sourceChainId, targetChainId, targetWalletAddress) => {
    
    const bridgeSDK = new BridgeSDK(); 
    
    // Call the lockTokens function from your SDK
    try {
      const result = await bridgeSDK.lockToken(tokenAddress, amount, targetChainId, targetWalletAddress);
      console.log('Tokens locked:', result);
    } catch (error) {
      console.error('Error locking tokens:', error.message);
    }
  });

// program
//   .command('claim <tokenAddress> <sourceChainId> <targetChainId>')
//   .description('Claims locked tokens')
//   .action(async (tokenAddress: string, sourceChainId: number, targetChainId: number) => {
//     // Validate input parameter

//     // Instantiate your SDK
//     //const sdk = new YourSDK();

//     // Call the claimTokens function from your SDK
//     try {
//       //const result = await sdk.claimTokens(tokenAddress);
//       const result = 2;

//       console.log('Tokens claimed:', result);
//     } catch (error) {
//       console.error('Error claiming tokens:', error.message);
//     }
//   });

//   program
//   .command('burn <tokenAddress> <sourceChainId> <targetChainId>')
//   .description('Burns wrapped tokens')
//   .action(async (tokenAddress: string, sourceChainId: number, targetChainId: number) => {
//     // Validate input parameter

//     // Instantiate your SDK
//     //const sdk = new YourSDK();

//     // Call the claimTokens function from your SDK
//     try {
//       //const result = await sdk.burn(tokenAddress);
//       const result = 3;

//       console.log('Tokens claimed:', result);
//     } catch (error) {
//       console.error('Error claiming tokens:', error.message);
//     }
//   });

//   program
//   .command('release <tokenAddress> <sourceChainId>')
//   .description('Releases wrapped tokens')
//   .action(async (tokenAddress: string, sourceChainId: number) => {
//     // Validate input parameter

//     // Instantiate your SDK
//     //const sdk = new YourSDK();

//     // Call the claimTokens function from your SDK
//     try {
//       //const result = await sdk.burn(tokenAddress);
//       const result = 3;

//       console.log('Tokens claimed:', result);
//     } catch (error) {
//       console.error('Error claiming tokens:', error.message);
//     }
//   });

program.parse(process.argv);