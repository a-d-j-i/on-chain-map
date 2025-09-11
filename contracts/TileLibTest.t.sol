// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TileLib} from "./TileLib.sol";

contract TileLibTest {
    using TileLib for TileLib.Tile;

    function testInitAndClone() external {
        TileLib.Tile memory tile1 = TileLib.initTile();
        tile1.set(3, 3, 1);
        TileLib.Tile memory tile2 = tile1.clone();
        tile1.clear(3, 3, 1);
        require(tile2.contain(3, 3), "should not be affected by clear");
    }

    function testNot() external {
        TileLib.Tile memory tile = TileLib.initTile();
        require(tile.not().contain(0, 0, 16), "should contain everything");
    }
}
