// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SparseMap} from "./SparseMap.sol";
import {TileWithCoordLib} from "./TileWithCoordLib.sol";
import {TileLib} from "./TileLib.sol";

contract SparseMapMock {
    using SparseMap for SparseMap.Map;
    using TileLib for TileLib.Tile;
    SparseMap.Map[30] internal maps;

    function set(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        maps[idx].set(x, y, size);
    }

    function setTileWithCoord(uint256 idx, TileWithCoordLib.TileWithCoord calldata tile) external {
        maps[idx].setTileWithCoord(tile);
    }

    function setMap(uint256 idx, uint256 contained) external {
        maps[idx].setMap(maps[contained]);
    }

    function clear(uint256 idx, uint256 x, uint256 y, uint256 size) external {
        maps[idx].clear(x, y, size);
    }

    function clearTileWithCoord(uint256 idx, TileWithCoordLib.TileWithCoord calldata tile) external {
        maps[idx].clearTileWithCoord(tile);
    }

    function clearMap(uint256 idx, uint256 contained) external {
        maps[idx].clearMap(maps[contained]);
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

    function floodStep(
        uint256 idx,
        TileLib.Tile[] memory data
    ) external view returns (TileLib.Tile[] memory current, TileLib.Tile[] memory next, bool done) {
        (next, done) = maps[idx].floodStep(data);
        return (data, next, done);
    }

    function floodStepWithSpot(
        uint256 idx
    ) external view returns (TileWithCoordLib.TileWithCoord[] memory current, TileLib.Tile[] memory next, bool done) {
        current = maps[idx].values;
        next = new TileLib.Tile[](current.length);
        next[0] = current[0].tile.findAPixel();
        return (current, next, done);
    }

    function findAPixel(uint256 idx) external view returns (TileLib.Tile memory tile) {
        return maps[idx].values[0].tile.findAPixel();
    }

    function containMap(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].containMap(maps[contained]);
    }

    function isEqual(uint256 idx, uint256 other) external view returns (bool) {
        return maps[idx].isEqual(maps[other].getMap());
    }

    function length(uint256 idx) external view returns (uint256) {
        return maps[idx].length();
    }

    function at(uint256 idx, uint256 index) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return maps[idx].at(index);
    }

    function containTileAtCoord(uint256 idx, uint256 x, uint256 y) external view returns (bool) {
        return maps[idx].containTileAtCoord(x, y);
    }
}
