// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TileLib} from "./TileLib.sol";

/// @title CompactMap Library
/// @author aadjiman@gmail.com
/// @notice A library for managing 2D tile maps in a compact format
/// @dev Uses TileLib for internal tile operations
library CompactMap {
    using TileLib for TileLib.Tile;
    uint256 private constant WIDTH = 4;
    uint256 private constant TOTAL_SIZE = WIDTH * 4;

    /// @notice Structure representing a 2D map of tiles
    /// @dev Uses fixed size array of TileLib.Tile elements
    struct Map {
        TileLib.Tile[TOTAL_SIZE] values;
    }

    /// @notice Error for invalid coordinates in a tile operation
    /// @param x The x coordinate that caused the error
    /// @param y The y coordinate that caused the error
    error InvalidCoordinates(uint256 x, uint256 y);

    /// @notice Check if a specific coordinate is set in the map
    /// @param self The map to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return bool True if the coordinate is set
    function contain(Map storage self, uint256 x, uint256 y) public view returns (bool) {
        if (x > 16 * WIDTH) {
            revert InvalidCoordinates(x, y);
        }
        uint256 idx = _getIdx(x, y);
        return self.values[idx].contain(x % 16, y % 16);
    }

    /// @notice Check if a rectangle area is fully set in the map
    /// @param self The map to check
    /// @param x The x coordinate of top-left corner
    /// @param y The y coordinate of top-left corner
    /// @param size The size of the rectangle
    /// @return bool True if the area is fully set
    function contain(Map storage self, uint256 x, uint256 y, uint256 size) public view returns (bool) {
        if (x > 16 * WIDTH) {
            revert InvalidCoordinates(x, y);
        }
        uint256 idx = _getIdx(x, y);
        return self.values[idx].contain(x % 16, y % 16, size);
    }

    /// @notice Check if one map is fully contained within another
    /// @param self The containing map
    /// @param contained The map that should be contained
    /// @return bool True if contained is fully within self
    /// @dev self can be huge, but contained must be small, we iterate over contained values.
    function containMap(Map storage self, Map storage contained) public view returns (bool) {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            if (!self.values[i].contain(contained.values[i])) {
                return false;
            }
        }
        return true;
    }

    /// @notice Set a rectangle area in the map
    /// @param self The map to modify
    /// @param x The x coordinate of top-left corner
    /// @param y The y coordinate of top-left corner
    /// @param size The size of the rectangle
    function set(Map storage self, uint256 x, uint256 y, uint256 size) public {
        if (x > 16 * WIDTH) {
            revert InvalidCoordinates(x, y);
        }
        uint256 idx = _getIdx(x, y);
        self.values[idx] = self.values[idx].set(x % 16, y % 16, size);
    }

    /// @notice Set all tiles from another map into this map
    /// @param self The map to modify
    /// @param contained The map to merge in
    function setMap(Map storage self, Map storage contained) public {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            self.values[i] = self.values[i].or(contained.values[i]);
        }
    }

    /// @notice Clear a rectangle area in the map
    /// @param self The map to modify
    /// @param x The x coordinate of top-left corner
    /// @param y The y coordinate of top-left corner
    /// @param size The size of the rectangle
    /// @return bool Always returns true
    function clear(Map storage self, uint256 x, uint256 y, uint256 size) public returns (bool) {
        if (x > 16 * WIDTH) {
            revert InvalidCoordinates(x, y);
        }
        uint256 idx = _getIdx(x, y);
        self.values[idx] = self.values[idx].clear(x % 16, y % 16, size);
        return true;
    }

    /// @notice Clear all tiles that are set in another map
    /// @param self The map to modify
    /// @param contained The map whose tiles should be cleared
    function clearMap(Map storage self, Map storage contained) public {
        uint256 len = contained.values.length;
        for (uint256 i; i < len; ++i) {
            self.values[i] = self.values[i].subtract(contained.values[i]);
        }
    }

    /// @notice Clear the entire map
    /// @param self The map to clear
    function clear(Map storage self) public {
        uint256 len = self.values.length;
        for (uint256 i; i < len; ++i) {
            delete self.values[i];
        }
    }

    /// @notice Check if the map is completely empty
    /// @param self The map to check
    /// @return bool True if no tiles are set
    function isEmpty(Map storage self) public view returns (bool) {
        uint256 len = self.values.length;
        for (uint256 i; i < len; ++i) {
            if (!self.values[i].isEmpty()) {
                return false;
            }
        }
        return true;
    }

    /// @notice Check if two maps are exactly equal
    /// @param self The first map
    /// @param other The second map
    /// @return bool True if maps are identical
    function isEqual(Map storage self, Map storage other) public view returns (bool) {
        uint256 len = self.values.length;
        for (uint256 i; i < len; ++i) {
            if (!self.values[i].isEqual(other.values[i])) {
                return false;
            }
        }
        return true;
    }

    /// @notice Get the number of tiles in the map
    /// @param self The map to check
    /// @return uint256 The length of the values array
    function length(Map storage self) public view returns (uint256) {
        return self.values.length;
    }

    /// @notice Get a specific tile from the map
    /// @param self The map to read from
    /// @param index The index of the tile
    /// @return TileLib.Tile The tile at the given index
    function at(Map storage self, uint256 index) public view returns (TileLib.Tile memory) {
        return self.values[index];
    }

    /// @notice Get a range of tiles from the map
    /// @param self The map to read from
    /// @param offset Starting index
    /// @param limit Number of tiles to return
    /// @return TileLib.Tile[] Array of tiles
    function at(Map storage self, uint256 offset, uint256 limit) public view returns (TileLib.Tile[] memory) {
        TileLib.Tile[] memory ret = new TileLib.Tile[](limit);
        for (uint256 i; i < limit; ++i) {
            ret[i] = self.values[offset + i];
        }
        return ret;
    }

    /// @notice Get a copy of the entire map
    /// @param self The map to copy
    /// @return Map A memory copy of the map
    /// @dev This can be problematic if it grows too much !!!
    function getMap(Map storage self) public pure returns (Map memory) {
        return self;
    }

    /// @notice Checks the full map to see if all the pixels are adjacent
    /// @param self The map to copy
    /// @return ret true if the map has only one connected component
    function isAdjacent(Map storage self) public view returns (bool ret) {
        TileLib.Tile[] memory spot = new TileLib.Tile[](self.values.length);
        // We assume that all self.values[] are non empty (we remove them if they are empty).
        spot[0] = self.values[0].findAPixel();
        bool done;
        while (!done) {
            (spot, done) = floodStep(self, spot);
        }
        uint256 len = self.values.length;
        uint256 i;
        for (; i < len; ++i) {
            if (!spot[i].isEqual(self.values[i])) {
                return false;
            }
        }
        return true;
    }

    /// @dev Bit masks used for tile operations
    uint256 private constant LEFT_MASK = 0x0001000100010001000100010001000100010001000100010001000100010001;
    uint256 private constant LEFT_MASK_NEG = ~LEFT_MASK;
    uint256 private constant RIGHT_MASK = 0x8000800080008000800080008000800080008000800080008000800080008000;
    uint256 private constant RIGHT_MASK_NEG = ~RIGHT_MASK;
    uint256 private constant UP_MASK = 0x000000000000000000000000000000000000000000000000000000000000FFFF;
    uint256 private constant DOWN_MASK = 0xFFFF000000000000000000000000000000000000000000000000000000000000;

    /// @notice Grows a tile value in all directions by one pixel
    /// @param x The tile value to grow
    /// @return uint256 The grown tile value
    function grow(uint256 x) private pure returns (uint256) {
        return (x | ((x & RIGHT_MASK_NEG) << 1) | ((x & LEFT_MASK_NEG) >> 1) | (x << 16) | (x >> 16));
    }

    /// @notice One step in flood fill algorithm for finding connected components
    /// @param self The map being processed
    /// @param current Current state of flood fill
    /// @return next Updated state of flood fill
    /// @return done True if flood fill is complete
    function floodStep(
        Map storage self,
        TileLib.Tile[] memory current
    ) public view returns (TileLib.Tile[] memory next, bool done) {
        uint256 len = TOTAL_SIZE;
        uint256 i;
        uint256 x;
        TileLib.Tile memory ci;
        next = new TileLib.Tile[](len);
        // grow
        for (i; i < len; ++i) {
            ci = current[i];
            // isEmpty
            if (ci.data == 0) {
                continue;
            }
            x = i % WIDTH;
            // left
            if (x > 0) {
                next[i - 1].data |= (ci.data & LEFT_MASK) << 15;
            }
            // right
            if (x < WIDTH - 1) {
                next[i + 1].data |= (ci.data & RIGHT_MASK) >> 15;
            }
            // middle
            next[i].data |= grow(ci.data);
            // up
            if (i > WIDTH) {
                next[i - WIDTH].data |= (ci.data & UP_MASK) << (16 * 15);
            }
            // down
            if (i < len - WIDTH) {
                next[i + WIDTH].data |= (ci.data & DOWN_MASK) >> (16 * 15);
            }
        }
        // Mask it.
        // TODO: check if we can optimize by dealing with empty tiles.
        done = true;
        for (i = 0; i < len; ++i) {
            next[i] = next[i].and(self.values[i]);
            done = done && next[i].isEqual(current[i]);
        }
        return (next, done);
    }

    /// @notice check if a rectangle is adjacent to the current map (used to add a rectangle to a map).
    /// @param self The map being processed
    /// @param x The x coordinate of top-left corner
    /// @param y The y coordinate of top-left corner
    /// @param size The size of the rectangle
    /// @return true if is adjacent
    /// @dev Cheaper than isAdjacent(map)
    /// @dev TODO: create an optimized version for size == 1
    function isAdjacent(Map storage self, uint256 x, uint256 y, uint256 size) public view returns (bool) {
        uint256 idx;
        TileLib.Tile memory spot;
        TileLib.ExtendedTile memory corners = spot.set(x % 16, y % 16, size).grow();

        // left
        if (x >= 16) {
            idx = _getIdx(x - 16, y);
            if (idx != 0 && !self.values[idx].isAdjacent(corners.left)) {
                return true;
            }
        }
        // up
        if (y >= 16) {
            idx = _getIdx(x, y - 16);
            if (idx != 0 && self.values[idx].isAdjacent(corners.up)) {
                return true;
            }
        }
        // middle
        idx = _getIdx(x, y);
        if (idx != 0 && !self.values[idx].isAdjacent(corners.middle)) {
            return true;
        }
        // down
        idx = _getIdx(x, y + 16);
        if (idx != 0 && self.values[idx].isAdjacent(corners.down)) {
            return true;
        }
        // right
        idx = _getIdx(x + 16, y);
        if (idx != 0 && !self.values[idx].isAdjacent(corners.right)) {
            return true;
        }
        return false;
    }

    /// @notice Find a non-empty tile in the map
    /// @param self The map to search
    /// @return bool True if a non-empty tile was found
    /// @return uint256 Index of the non-empty tile or array length if none found
    function findNonEmptyTile(Map storage self) public view returns (bool, uint256) {
        uint256 len = self.values.length;
        uint256 i;
        for (; i < len; ++i) {
            if (!self.values[i].isEmpty()) {
                break;
            }
        }
        if (i == len) {
            return (false, len);
        }
        return (true, i);
    }

    /// @notice Convert x,y coordinates to array index
    /// @param x X coordinate
    /// @param y Y coordinate
    /// @return uint256 Array index for the coordinates
    function _getIdx(uint256 x, uint256 y) private pure returns (uint256) {
        return (x / 16) + (y / 16) * WIDTH;
    }
}
