import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Approval,
  ApprovalForAll,
  OwnershipTransferred,
  PatchGrown,
  PatchMerged,
  PatchMinted,
  PatchSplit,
  Transfer
} from "../generated/MapToken/MapToken"

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPatchGrownEvent(
  tokenId: BigInt,
  x: BigInt,
  y: BigInt,
  owner: Address
): PatchGrown {
  let patchGrownEvent = changetype<PatchGrown>(newMockEvent())

  patchGrownEvent.parameters = new Array()

  patchGrownEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  patchGrownEvent.parameters.push(
    new ethereum.EventParam("x", ethereum.Value.fromUnsignedBigInt(x))
  )
  patchGrownEvent.parameters.push(
    new ethereum.EventParam("y", ethereum.Value.fromUnsignedBigInt(y))
  )
  patchGrownEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return patchGrownEvent
}

export function createPatchMergedEvent(
  srcTokenId: BigInt,
  dstTokenId: BigInt,
  owner: Address
): PatchMerged {
  let patchMergedEvent = changetype<PatchMerged>(newMockEvent())

  patchMergedEvent.parameters = new Array()

  patchMergedEvent.parameters.push(
    new ethereum.EventParam(
      "srcTokenId",
      ethereum.Value.fromUnsignedBigInt(srcTokenId)
    )
  )
  patchMergedEvent.parameters.push(
    new ethereum.EventParam(
      "dstTokenId",
      ethereum.Value.fromUnsignedBigInt(dstTokenId)
    )
  )
  patchMergedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return patchMergedEvent
}

export function createPatchMintedEvent(
  tokenId: BigInt,
  x: BigInt,
  y: BigInt,
  owner: Address
): PatchMinted {
  let patchMintedEvent = changetype<PatchMinted>(newMockEvent())

  patchMintedEvent.parameters = new Array()

  patchMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  patchMintedEvent.parameters.push(
    new ethereum.EventParam("x", ethereum.Value.fromUnsignedBigInt(x))
  )
  patchMintedEvent.parameters.push(
    new ethereum.EventParam("y", ethereum.Value.fromUnsignedBigInt(y))
  )
  patchMintedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return patchMintedEvent
}

export function createPatchSplitEvent(
  oldTokenId: BigInt,
  newTokenId: BigInt,
  x: BigInt,
  y: BigInt,
  size: BigInt,
  owner: Address
): PatchSplit {
  let patchSplitEvent = changetype<PatchSplit>(newMockEvent())

  patchSplitEvent.parameters = new Array()

  patchSplitEvent.parameters.push(
    new ethereum.EventParam(
      "oldTokenId",
      ethereum.Value.fromUnsignedBigInt(oldTokenId)
    )
  )
  patchSplitEvent.parameters.push(
    new ethereum.EventParam(
      "newTokenId",
      ethereum.Value.fromUnsignedBigInt(newTokenId)
    )
  )
  patchSplitEvent.parameters.push(
    new ethereum.EventParam("x", ethereum.Value.fromUnsignedBigInt(x))
  )
  patchSplitEvent.parameters.push(
    new ethereum.EventParam("y", ethereum.Value.fromUnsignedBigInt(y))
  )
  patchSplitEvent.parameters.push(
    new ethereum.EventParam("size", ethereum.Value.fromUnsignedBigInt(size))
  )
  patchSplitEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return patchSplitEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}
