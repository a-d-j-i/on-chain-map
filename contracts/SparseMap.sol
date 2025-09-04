// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TileWithCoordLib} from "./TileWithCoordLib.sol";
import {TileLib} from "./TileLib.sol";

/// @title SparseMap Library
/// @author aadjiman@gmail.com
/// @notice Library for managing a sparse map of tiles with coordinates
/// @dev Implements functionality for adding, removing, checking, and manipulating tiles in a sparse map
library SparseMap {
    using TileWithCoordLib for TileWithCoordLib.TileWithCoord;

    using TileLib for TileLib.Tile;

    /// @notice Map structure to store tiles with coordinates
    /// @dev To remove empty tiles we need to store the key (aka coords) inside the value
    struct Map {
        TileWithCoordLib.TileWithCoord[] values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping(uint256 => uint256) indexes;
    }

    /// @notice Error thrown when a tile is not found in the map
    error TileMissing();

    /// @notice Check if a coordinate exists in the map
    /// @param self The map to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return bool True if the coordinate exists in the map
    function contain(Map storage self, uint256 x, uint256 y) public view returns (bool) {
        uint256 key = TileWithCoordLib.getKey(x, y);
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            return false;
        }
        return self.values[idx - 1].contain(x, y);
    }

    /// @notice Check if a tile of given size exists at coordinates
    /// @param self The map to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size of tile to check for
    /// @return bool True if the tile exists at the coordinates
    function contain(Map storage self, uint256 x, uint256 y, uint256 size) public view returns (bool) {
        uint256 key = TileWithCoordLib.getKey(x, y);
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            return false;
        }
        // TODO: We can call TileLib directly to use less gas ?
        return self.values[idx - 1].contain(x, y, size);
    }

    /// @notice Check if a specific tile exists in the map
    /// @param self The map to check
    /// @param tile The tile to look for
    /// @return bool True if the tile exists in the map
    function containTileWithCoord(
        Map storage self,
        TileWithCoordLib.TileWithCoord memory tile
    ) public view returns (bool) {
        uint256 key = tile.getKey();
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            return false;
        }
        return self.values[idx - 1].contain(tile);
    }

    /// @notice Check if one map contains all tiles from another map
    /// @dev self can be huge, but contained must be small, we iterate over contained values
    /// @param self The map to check against
    /// @param contained The map that should be contained
    /// @return bool True if self contains all tiles from contained
    function containMap(Map storage self, Map storage contained) public view returns (bool) {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            if (!containTileWithCoord(self, contained.values[i])) {
                return false;
            }
        }
        return true;
    }

    /// @notice Set a tile of given size at coordinates
    /// @param self The map to modify
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size of tile to set
    function set(Map storage self, uint256 x, uint256 y, uint256 size) public {
        uint256 key = TileWithCoordLib.getKey(x, y);
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            // Add a new tile
            TileWithCoordLib.TileWithCoord memory t = TileWithCoordLib.initTileWithCoord(x, y);
            self.values.push(t.set(x, y, size));
            self.indexes[key] = self.values.length;
        } else {
            // contains
            self.values[idx - 1] = self.values[idx - 1].set(x, y, size);
        }
    }

    /// @notice Set a specific tile in the map
    /// @param self The map to modify
    /// @param tile The tile to set
    function setTileWithCoord(Map storage self, TileWithCoordLib.TileWithCoord memory tile) public {
        uint256 key = tile.getKey();
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            // Add a new tile
            self.values.push(tile);
            self.indexes[key] = self.values.length;
        } else {
            self.values[idx - 1] = self.values[idx - 1].merge(tile);
        }
    }

    /// @notice Set all tiles from one map into another
    /// @param self The destination map
    /// @param contained The source map with tiles to set
    function setMap(Map storage self, Map storage contained) public {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            setTileWithCoord(self, contained.values[i]);
        }
    }

    /// @notice Clear a tile of given size at coordinates
    /// @param self The map to modify
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size of tile to clear
    /// @return bool True if a tile was cleared
    function clear(Map storage self, uint256 x, uint256 y, uint256 size) public returns (bool) {
        uint256 key = TileWithCoordLib.getKey(x, y);
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains, nothing to clear
            return false;
        }
        TileWithCoordLib.TileWithCoord memory t = self.values[idx - 1].clear(x, y, size);
        if (t.isEmpty()) {
            _remove(self, idx, key);
        } else {
            self.values[idx - 1] = t;
        }
        return true;
    }

    /// @notice Clear a specific tile from the map
    /// @param self The map to modify
    /// @param tile The tile to clear
    /// @return bool True if the tile was cleared
    function clearTileWithCoord(Map storage self, TileWithCoordLib.TileWithCoord memory tile) public returns (bool) {
        uint256 key = tile.getKey();
        uint256 idx = self.indexes[key];
        if (idx == 0) {
            // !contains
            return false;
        }
        TileWithCoordLib.TileWithCoord memory t = self.values[idx - 1].subtract(tile);
        if (t.isEmpty()) {
            _remove(self, idx, key);
        } else {
            self.values[idx - 1] = t;
        }
        return true;
    }

    /// @notice Clear all tiles from one map that exist in another map
    /// @param self The map to clear from
    /// @param contained The map containing tiles to clear
    function clearMap(Map storage self, Map storage contained) public {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            clearTileWithCoord(self, contained.values[i]);
        }
    }

    /// @notice Clear all tiles from the map
    /// @param self The map to clear
    function clear(Map storage self) public {
        uint256 len = self.values.length;
        for (uint256 i; i < len; ++i) {
            delete self.indexes[self.values[i].getKey()];
            delete self.values[i];
        }
        delete self.values;
    }

    /// @notice Check if the map is empty
    /// @param self The map to check
    /// @return bool True if the map is empty
    /// @dev We remove the tiles when they are empty
    function isEmpty(Map storage self) public view returns (bool) {
        return self.values.length == 0;
    }

    /// @notice Check if two maps are equal
    /// @param self First map to compare
    /// @param other Second map to compare
    /// @return bool True if maps are equal
    function isEqual(Map storage self, Map storage other) public view returns (bool) {
        return isEqual(self, other.values);
    }

    /// @notice Check if a map equals an array of tiles
    /// @param self The map to compare
    /// @param other Array of tiles to compare against
    /// @return bool True if map equals the tiles array
    function isEqual(Map storage self, TileWithCoordLib.TileWithCoord[] memory other) public view returns (bool) {
        if (other.length != self.values.length) {
            return false;
        }
        uint256 cant = other.length;
        // Check that self contains the same set of tiles than other and they are equal
        for (uint256 i; i < cant; ++i) {
            uint256 key = other[i].getKey();
            uint256 idx = self.indexes[key];
            if (idx == 0 || !self.values[idx - 1].isEqual(other[i])) {
                return false;
            }
        }
        return true;
    }

    /// @notice Get the number of tiles in the map
    /// @param self The map to check
    /// @return uint256 Number of tiles
    function length(Map storage self) public view returns (uint256) {
        return self.values.length;
    }

    /// @notice Get the tile at a specific index
    /// @param self The map to get from
    /// @param index The index to get
    /// @return TileWithCoord The tile at the index
    function at(Map storage self, uint256 index) public view returns (TileWithCoordLib.TileWithCoord memory) {
        return self.values[index];
    }

    /// @notice Get a range of tiles from the map
    /// @param self The map to get from
    /// @param offset Starting index
    /// @param limit Number of tiles to get
    /// @return TileWithCoord[] Array of tiles
    function at(
        Map storage self,
        uint256 offset,
        uint256 limit
    ) public view returns (TileWithCoordLib.TileWithCoord[] memory) {
        TileWithCoordLib.TileWithCoord[] memory ret = new TileWithCoordLib.TileWithCoord[](limit);
        for (uint256 i; i < limit; ++i) {
            ret[i] = self.values[offset + i];
        }
        return ret;
    }

    /// @notice Get all tiles from the map
    /// @param self The map to get from
    /// @return TileWithCoord[] Array of all tiles
    /// @dev This can be problematic if it grows too much!
    function getMap(Map storage self) public view returns (TileWithCoordLib.TileWithCoord[] memory) {
        return self.values;
    }

    /// @notice Check if a tile exists at coordinates (for testing)
    /// @param self The map to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return bool True if a tile exists at coordinates
    function containTileAtCoord(Map storage self, uint256 x, uint256 y) public view returns (bool) {
        uint256 key = TileWithCoordLib.getKey(x, y);
        uint256 idx = self.indexes[key];
        return (idx != 0);
    }

    /// @notice Check if all tiles in the map are adjacent
    /// @param self The map to check
    /// @return ret True if all tiles are adjacent
    function isAdjacent(Map storage self) public view returns (bool ret) {
        TileLib.Tile[] memory spot = new TileLib.Tile[](self.values.length);
        // We assume that all self.values[] are non empty (we remove them if they are empty).
        spot[0] = self.values[0].tile.findAPixel();
        bool done;
        while (!done) {
            (spot, done) = floodStep(self, spot);
        }
        uint256 len = self.values.length;
        uint256 i;
        for (; i < len; ++i) {
            if (!spot[i].isEqual(self.values[i].tile)) {
                return false;
            }
        }
        return true;
    }

    /// @notice Constants for bit masking operations
    uint256 private constant LEFT_MASK = 0x0001000100010001000100010001000100010001000100010001000100010001;
    uint256 private constant LEFT_MASK_NEG = ~LEFT_MASK;
    uint256 private constant RIGHT_MASK = 0x8000800080008000800080008000800080008000800080008000800080008000;
    uint256 private constant RIGHT_MASK_NEG = ~RIGHT_MASK;
    uint256 private constant UP_MASK = 0x000000000000000000000000000000000000000000000000000000000000FFFF;
    uint256 private constant DOWN_MASK = 0xFFFF000000000000000000000000000000000000000000000000000000000000;

    /// @notice Grow a tile by one pixel in all directions
    /// @param x The tile data to grow
    /// @return uint256 The grown tile data
    function grow(uint256 x) private pure returns (uint256) {
        return (x | ((x & RIGHT_MASK_NEG) << 1) | ((x & LEFT_MASK_NEG) >> 1) | (x << 16) | (x >> 16));
    }

    /// @notice Perform one step of the flood fill algorithm
    /// @param self The map being flood filled
    /// @param current Current state of flood fill
    /// @return next Updated flood fill state
    /// @return done True if flood fill is complete
    function floodStep(
        Map storage self,
        TileLib.Tile[] memory current
    ) public view returns (TileLib.Tile[] memory next, bool done) {
        uint256 len = self.values.length;
        uint256 i;
        uint256 x;
        uint256 y;
        uint256 idx;
        TileLib.Tile memory ci;
        next = new TileLib.Tile[](len);
        // grow
        for (i; i < len; ++i) {
            ci = current[i];
            // isEmpty
            if (ci.data == 0) {
                continue;
            }
            x = self.values[i].getX();
            y = self.values[i].getY();

            // left
            if (x >= 16) {
                idx = _getIdx(self, x - 16, y);
                if (idx != 0) {
                    next[idx - 1].data |= (ci.data & LEFT_MASK) << 15;
                }
            }
            // up
            if (y >= 16) {
                idx = _getIdx(self, x, y - 16);
                if (idx != 0) {
                    next[idx - 1].data |= (ci.data & UP_MASK) << (16 * 15);
                }
            }
            // middle
            idx = _getIdx(self, x, y);
            if (idx != 0) {
                next[idx - 1].data |= grow(ci.data);
            }
            // down
            idx = _getIdx(self, x, y + 16);
            if (idx != 0) {
                next[idx - 1].data |= (ci.data & DOWN_MASK) >> (16 * 15);
            }
            // right
            idx = _getIdx(self, x + 16, y);
            if (idx != 0) {
                next[idx - 1].data |= (ci.data & RIGHT_MASK) >> 15;
            }
        }
        // Mask it.
        done = true;
        for (i = 0; i < len; ++i) {
            next[i] = next[i].and(self.values[i].tile);
            done = done && next[i].isEqual(current[i]);
        }
        return (next, done);
    }

    /// @notice Check if a rectangle is adjacent to the current map
    /// @param self The map to check against
    /// @param x The x coordinate of rectangle
    /// @param y The y coordinate of rectangle
    /// @param size Size of the rectangle
    /// @return bool True if rectangle is adjacent to map
    /// @dev Used to check a rectangle. Cheaper than isAdjacent(map)
    function isAdjacent(Map storage self, uint256 x, uint256 y, uint256 size) public view returns (bool) {
        uint256 idx;
        TileLib.Tile memory spot;
        TileLib.ExtendedTile memory corners = spot.set(x % 16, y % 16, size).grow();

        // left
        if (x >= 16) {
            idx = _getIdx(self, x - 16, y);
            if (idx != 0 && self.values[idx - 1].tile.isAdjacent(corners.left)) {
                return true;
            }
        }
        // up
        if (y >= 16) {
            idx = _getIdx(self, x, y - 16);
            if (idx != 0 && self.values[idx - 1].tile.isAdjacent(corners.up)) {
                return true;
            }
        }
        // middle
        idx = _getIdx(self, x, y);
        if (idx != 0 && self.values[idx - 1].tile.isAdjacent(corners.middle)) {
            return true;
        }
        // down
        idx = _getIdx(self, x, y + 16);
        if (idx != 0 && self.values[idx - 1].tile.isAdjacent(corners.down)) {
            return true;
        }
        // right
        idx = _getIdx(self, x + 16, y);
        if (idx != 0 && self.values[idx - 1].tile.isAdjacent(corners.right)) {
            return true;
        }
        return false;
    }

    /// @notice Move tiles from one map to another
    /// @param from Source map
    /// @param to Destination map
    /// @param tiles Tiles to move
    function moveTo(Map storage from, Map storage to, TileWithCoordLib.TileWithCoord[] calldata tiles) public {
        for (uint256 i; i < tiles.length; ++i) {
            if (!containTileWithCoord(from, tiles[i])) {
                revert TileMissing();
            }
            clearTileWithCoord(from, tiles[i]);
            setTileWithCoord(to, tiles[i]);
        }
    }

    /// @notice Add tiles to a map
    /// @param self The map to add to
    /// @param tiles Tiles to add
    function add(Map storage self, TileWithCoordLib.TileWithCoord[] calldata tiles) public {
        for (uint256 i; i < tiles.length; ++i) {
            setTileWithCoord(self, tiles[i]);
        }
    }

    /// @notice Remove tiles from a map
    /// @param self The map to remove from
    /// @param tiles Tiles to remove
    function remove(Map storage self, TileWithCoordLib.TileWithCoord[] calldata tiles) public {
        for (uint256 i; i < tiles.length; ++i) {
            if (!containTileWithCoord(self, tiles[i])) {
                revert TileMissing();
            }
            clearTileWithCoord(self, tiles[i]);
        }
    }

    /// @notice Internal function to remove a tile from the map
    /// @param self The map to remove from
    /// @param idx Index of tile to remove
    /// @param key Key of tile to remove
    function _remove(Map storage self, uint256 idx, uint256 key) private {
        // TODO: We remove an empty tile, maybe is just better to leave it there ?
        uint256 toDeleteIndex = idx - 1;
        uint256 lastIndex = self.values.length - 1;
        if (lastIndex != toDeleteIndex) {
            TileWithCoordLib.TileWithCoord memory lastValue = self.values[lastIndex];
            self.values[toDeleteIndex] = lastValue;
            self.indexes[lastValue.getKey()] = idx;
        }
        self.values.pop();
        delete self.indexes[key];
    }

    /// @notice Get index for a tile at coordinates
    /// @param self The map to get from
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return uint256 Index of tile
    function _getIdx(Map storage self, uint256 x, uint256 y) private view returns (uint256) {
        uint256 key = TileWithCoordLib.getKey(x, y);
        return self.indexes[key];
    }
}
