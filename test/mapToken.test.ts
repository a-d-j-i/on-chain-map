import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';
import {Contract, Log, Signer, TransactionReceipt} from 'ethers';

describe('MapToken', async function () {
  const {
    ethers: {getContractFactory, getSigners},
    networkHelpers: {loadFixture},
  } = await network.connect();

  async function deployMapToken() {
    const libFactory = await getContractFactory('SparseMap');
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();

    const factory = await getContractFactory('MapToken', {
      libraries: {
        SparseMap: await lib.getAddress(),
      },
    });

    const [deployer, admin, user1, user2] = await getSigners();
    const limits = {x: 256, y: 256};
    const token = await factory.deploy(admin, limits);
    await token.waitForDeployment();
    return {token, deployer, admin, user1, user2, limits};
  }
  async function deployMapTokenAndSeed() {
    const d = await deployMapToken();
    for (let i = 0; i < 4; i++) {
      const coords = [];
      const lines = [];
      for (let y = 64 * i + 8; y < 64 * i + 64; y += 16) {
        lines.push(y);
        for (let x = 8; x < 256; x += 16) {
          coords.push({x, y});
        }
      }
      const tx = await d.token.connect(d.admin).mintSeeds(coords);
      await tx.wait();
    }
    await d.token.connect(d.admin).setSeeded(true);
    expect(await d.token.isSeeded()).to.be.true;
    return d;
  }
  async function getNewTokenIdFromReceipt(
    token: Contract,
    receipt: TransactionReceipt,
    evName: string,
    argName: string,
  ) {
    const mintedEvent = receipt.logs.map((l: Log) => token.interface.parseLog(l)).find(ev => ev && ev.name === evName);
    expect(mintedEvent, evName + ' event missing').to.exist;
    return mintedEvent!.args[argName] as bigint;
  }
  async function mintIsolated(token: Contract, signer: Signer, x: number, y: number) {
    const tx = await token.connect(signer).mint(x, y);
    const receipt = await tx.wait();
    return getNewTokenIdFromReceipt(token, receipt, 'PatchMinted', 'tokenId');
  }
  async function containCheck(
    token: Contract,
    tokenToCheckPresence: bigint,
    tokenToCheckAbsence: bigint,
    coords: {x: number; y: number}[],
  ) {
    for (const coord of coords) {
      expect(await token.contain(tokenToCheckPresence, coord.x, coord.y)).to.be.true;
      expect(await token.contain(tokenToCheckAbsence, coord.x, coord.y)).to.be.false;
    }
  }

  it('initial mint succeeds for isolated pixel', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const tokenId = await mintIsolated(token, user1, 10, 10);
    expect(await token.ownerOf(tokenId)).to.be.equal(user1);

    // patch tiles for tokenId
    expect(await token.getPatchTileLength(tokenId)).to.equal(1n);
  });

  it('initial mint prevents adjacent occupancy', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);
    expect(await token.isUsed(8, 8)).to.be.true;

    await expect(token.connect(user1).mint(8, 9)).to.be.revertedWithCustomError(token, 'PositionAlreadyOccupied');
    await expect(token.connect(user1).mint(8, 7)).to.be.revertedWithCustomError(token, 'PositionAlreadyOccupied');
    await expect(token.connect(user1).mint(9, 8)).to.be.revertedWithCustomError(token, 'PositionAlreadyOccupied');
    await expect(token.connect(user1).mint(7, 8)).to.be.revertedWithCustomError(token, 'PositionAlreadyOccupied');
  });

  it('grow succeeds for adjacent unoccupied coordinate', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);
    expect(await token.isUsed(8, 8)).to.be.true;

    await expect(token.connect(user1).mint(9, 9))
      .to.emit(token, 'PatchMinted')
      .withArgs(() => true, 9, 9, user1);
    await expect(token.connect(user1).mint(7, 7))
      .to.emit(token, 'PatchMinted')
      .withArgs(() => true, 7, 7, user1);
    await expect(token.connect(user1).mint(7, 9))
      .to.emit(token, 'PatchMinted')
      .withArgs(() => true, 7, 9, user1);
    await expect(token.connect(user1).mint(9, 7))
      .to.emit(token, 'PatchMinted')
      .withArgs(() => true, 9, 7, user1);
  });

  it('grow reverts for invalid coordinates', async function () {
    const {token, user1, limits} = await loadFixture(deployMapTokenAndSeed);

    const tokenId = await mintIsolated(token, user1, limits.x, limits.y);
    await expect(token.connect(user1).grow(tokenId, limits.x + 1, limits.y)).to.be.revertedWithCustomError(
      token,
      'InvalidCoordinates',
    );
    await expect(token.connect(user1).grow(tokenId, limits.x, limits.y + 1)).to.be.revertedWithCustomError(
      token,
      'InvalidCoordinates',
    );
  });

  it('grow reverts if caller is not token owner', async function () {
    const {token, user1, user2} = await loadFixture(deployMapTokenAndSeed);

    const tokenId = await mintIsolated(token, user1, 15, 15);
    await expect(token.connect(user2).grow(tokenId, 16, 15)).to.be.revertedWithCustomError(token, 'ERC721InvalidOwner');
  });

  it('grow reverts if not adjacent to existing patch', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const tokenId = await mintIsolated(token, user1, 20, 20);
    // Non-adjacent (two steps away)
    await expect(token.connect(user1).grow(tokenId, 22, 20)).to.be.revertedWithCustomError(
      token,
      'NoAdjacentOwnedToken',
    );
  });

  it('merge succeeds when patches become adjacent, burns src and keeps dst with combined area', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const a = await mintIsolated(token, user1, 30, 30);
    await token.connect(user1).grow(a, 31, 30); // expand a to touch b later

    const b = await mintIsolated(token, user1, 33, 30);
    await token.connect(user1).grow(b, 32, 30); // now a and b are adjacent overall via 31,30 and 32,30

    await expect(token.connect(user1).merge(b, a)).to.emit(token, 'PatchMerged').withArgs(b, a, user1);

    // b is burned
    await expect(token.ownerOf(b)).to.be.revertedWithCustomError(token, 'ERC721NonexistentToken');
    await containCheck(token, a, b, [
      {x: 30, y: 30},
      {x: 31, y: 30},
      {x: 33, y: 30},
      {x: 32, y: 30},
    ]);
  });

  it('merge reverts when not adjacent after combining maps', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const a = await mintIsolated(token, user1, 42, 42);
    const b = await mintIsolated(token, user1, 50, 50);
    await expect(token.connect(user1).merge(b, a)).to.be.revertedWithCustomError(token, 'NoAdjacentOwnedTokenToMerge');
  });

  it('split succeeds when caller owns rectangular area and returns new token id', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const t = await mintIsolated(token, user1, 60, 60);
    // Make a 2x2 area: (60,60), (61,60), (60,61), (61,61)
    await token.connect(user1).grow(t, 61, 60);
    await token.connect(user1).grow(t, 60, 61);
    await token.connect(user1).grow(t, 61, 61);

    const tx = await token.connect(user1).split(t, 61, 61, 1);
    const rc = await tx.wait();
    const newTokenId = await getNewTokenIdFromReceipt(token, rc, 'PatchSplit', 'newTokenId');
    expect(await token.ownerOf(newTokenId)).to.equal(user1);
    await containCheck(token, t, newTokenId, [
      {x: 60, y: 60},
      {x: 61, y: 60},
      {x: 60, y: 61},
    ]);
    await containCheck(token, newTokenId, t, [{x: 61, y: 61}]);
  });

  it('split reverts when not owning the full rectangle', async function () {
    const {token, user1} = await loadFixture(deployMapTokenAndSeed);

    const t = await mintIsolated(token, user1, 70, 70);
    // Only one tile owned; attempt to split 2x2 should fail
    await expect(token.connect(user1).split(t, 70, 70, 2)).to.be.revertedWithCustomError(token, 'NotRectangleOwner');
  });

  it('transfer is blocked while not seeded, allowed when owner sets seeded=true', async function () {
    const {token, admin, user1, user2} = await loadFixture(deployMapTokenAndSeed);
    const t = await mintIsolated(token, user1, 80, 80);

    await token.connect(admin).setSeeded(false);

    // Not seeded -> revert
    await expect(token.connect(user1).transferFrom(user1, user2, t)).to.be.revertedWithCustomError(
      token,
      'NotSeededByOwner',
    );

    // Owner enables transfers
    await token.connect(admin).setSeeded(true);
    await token.connect(user1).transferFrom(user1, user2, t);
    expect(await token.ownerOf(t)).to.equal(user2);

    // Can disable again
    await token.connect(admin).setSeeded(false);
    await expect(token.connect(user2).transferFrom(user2, user1, t)).to.be.revertedWithCustomError(
      token,
      'NotSeededByOwner',
    );
  });

  it('mintSeeds can pre-mint only by owner and toggles seeding guard during execution', async function () {
    const {token, admin, user1} = await loadFixture(deployMapToken);

    const coords = [
      {x: 8, y: 8},
      {x: 24, y: 24},
      {x: 40, y: 40},
    ];

    await expect(token.connect(user1).mintSeeds(coords)).to.be.revertedWithCustomError(
      token,
      'OwnableUnauthorizedAccount',
    );

    // Owner can mint
    await token.connect(admin).mintSeeds(coords);

    // After seeds, contract resets isSeeded to false
    expect(await token.isSeeded()).to.equal(false);

    // Minting seeds again without toggling should still work because isSeeded==false,
    // but calling twice in a row would revert if isSeeded were left true. Also verify revert when true:
    await token.connect(admin).setSeeded(true);
    await expect(token.connect(admin).mintSeeds(coords)).to.be.revertedWithCustomError(token, 'AlreadySeededByOwner');
    // Reset
    await token.connect(admin).setSeeded(false);
  });

  it('royalty defaults to 5% and can be configured per default and per token', async function () {
    const {token, admin, user1} = await loadFixture(deployMapTokenAndSeed);

    const t = await mintIsolated(token, user1, 90, 90);

    // Default is 5% to initial owner (admin)
    const salePrice = 1_000_000n;
    let [recv, amt] = await token.royaltyInfo(t, salePrice);
    expect(recv).to.equal(admin);
    expect(amt).to.equal((salePrice * 500n) / 10_000n);

    // Change default royalty
    await token.connect(admin).setDefaultRoyalty(user1, 1000); // 10%
    [recv, amt] = await token.royaltyInfo(t, salePrice);
    expect(recv).to.equal(user1);
    expect(amt).to.equal((salePrice * 1000n) / 10_000n);

    // Set per-token royalty
    await token.connect(admin).setTokenRoyalty(t, admin, 250); // 2.5%
    [recv, amt] = await token.royaltyInfo(t, salePrice);
    expect(recv).to.equal(admin);
    expect(amt).to.equal((salePrice * 250n) / 10_000n);

    // Reset per-token to use default
    await token.connect(admin).resetTokenRoyalty(t);
    [recv, amt] = await token.royaltyInfo(t, salePrice);
    expect(recv).to.equal(user1);
    expect(amt).to.equal((salePrice * 1000n) / 10_000n);
  });
});
