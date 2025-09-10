// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CompactMap} from "./CompactMap.sol";
import {TileWithCoordLib} from "./TileWithCoordLib.sol";
import {TileLib} from "./TileLib.sol";

contract CompactMapMock {
    using CompactMap for CompactMap.Map;
    using TileLib for TileLib.Tile;
    CompactMap.Map[30] internal maps;

    function set(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        maps[idx].set(x, y, size);
    }

    function setMap(uint256 idx, uint256 contained) external {
        maps[idx].setMap(maps[contained]);
    }

    function clearMap(uint256 idx, uint256 contained) external {
        maps[idx].clearMap(maps[contained]);
    }

    function clear(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        maps[idx].clear(x, y, size);
    }

    function clear(uint256 idx) external {
        maps[idx].clear();
    }

    function containCoord(uint256 idx, uint256 x, uint256 y) external view returns (bool) {
        return maps[idx].contain(x, y);
    }

    function contain(uint256 idx, uint256 x, uint256 y, uint256 size) external view returns (bool) {
        return maps[idx].contain(x, y, size);
    }

    function isAdjacent(uint256 idx) external view returns (bool) {
        return maps[idx].isAdjacent();
    }

    function isAdjacentRectangle(uint256 idx, uint256 x, uint256 y, uint256 size) external view returns (bool) {
        return maps[idx].isAdjacent(x, y, size);
    }

    function floodStep(
        uint256 idx,
        TileLib.Tile[] memory data
    ) external view returns (TileLib.Tile[] memory current, TileLib.Tile[] memory next, bool done) {
        (next, done) = maps[idx].floodStep(data);
        return (data, next, done);
    }

    function floodStepWithSpot(
        uint256 idx
    ) external view returns (TileLib.Tile[64] memory current, TileLib.Tile[] memory next, bool done) {
        current = maps[idx].tiles;
        next = new TileLib.Tile[](64);
        (bool found, uint256 i) = maps[idx].findNonEmptyTile();
        if (!found) {
            return (current, next, true);
        }
        next[i] = current[i].findAPixel();
        return (current, next, done);
    }

    function findAPixel(uint256 idx) external view returns (TileLib.Tile memory tile) {
        (bool found, uint256 i) = maps[idx].findNonEmptyTile();
        if (!found) {
            return tile;
        }
        return maps[idx].tiles[i].findAPixel();
    }

    function findNonEmptyTile(uint256 idx) external view returns (bool found, uint256 i) {
        return maps[idx].findNonEmptyTile();
    }

    function containMap(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].containMap(maps[contained]);
    }

    function isEqual(uint256 idx, uint256 other) external view returns (bool) {
        return maps[idx].isEqual(maps[other]);
    }

    function isEmpty(uint256 idx) external view returns (bool) {
        return maps[idx].isEmpty();
    }

    function getMap(uint256 idx) external view returns (CompactMap.Map memory) {
        return maps[idx].getMap();
    }

    function getSize(uint256 idx) external view returns (uint256 width, uint256 height) {
        return maps[idx].getSize();
    }
}
