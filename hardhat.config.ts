import 'dotenv/config';
import type {HardhatUserConfig} from 'hardhat/config';
import {configVariable} from 'hardhat/config';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import hardhatEthersChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers';

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers, hardhatEthersChaiMatchers],
  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    amoy: {
      type: 'http',
      chainType: 'l1',
      url: configVariable('AMOY_RPC_URL'),
      accounts: [configVariable('AMOY_PRIVATE_KEY')],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable('POLYGONSCAN_API_KEY'),
    },
  },
};

export default config;
