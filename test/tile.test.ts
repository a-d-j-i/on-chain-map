import {getEmptyTile, printTile, tileToArray} from './helpers';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';

describe('TileLib main', async function () {
  const {
    ethers: {getContractFactory},
    networkHelpers: {loadFixture},
  } = await network.connect();

  async function setupTileLibTest() {
    const factory = await getContractFactory('TileLibMock');
    return await factory.deploy();
  }

  it.skip('Some Tile', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 0, 0, 1);
    await tester.set(0, 1, 1, 2);
    await tester.set(0, 3, 3, 3);
    await tester.set(0, 6, 6, 6);
    await tester.set(0, 12, 12, 4);
    await tester.clear(0, 7, 7, 2);
    const tile = await tester.getTile(0);
    const jsTile = tileToArray(tile.data);
    printTile(jsTile);
  });

  it('union', async function () {
    const tester = await loadFixture(setupTileLibTest);
    const tests = [
      [3, 0, 3],
      [12, 2, 2],
      [1, 1, 1],
      [15, 15, 1],
    ];
    // 0
    for (const t of tests) {
      await tester.set(0, t[0], t[1], t[2]);
    }
    const tile = await tester.getTile(0);
    // a lot of tiles to merge
    const idxs = [];
    for (let idx = 0; idx < tests.length; idx++) {
      const t = tests[idx];
      await tester.set(idx + 1, t[0], t[1], t[2]);
      idxs.push(idx + 1);
    }
    const outIdx = 29;
    await tester.union(idxs, outIdx);
    const union = await tester.getTile(outIdx);
    expect(union).to.be.eql(tile);
    expect(await tester.isEqual(outIdx, 0)).to.be.true;
  });

  it('intersection', async function () {
    const tester = await loadFixture(setupTileLibTest);
    //const tests = [[12, 12, 1], [12, 12, 3], [12, 12, 6], [12, 12, 12], [0, 0, 24]]
    const tests = [
      [12, 12, 1],
      [12, 12, 3],
    ];

    const idxs = [];
    for (let idx = 0; idx < tests.length; idx++) {
      const t = tests[idx];
      await tester.set(idx, t[0], t[1], t[2]);
      idxs.push(idx);
    }
    const outIdx = 29;
    await tester.intersection(idxs, outIdx);
    const intersection = tileToArray((await tester.getTile(outIdx)).data);
    const tile = getEmptyTile();
    tile[12][12] = true;
    expect(intersection).to.be.eql(tile);
  });

  it('contains', async function () {
    const tester = await loadFixture(setupTileLibTest);
    const tests = [
      [3, 0, 3],
      [12, 2, 2],
      [1, 1, 1],
      [15, 15, 1],
    ];
    // 0
    for (const t of tests) {
      await tester.set(0, t[0], t[1], t[2]);
      expect(await tester.contain(0, t[0], t[1], t[2])).to.be.true;
    }
    for (const t of tests) {
      expect(await tester.contain(0, t[0], t[1], t[2])).to.be.true;
    }
    expect(await tester.contain(0, 2, 2, 1)).to.be.false;
    expect(await tester.contain(0, 14, 14, 1)).to.be.false;
    expect(await tester.contain(0, 13, 13, 3)).to.be.false;
    // 1
    for (const t of tests) {
      await tester.clear(1, 0, 0, 16);
      await tester.set(1, t[0], t[1], t[2]);
      expect(await tester.contain(1, t[0], t[1], t[2])).to.be.true;
      expect(await tester.contain(1, 2, 2, 1)).to.be.false;
      expect(await tester.contain(1, 13, 13, 1)).to.be.false;
      expect(await tester.contain(1, 14, 14, 3)).to.be.false;
    }
  });

  it('findAPixel', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        await tester.clear(0, 0, 0, 16);
        await tester.set(0, x, y, 1);
        await tester.setFindAPixel(0, 1);
        expect(await tester.isEqual(0, 1)).to.be.true;
      }
    }
  });
  // TODO: Add more tests, specially for clear, grid like things, etc...
});
