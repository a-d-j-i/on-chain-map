// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TileWithCoordLib} from "./TileWithCoordLib.sol";

contract TileWithCoordLibMock {
    using TileWithCoordLib for TileWithCoordLib.TileWithCoord;
    TileWithCoordLib.TileWithCoord[30] public tiles;

    function initTileWithCoord(uint256 idx, uint256 x, uint256 y) external {
        tiles[idx] = TileWithCoordLib.initTileWithCoord(x, y);
    }

    function set(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        tiles[idx] = tiles[idx].set(x, y, size);
    }

    function clear(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        tiles[idx] = tiles[idx].clear(x, y, size);
    }

    function merge(uint256 src, uint256 value) external {
        tiles[src] = tiles[src].merge(tiles[value]);
    }

    function subtract(uint256 src, uint256 value) external {
        tiles[src] = tiles[src].subtract(tiles[value]);
    }

    function contain(uint256 idx, uint256 x, uint256 y, uint256 size) external view returns (bool) {
        return tiles[idx].contain(x, y, size);
    }

    function getTile(uint256 idx) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return tiles[idx];
    }

    function getX(uint256 idx) external view returns (uint256) {
        return tiles[idx].getX();
    }

    function getY(uint256 idx) external view returns (uint256) {
        return tiles[idx].getY();
    }

    function getKey(uint256 idx) external view returns (uint256) {
        return tiles[idx].getKey();
    }

    function isEmpty(uint256 idx) external view returns (bool) {
        return tiles[idx].isEmpty();
    }
}
