// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SparseMap} from "./SparseMap.sol";
import {TileWithCoordLib} from "./TileWithCoordLib.sol";

contract SparseMapTest {
    using SparseMap for SparseMap.Map;
    using TileWithCoordLib for TileWithCoordLib.TileWithCoord;
    SparseMap.Map internal map;
    SparseMap.Map internal map2;

    function testIsEmpty() public {
        require(map.isEmpty(), "should be start empty");
        map.set(16, 16, 16);
        require(!map.isEmpty(), "should not be empty");
        map.clear(16, 16, 16);
        require(map.isEmpty(), "should be start after clear");
    }

    function testIsEqual() public {
        map.set(0, 0, 16);
        map2.set(0, 0, 8);
        map2.set(0, 8, 8);
        map2.set(8, 0, 8);
        map2.set(8, 8, 8);
        require(map.isEqual(map2), "map1 should be equal to map2");
    }

    // TODO: Measure gas consumption
    function testAddRemoveAndMove() public {
        TileWithCoordLib.TileWithCoord[] memory tiles = new TileWithCoordLib.TileWithCoord[](3);
        tiles[0] = TileWithCoordLib.initTileWithCoord(160, 160).set(160, 160, 16);
        tiles[1] = TileWithCoordLib.initTileWithCoord(320, 320).set(320, 320, 16);
        tiles[2] = TileWithCoordLib.initTileWithCoord(160, 320).set(160, 320, 16);

        map.add(tiles);
        require(
            map.contain(160, 160, 16) && map.contain(320, 320, 16) && map.contain(160, 320, 16),
            "map should contain the tiles 0,1,2 after add"
        );

        TileWithCoordLib.TileWithCoord[] memory tilesToMove = new TileWithCoordLib.TileWithCoord[](2);
        tilesToMove[0] = tiles[0];
        tilesToMove[1] = tiles[1];
        map.moveTo(map2, tilesToMove);

        require(
            map2.contain(160, 160, 16) && map2.contain(320, 320, 16) && !map2.contain(160, 320, 16),
            "map2 should contain the tiles 0,1 after move"
        );
        require(
            !map.contain(160, 160, 16) && !map.contain(320, 320, 16) && map.contain(160, 320, 16),
            "map should contain the tile 2 after move"
        );

        TileWithCoordLib.TileWithCoord[] memory tilesToRemove = new TileWithCoordLib.TileWithCoord[](1);
        tilesToRemove[0] = tiles[2];
        map.remove(tilesToRemove);
        require(map.isEmpty(), "map should be empty after removing the last tile");
    }
}
