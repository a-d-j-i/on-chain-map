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

This project uses monorepos:

- packages/contracts: Solidity contracts
- packages/thegraph: Subgraph to track the MapToken contract events
