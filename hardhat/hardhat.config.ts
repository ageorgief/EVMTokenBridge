import { HardhatUserConfig, task, subtask } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY as string;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY as string;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [OWNER_PRIVATE_KEY]
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [OWNER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

task('deploy', 'Deploys contracts').setAction(async () => {
  const { main } = await import('./scripts/deploy');
  await main();
});

export default config;
