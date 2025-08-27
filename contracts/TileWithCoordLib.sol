// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TileLib} from "./TileLib.sol";

/// @title TileWithCoordLib
/// @notice A square of 16x16 bits with coordinates
/// @dev Library for managing tiles with coordinates in a 16x16 grid
library TileWithCoordLib {
    using TileLib for TileLib.Tile;

    /// @notice Structure representing a tile with coordinates
    /// @param coord Combined x,y coordinate (x in lower 128 bits, y in upper 128 bits)
    /// @param tile The tile data structure
    struct TileWithCoord {
        uint256 coord;
        TileLib.Tile tile;
    }

    /// @notice Error for invalid coordinates in a tile operation
    /// @param x0 The x coordinate of the first tile
    /// @param y0 The y coordinate of the first tile
    /// @param x1 The x coordinate of the second tile
    /// @param y1 The y coordinate of the second tile
    error InvalidCoordinates(uint256 x0, uint256 y0, uint256 x1, uint256 y1);

    /// @notice Initialize a new tile with coordinates
    /// @param x The x coordinate (must be multiple of 16)
    /// @param y The y coordinate (must be multiple of 16)
    /// @return A new TileWithCoord initialized at the given coordinates
    /// @dev TileWithCoord x and y always start in multiples of 16
    function initTileWithCoord(uint256 x, uint256 y) internal pure returns (TileWithCoord memory) {
        TileWithCoord memory ret;
        ret.coord = getKey(x, y);
        return ret;
    }

    /// @notice Set bits in the tile at specified coordinates
    /// @param self The tile to modify
    /// @param xi The x coordinate to set
    /// @param yi The y coordinate to set
    /// @param size The size of the area to set
    /// @return The modified tile
    function set(
        TileWithCoord memory self,
        uint256 xi,
        uint256 yi,
        uint256 size
    ) internal pure returns (TileWithCoord memory) {
        if (getXInt(self) != xi / 16 || getYInt(self) != yi / 16) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), xi / 16, yi / 16);
        }
        self.tile = self.tile.set(xi % 16, yi % 16, size);
        return self;
    }

    /// @notice Clear bits in the tile at specified coordinates
    /// @param self The tile to modify
    /// @param xi The x coordinate to clear
    /// @param yi The y coordinate to clear
    /// @param size The size of the area to clear
    /// @return The modified tile
    function clear(
        TileWithCoord memory self,
        uint256 xi,
        uint256 yi,
        uint256 size
    ) internal pure returns (TileWithCoord memory) {
        if (getXInt(self) != xi / 16 || getYInt(self) != yi / 16) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), xi, yi);
        }
        self.tile = self.tile.clear(xi % 16, yi % 16, size);
        return self;
    }

    /// @notice Merge two tiles using OR operation
    /// @param self The base tile
    /// @param value The tile to merge into base
    /// @return The merged tile
    function merge(TileWithCoord memory self, TileWithCoord memory value) internal pure returns (TileWithCoord memory) {
        if (getXInt(self) != getXInt(value) || getYInt(self) != getYInt(value)) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), getXInt(value), getYInt(value));
        }
        self.tile = self.tile.or(value.tile);
        return self;
    }

    /// @notice Subtract one tile from another
    /// @param self The base tile
    /// @param value The tile to subtract
    /// @return The resulting tile
    function subtract(
        TileWithCoord memory self,
        TileWithCoord memory value
    ) internal pure returns (TileWithCoord memory) {
        if (getXInt(self) != getXInt(value) || getYInt(self) != getYInt(value)) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), getXInt(value), getYInt(value));
        }
        self.tile = self.tile.subtract(value.tile);
        return self;
    }

    /// @notice Check if tile contains a point
    /// @param self The tile to check
    /// @param xi X coordinate of the point
    /// @param yi Y coordinate of the point
    /// @return True if the point is set in the tile
    function contain(TileWithCoord memory self, uint256 xi, uint256 yi) internal pure returns (bool) {
        if (getXInt(self) != xi / 16 || getYInt(self) != yi / 16) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), xi, yi);
        }
        return self.tile.contain(xi % 16, yi % 16);
    }

    /// @notice Check if tile contains an area
    /// @param self The tile to check
    /// @param xi X coordinate of the area
    /// @param yi Y coordinate of the area
    /// @param size Size of the area
    /// @return True if the entire area is set in the tile
    function contain(TileWithCoord memory self, uint256 xi, uint256 yi, uint256 size) internal pure returns (bool) {
        if (getXInt(self) != xi / 16 || getYInt(self) != yi / 16) {
            revert InvalidCoordinates(getXInt(self), getYInt(self), xi, yi);
        }
        return self.tile.contain(xi % 16, yi % 16, size);
    }

    /// @notice Check if one tile contains another
    /// @param self The container tile
    /// @param contained The tile to check if contained
    /// @return True if contained tile is fully contained within self
    function contain(TileWithCoord memory self, TileWithCoord memory contained) internal pure returns (bool) {
        return getX(self) == getX(contained) && getY(self) == getY(contained) && self.tile.contain(contained.tile);
    }

    /// @notice Get the coordinate key of a tile
    /// @param self The tile
    /// @return The coordinate key
    function getKey(TileWithCoord memory self) internal pure returns (uint256) {
        return self.coord;
    }

    /// @notice Get the x coordinate of a tile
    /// @param self The tile
    /// @return The x coordinate (multiple of 16)
    function getX(TileWithCoord memory self) internal pure returns (uint256) {
        return getXInt(self) * 16;
    }

    /// @notice Get the y coordinate of a tile
    /// @param self The tile
    /// @return The y coordinate (multiple of 16)
    function getY(TileWithCoord memory self) internal pure returns (uint256) {
        return getYInt(self) * 16;
    }

    /// @notice Get the x coordinate integer
    /// @param self The tile
    /// @return The x coordinate divided by 16
    function getXInt(TileWithCoord memory self) private pure returns (uint256) {
        return self.coord & (2 ** 128 - 1);
    }

    /// @notice Get the y coordinate integer
    /// @param self The tile
    /// @return The y coordinate divided by 16
    function getYInt(TileWithCoord memory self) private pure returns (uint256) {
        return self.coord >> 128;
    }

    /// @notice Get coordinate key from x,y coordinates
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return The coordinate key
    function getKey(uint256 x, uint256 y) internal pure returns (uint256) {
        return (x / 16) + ((y / 16) << 128);
    }

    /// @notice Check if a tile is empty
    /// @param self The tile to check
    /// @return True if the tile has no bits set
    function isEmpty(TileWithCoord memory self) internal pure returns (bool) {
        return self.tile.isEmpty();
    }

    /// @notice Check if two tiles are equal
    /// @param self First tile
    /// @param other Second tile
    /// @return True if the tiles have identical data
    function isEqual(TileWithCoord memory self, TileWithCoord memory other) internal pure returns (bool) {
        return self.tile.data == other.tile.data;
    }
}
