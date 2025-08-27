# Solidity Map Library

This project implements a Solidity library for representing and manipulating two-dimensional bitmaps on-chain. The
bitmap is composed of tiles, where each tile is a 16x16 pixel square stored in a single EVM word. Using bitwise
operations, these tiles can be efficiently merged, compared and manipulated.

The library provides two implementations:

- A sparse implementation using mappings for tile storage, optimized for scattered data
- A compact implementation using arrays for tile storage, optimized for dense data

The library can be used to create ERC721 tokens that represent bitmap pieces which can be transferred between users. A
unique feature is the ability to enforce 4-connectivity, meaning pieces can only grow by adding pixels adjacent to
existing ones.

**Warning: This library is a work in progress and not production-ready**

When using this map library, gas consumption needs to be carefully considered. While the compact implementation is more
gas-efficient, the sparse implementation provides greater flexibility. Users should monitor gas usage to avoid hitting
block gas limits. Due to gas costs, this library is primarily intended for use on low-cost blockchains rather than
expensive mainnet networks.

## Project Overview

This example project includes:

- A simple Hardhat 3 configuration file.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html) and `ethers`
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally
simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat
configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key
of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment
variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
