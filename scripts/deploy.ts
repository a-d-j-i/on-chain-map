import {verifyContract} from 'hardhat-verify/verify';
import hre from 'hardhat';

const namedAccounts = {
  amoy: '0xFEa54861eCB116026EbE379B13a2315aF79Cb6dc',
};

async function main() {

  await verifyContract(
    {
      address: '0x...',
      constructorArgs: [],
      libraries: {MyLibrary: '0x...'},
      contract: 'contracts/MyContract.sol:MyContract',
    },
    hre);
  console.log(hre);
}

main().catch(console.error);
