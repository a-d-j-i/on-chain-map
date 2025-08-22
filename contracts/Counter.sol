// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Basic hardhat example
/// @author Official https://hardhat.org/
/// @notice hardhat example
contract Counter {
    /// @notice the counter
    uint256 public x;

    error ShouldBePositive(uint256 by);

    /// @notice emitted when the counter is incremented
    /// @param by amount incremented
    event Increment(uint256 indexed by);

    /// @notice increments the counter
    function inc() public {
        ++x;
        emit Increment(1);
    }

    /// @notice increments the counter by some amount
    /// @param by amount to increment
    function incBy(uint256 by) public {
        if (by == 0) {
            revert ShouldBePositive(by);
        }
        x += by;
        emit Increment(by);
    }
}
