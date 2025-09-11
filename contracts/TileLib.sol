// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TileLib
/// @author aadjiman@gmail.com
/// @notice a library to manage tiles, a two dimensional 16x16 boolean bitmap
/// @dev TODO: Consider removing requires to save some gas
library TileLib {
    /// @notice Represents an extended tile with left, right, up, down and middle sections
    struct ExtendedTile {
        Tile left;
        uint256 up; // just one line
        Tile middle;
        uint256 down; // just one line
        Tile right;
    }

    /// @notice Represents a single tile as a 256-bit bitmap
    struct Tile {
        uint256 data;
    }

    /// @notice Invalid size error
    /// @param size The invalid size value
    error InvalidSize(uint256 size);

    /// @notice Error for invalid coordinates in a tile operation
    /// @param x The x coordinate that caused the error
    /// @param y The y coordinate that caused the error
    error InvalidCoordinates(uint256 x, uint256 y);

    /// @notice initialize a tile
    /// @return return an empty tile
    function initTile() internal pure returns (Tile memory) {
        Tile memory ret;
        return ret;
    }

    /// @notice get a clone of the tile to be able to modify it
    /// @param self The tile to clone
    /// @return A new tile with the same data
    function clone(Tile memory self) internal pure returns (Tile memory) {
        return Tile(self.data);
    }

    /// @notice Sets bits in a tile for a given rectangle
    /// @param self The tile to modify
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size of the square to set
    /// @return The modified tile
    function set(Tile memory self, uint256 x, uint256 y, uint256 size) internal pure returns (Tile memory) {
        if (size == 0 || size > 16) {
            revert InvalidSize(size);
        }
        if (x + size > 16 || y + size > 16) {
            revert InvalidCoordinates(x, y);
        }
        self.data |= _getRectangleMask(x, y, size);
        return self;
    }

    /// @notice Clears bits in a tile for a given rectangle
    /// @param self The tile to modify
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size of the square to clear
    /// @return The modified tile
    function clear(Tile memory self, uint256 x, uint256 y, uint256 size) internal pure returns (Tile memory) {
        if (size == 0 || size > 16) {
            revert InvalidSize(size);
        }
        if (x + size > 16 || y + size > 16) {
            revert InvalidCoordinates(x, y);
        }
        self.data &= ~_getRectangleMask(x, y, size);
        return self;
    }

    /// @notice Checks if a specific point in the tile is set
    /// @param self The tile to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return True if point is set, false otherwise
    function contain(Tile memory self, uint256 x, uint256 y) internal pure returns (bool) {
        if (x < 16 && y < 16) {
            uint256 bitMask = 1 << (x + 16 * y);
            return (self.data & bitMask == bitMask);
        }
        return false;
    }

    /// @notice Checks if a rectangle of given size is set in the tile
    /// @param self The tile to check
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param size The size to check
    /// @return True if rectangle is set, false otherwise
    function contain(Tile memory self, uint256 x, uint256 y, uint256 size) internal pure returns (bool) {
        if (size == 0 || size > 16 || x + size > 16 || y + size > 16) {
            return false;
        }
        uint256 bitMask = _getRectangleMask(x, y, size);
        return (self.data & bitMask == bitMask);
    }

    /// @notice Checks if one tile is fully contained within another
    /// @param self The container tile
    /// @param contained The tile that should be contained
    /// @return True if contained tile is within self
    function contain(Tile memory self, Tile memory contained) internal pure returns (bool) {
        return (self.data & contained.data == contained.data);
    }

    /// @notice Checks if tile is empty (all bits 0)
    /// @param self The tile to check
    /// @return True if empty, false otherwise
    function isEmpty(Tile memory self) internal pure returns (bool) {
        return self.data == 0;
    }

    /// @notice Checks if two tiles are equal
    /// @param self The first tile
    /// @param b The second tile
    /// @return True if equal, false otherwise
    function isEqual(Tile memory self, Tile memory b) internal pure returns (bool) {
        return self.data == b.data;
    }

    /// @notice Performs bitwise OR between two tiles
    /// @param self The first tile
    /// @param b The second tile
    /// @return The result tile
    function or(Tile memory self, Tile memory b) internal pure returns (Tile memory) {
        self.data |= b.data;
        return self;
    }

    /// @notice Performs bitwise NOT operation on a tile
    /// @param self The tile to invert
    /// @return The inverted tile
    function not(Tile memory self) internal pure returns (Tile memory) {
        self.data = ~self.data;
        return self;
    }
    /// @notice Performs bitwise AND between two tiles
    /// @param self The first tile
    /// @param b The second tile
    /// @return The result tile
    function and(Tile memory self, Tile memory b) internal pure returns (Tile memory) {
        self.data &= b.data;
        return self;
    }

    /// @notice Subtracts one tile from another
    /// @param self The tile to subtract from
    /// @param value The tile to subtract
    /// @return The result tile
    function subtract(Tile memory self, Tile memory value) internal pure returns (Tile memory) {
        self.data &= ~value.data;
        return self;
    }

    /// @dev Bit masks for tile edges
    uint256 private constant LEFT_MASK = 0x0001000100010001000100010001000100010001000100010001000100010001;
    uint256 private constant LEFT_MASK_NEG = ~LEFT_MASK;
    uint256 private constant RIGHT_MASK = 0x8000800080008000800080008000800080008000800080008000800080008000;
    uint256 private constant RIGHT_MASK_NEG = ~RIGHT_MASK;
    uint256 private constant UP_MASK = 0x000000000000000000000000000000000000000000000000000000000000FFFF;
    uint256 private constant DOWN_MASK = 0xFFFF000000000000000000000000000000000000000000000000000000000000;

    /// @notice Grows a tile by one pixel in all directions
    /// @param self The tile to grow
    /// @return e The extended tile result
    function grow(Tile memory self) internal pure returns (ExtendedTile memory e) {
        e.middle.data = grow(self.data);
        e.up = (self.data & UP_MASK) << (16 * 15);
        e.down = (self.data & DOWN_MASK) >> (16 * 15);
        e.left.data = (self.data & LEFT_MASK) << 15;
        e.right.data = (self.data & RIGHT_MASK) >> 15;
        return e;
    }

    /// @notice Helper function to grow a raw bitmap value
    /// @param x The value to grow
    /// @return The grown value
    function grow(uint256 x) private pure returns (uint256) {
        return (x | ((x & RIGHT_MASK_NEG) << 1) | ((x & LEFT_MASK_NEG) >> 1) | (x << 16) | (x >> 16));
    }

    /// @notice Checks if tile is adjacent to a raw bitmap value
    /// @param self The tile to check
    /// @param val The value to check against
    /// @return True if adjacent, false otherwise
    function isAdjacent(Tile memory self, uint256 val) internal pure returns (bool) {
        return (self.data & val) != 0;
    }

    /// @notice Checks if two tiles are adjacent
    /// @param self The first tile
    /// @param val The second tile
    /// @return True if adjacent, false otherwise
    function isAdjacent(Tile memory self, Tile memory val) internal pure returns (bool) {
        return (self.data & val.data) != 0;
    }

    /// @notice Finds a single set pixel in the tile
    /// @dev If the user wants to prove adjacency we can take a pixel as argument instead of searching
    /// @param self The tile to search
    /// @return ret A new tile with single found pixel set
    function findAPixel(Tile memory self) internal pure returns (Tile memory ret) {
        uint256 shift;

        if (self.data != 0) {
            shift = findAPixel(self.data);
            ret.data = ret.data | (1 << shift);
        }
        return ret;
    }

    /// @notice Helper function to find first set bit in raw value
    /// @param target The value to search
    /// @return shift The bit position found
    function findAPixel(uint256 target) private pure returns (uint256 shift) {
        uint256 mask = (2 ** 256 - 1);
        for (uint256 i = 128; i > 0; i = i / 2) {
            mask = mask >> i;
            if ((target & mask) == 0) {
                target = target >> i;
                shift += i;
            }
        }
        return shift;
    }
    /// @notice Helper function to create a bitmap mask for a rectangle
    /// @param x The x coordinate where the rectangle starts
    /// @param y The y coordinate where the rectangle starts
    /// @param size The size of the rectangle (both width and height)
    /// @return mask The bitmap mask for the specified rectangle
    function _getRectangleMask(uint256 x, uint256 y, uint256 size) private pure returns (uint256 mask) {
        uint256 lineMask = ((2 ** size) - 1) << x;
        for (uint256 i; i < size; ++i) {
            mask |= lineMask << (16 * (y + i));
        }
        return mask;
    }
}
