// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {ERC721Utils} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol";

import {TileWithCoordLib} from "./TileWithCoordLib.sol";
import {SparseMap} from "./SparseMap.sol";

/// @title MapToken - A spatial ERC721 where tokens represent map coordinates (pixels)
/// @author aadjiman@gmail.com
/// @notice Users mint an initial isolated pixel, then may grow by adding adjacent pixels they connect to.
/// @notice Transfers are allowed only if the recipient already owns an adjacent pixel.
/// @dev Occupancy adjacency checks delegate to SparseMap; ownership adjacency is validated via ERC721 ownership.
contract MapToken is ERC721Royalty, Ownable {
    using SparseMap for SparseMap.Map;

    /// @notice Struct for storing x,y coordinates
    struct Coords {
        uint256 x;
        uint256 y;
    }

    /// @notice Error thrown when coordinates exceed the map limits
    /// @param x The x coordinate that was out of bounds
    /// @param y The y coordinate that was out of bounds
    error InvalidCoordinates(uint256 x, uint256 y);

    /// @notice Thrown when attempting to mint into an already occupied coordinate
    error PositionAlreadyOccupied(uint256 x, uint256 y);

    /// @notice Thrown when attempting to grow without owning any adjacent pixel
    error NoAdjacentOwnedToken(uint256 tokenId, uint256 x, uint256 y);

    /// @notice Thrown when attempting to merge two non-adjacent patches
    error NoAdjacentOwnedTokenToMerge(uint256 srcTokenId, uint256 dstTokenId);

    /// @notice Thrown when attempting to split a patch that caller doesn't fully own
    error NotRectangleOwner(uint256 tokenId, uint256 x, uint256 y, uint256 size);

    error NotSeededByOwner();
    error AlreadySeededByOwner();

    /// @notice Emitted when a new patch is minted
    /// @param tokenId The ID of the newly minted token
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @param owner Address of the token owner
    event PatchMinted(uint256 indexed tokenId, uint256 x, uint256 y, address indexed owner);

    /// @notice Emitted when a patch is grown with a new pixel
    /// @param tokenId The ID of the grown token
    /// @param x The x coordinate of new pixel
    /// @param y The y coordinate of new pixel
    /// @param owner Address of the token owner
    event PatchGrown(uint256 indexed tokenId, uint256 x, uint256 y, address indexed owner);

    /// @notice Emitted when two patches are merged
    /// @param srcTokenId The source token ID being merged
    /// @param dstTokenId The destination token ID receiving the merge
    /// @param owner Address of the token owner
    event PatchMerged(uint256 indexed srcTokenId, uint256 indexed dstTokenId, address indexed owner);

    /// @notice Emitted when a patch is split
    /// @param oldTokenId The ID of the token being split
    /// @param newTokenId The ID of the token being split
    /// @param x The x coordinate of split area
    /// @param y The y coordinate of split area
    /// @param size The size of split area
    /// @param owner Address of the token owner
    event PatchSplit(
        uint256 indexed oldTokenId,
        uint256 indexed newTokenId,
        uint256 x,
        uint256 y,
        uint256 size,
        address indexed owner
    );

    /// @dev Structure to track the minted pixels
    SparseMap.Map private usedMap;

    /// @notice The maximum map size coordinates (x,y)
    /// @dev Used to validate that coordinates are within bounds during minting
    Coords public limits;

    /// @dev Patches that cover the map per tokenId
    mapping(uint256 => SparseMap.Map) private patches;

    /// @notice Counter for generating token IDs
    /// @dev Starts at 0 and increments with each new token minted
    uint256 public nextTokenId;

    /// @notice Flag indicating if the contract has been seeded with initial tokens
    /// @dev Controls whether token transfers are allowed - must be true for transfers
    bool public isSeeded;

    /// @notice Initializes the MapToken contract
    /// @param initialOwner Address of the initial contract owner
    /// @param _limits The maximum map size coordinates (x,y)
    constructor(address initialOwner, Coords memory _limits) ERC721("MapToken", "MAP") Ownable(initialOwner) {
        // Set a default royalty of 5% to the contract owner; adjustable via setters below
        _setDefaultRoyalty(initialOwner, 500);
        limits = _limits;
    }

    /// @notice Mint an initial pixel at (x, y). It must not be adjacent to any existing pixel
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return newTokenId The ID of the newly minted token
    /// @dev Uses SparseMap adjacency to enforce isolation on initial mint
    function mint(uint256 x, uint256 y) external returns (uint256 newTokenId) {
        if (usedMap.isAdjacent(x, y, 1)) {
            revert PositionAlreadyOccupied(x, y);
        }
        address sender = _msgSender();
        newTokenId = _mintPixel(sender, x, y);
        ERC721Utils.checkOnERC721Received(sender, address(0), sender, newTokenId, "");
        return newTokenId;
    }

    /// @notice Grow a territory by minting a pixel at (x, y) that is adjacent to an owned pixel
    /// @param tokenId The ID of the token to grow
    /// @param x The x coordinate of new pixel
    /// @param y The y coordinate of new pixel
    /// @dev Requires the new pixel is unoccupied and adjacent to caller's owned pixel
    function grow(uint256 tokenId, uint256 x, uint256 y) external {
        if (x > limits.x || y > limits.y) {
            revert InvalidCoordinates(x, y);
        }
        address sender = _msgSender();
        if (_ownerOf(tokenId) != sender) {
            revert ERC721InvalidOwner(sender);
        }
        if (usedMap.contain(x, y)) {
            revert PositionAlreadyOccupied(x, y);
        }
        if (!patches[tokenId].isAdjacent(x, y, 1)) {
            revert NoAdjacentOwnedToken(tokenId, x, y);
        }
        patches[tokenId].set(x, y, 1);
        usedMap.set(x, y, 1);
        // TODO: Consider the gas cost of emitting the full patch?
        emit PatchGrown(tokenId, x, y, _msgSender());
    }

    /// @notice Merge two patches owned by the same address
    /// @param srcTokenId The source token ID to merge from
    /// @param dstTokenId The destination token ID to merge into
    /// @dev Patches must be adjacent and owned by the same address
    /// @dev there is a limit on the size that can be merged because of gas usage.
    function merge(uint256 srcTokenId, uint256 dstTokenId) external {
        address sender = _msgSender();
        if (_ownerOf(srcTokenId) != sender || _ownerOf(dstTokenId) != sender) {
            revert ERC721InvalidOwner(sender);
        }
        // TODO: Instead of set+check we can improve this by starting with one map instead of one pixel.
        patches[dstTokenId].setMap(patches[srcTokenId]);
        if (!patches[dstTokenId].isAdjacent()) {
            revert NoAdjacentOwnedTokenToMerge(srcTokenId, dstTokenId);
        }
        _burn(srcTokenId);
        patches[srcTokenId].clear();
        delete patches[srcTokenId];
        // TODO: Consider the gas cost of emitting the full patch?
        emit PatchMerged(srcTokenId, dstTokenId, _msgSender());
    }

    /// @notice Split a patch by creating a new token from a rectangular section
    /// @param tokenId The ID of token to split
    /// @param x The x coordinate of split area
    /// @param y The y coordinate of split area
    /// @param size The size of rectangular area to split
    /// @return The ID of the newly created token
    /// @dev Caller must own the entire rectangular area being split
    function split(uint256 tokenId, uint256 x, uint256 y, uint256 size) external returns (uint256) {
        address sender = _msgSender();
        if (_ownerOf(tokenId) != sender) {
            revert ERC721InvalidOwner(sender);
        }
        if (!patches[tokenId].contain(x, y, size)) {
            revert NotRectangleOwner(tokenId, x, y, size);
        }

        uint256 newTokenId = ++nextTokenId;
        _mint(sender, newTokenId);
        patches[tokenId].clear(x, y, size);
        patches[newTokenId].set(x, y, size);

        emit PatchSplit(tokenId, newTokenId, x, y, size, _msgSender());

        ERC721Utils.checkOnERC721Received(_msgSender(), address(0), sender, newTokenId, "");
        return newTokenId;
    }

    /// @notice Pre-mint initial tokens at specified coordinates so the contract is seeded
    /// @param coords Array of coordinates to pre-mint initial tokens at
    /// @dev Can only be called by contract owner
    /// @dev Will mint a new token at each coordinate pair and unpause the contract
    function mintSeeds(Coords[] calldata coords) external onlyOwner {
        if (isSeeded) {
            revert AlreadySeededByOwner();
        }
        isSeeded = true;

        uint256 len = coords.length;
        address sender = _msgSender();
        for (uint256 i; i < len; ++i) {
            _mintPixel(sender, coords[i].x, coords[i].y);
        }

        isSeeded = false;
    }

    /// @notice Set the seeded state for the contract
    /// @dev Can only be called by contract owner to enable/disable token transfers
    /// @param state True to allow transfers, false to disable transfers
    function setSeeded(bool state) external onlyOwner {
        isSeeded = state;
    }

    /// @notice Set the default royalty for all tokens
    /// @param receiver Address receiving royalties
    /// @param feeNumerator Royalty in basis points (out of 10000)
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /// @notice Delete the default royalty
    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    /// @notice Set royalty for a specific tokenId
    /// @param tokenId The token id
    /// @param receiver Address receiving royalties
    /// @param feeNumerator Royalty in basis points (out of 10000)
    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /// @notice Reset a token's royalty to use the default royalty
    /// @param tokenId The token id
    function resetTokenRoyalty(uint256 tokenId) external onlyOwner {
        _resetTokenRoyalty(tokenId);
    }

    /// @notice Check if a coordinate is already used in the map
    /// @param x The x coordinate to check
    /// @param y The y coordinate to check
    /// @return bool True if the coordinate is occupied, false otherwise
    function isUsed(uint256 x, uint256 y) external view returns (bool) {
        return usedMap.contain(x, y);
    }

    /// @notice Check if a patch contains a specific coordinate
    /// @param tokenId The ID of the token to check
    /// @param x The x coordinate to check
    /// @param y The y coordinate to check
    /// @return bool True if the patch contains the coordinate, false otherwise
    function contain(uint256 tokenId, uint256 x, uint256 y) external view returns (bool) {
        return patches[tokenId].contain(x, y);
    }

    /// @notice Get the number of tiles in the used map
    /// @return The count of tiles in the used map
    function getUsedMapTileLength() external view returns (uint256) {
        return usedMap.length();
    }

    /// @notice Get tile details at a specific index in the used map
    /// @param index The index to look up
    /// @return TileWithCoord struct containing tile information at that index
    function getUsedMapTile(uint256 index) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return usedMap.at(index);
    }
    /// @notice Get the number of tiles in a specific patch
    /// @param tokenId The ID of the token to query
    /// @return The count of tiles in the patch
    function getPatchTileLength(uint256 tokenId) external view returns (uint256) {
        return patches[tokenId].length();
    }

    /// @notice Get tile details at a specific index in a patch
    /// @param tokenId The ID of the token to query
    /// @param index The index to look up
    /// @return TileWithCoord struct containing tile information at that index
    function getPatchTile(
        uint256 tokenId,
        uint256 index
    ) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return patches[tokenId].at(index);
    }

    /// @notice Internal function to override ERC721 transfer behavior; enforces isSeeded requirement
    /// @param to The address to transfer to
    /// @param tokenId The token ID
    /// @param auth The authorized address for the transfer
    /// @return The address previously owning the token
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        if (!isSeeded) {
            revert NotSeededByOwner();
        }
        return super._update(to, tokenId, auth);
    }
    /// @notice Internal function to mint an initial pixel
    /// @param sender the transaction sender
    /// @param x The x coordinate
    /// @param y The y coordinate
    /// @return The ID of the newly minted token
    /// @dev Uses SparseMap adjacency to enforce isolation on initial mint
    function _mintPixel(address sender, uint256 x, uint256 y) internal returns (uint256) {
        if (x > limits.x || y > limits.y) {
            revert InvalidCoordinates(x, y);
        }
        uint256 newTokenId = ++nextTokenId;
        _mint(sender, newTokenId);
        patches[newTokenId].set(x, y, 1);
        usedMap.set(x, y, 1);
        emit PatchMinted(newTokenId, x, y, sender);
        return newTokenId;
    }

    /// @notice Returns the base URI for all token metadata
    /// @return The base URI string
    /// @dev Override for custom base URI, used by tokenURI() in ERC721
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://todo/something/";
    }
}
