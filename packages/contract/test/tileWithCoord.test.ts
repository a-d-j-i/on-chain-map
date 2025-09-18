import {printTileWithCoord, tileWithCoordToJS} from './helpers.ts';
import {describe, it} from 'mocha';
import {network} from 'hardhat';
import {expect} from 'chai';

const {
  ethers: {getContractFactory},
  networkHelpers: {loadFixture},
} = await network.connect();

describe('TileWithCoordLib main', function () {
  async function setupTileWithCoordsLibTest() {
    const factory = await getContractFactory('TileWithCoordLibMock');
    return await factory.deploy();
  }

  it.skip('Some Tile With Coords', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    const x0 = 12336;
    const y0 = 54320;
    await tester.initTileWithCoord(0, x0, y0);
    await tester.set(0, x0 + 9, y0 + 9, 1);
    await tester.set(0, x0 + 15, y0 + 15, 1);
    await tester.set(0, x0 + 3, y0, 3);
    await tester.set(0, x0, y0 + 6, 6);
    await tester.clear(0, x0, y0 + 9, 3);
    const tile = await tester.getTile(0);
    const c = tileWithCoordToJS(tile);
    printTileWithCoord(c);
  });

  it('x, y, key', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    await tester.initTileWithCoord(0, 16 * 123, 16 * 321);
    const x = await tester.getX(0);
    expect(x).to.be.equal(16 * 123);
    const y = await tester.getY(0);
    expect(y).to.be.equal(16 * 321);
    expect(await tester.getKey(0)).to.be.equal((x / 16n) | ((y / 16n) << 128n));
  });

  it('merge', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    const tests = [
      [3, 0, 3],
      [8, 6, 6],
      [1, 1, 1],
      [15, 15, 1],
    ];
    const right = 16 * 123;
    const top = 16 * 321;

    // 0
    await tester.initTileWithCoord(0, right, top);
    for (const t of tests) {
      await tester.set(0, right + t[0], top + t[1], t[2]);
    }
    const tile = tileWithCoordToJS(await tester.getTile(0));

    // merge
    const outIdx = 29;
    await tester.initTileWithCoord(outIdx, right, top);
    for (let idx = 0; idx < tests.length; idx++) {
      await tester.initTileWithCoord(idx + 1, right, top);
      const t = tests[idx];
      await tester.set(idx + 1, right + t[0], top + t[1], t[2]);
      await tester.merge(outIdx, idx + 1);
    }
    const result = tileWithCoordToJS(await tester.getTile(outIdx));
    expect(result).to.be.eql(tile);
  });

  it('subtract', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    const tests = [
      [3, 0, 3],
      [8, 6, 6],
      [1, 1, 1],
      [15, 15, 1],
    ];
    const right = 16 * 123;
    const top = 16 * 321;

    // 0
    await tester.initTileWithCoord(0, right, top);
    await tester.set(0, right, top, 16); // all ones
    for (const t of tests) {
      await tester.clear(0, right + t[0], top + t[1], t[2]);
    }
    const tile = tileWithCoordToJS(await tester.getTile(0));

    // a lot of tiles to subtract
    for (let idx = 0; idx < tests.length; idx++) {
      await tester.initTileWithCoord(idx + 1, right, top);
      const t = tests[idx];
      await tester.set(idx + 1, right + t[0], top + t[1], t[2]);
    }

    const outIdx = 29;
    await tester.initTileWithCoord(outIdx, right, top);
    await tester.set(outIdx, right, top, 16); // all ones
    for (let idx = 0; idx < tests.length; idx++) {
      await tester.subtract(outIdx, idx + 1);
    }
    const result = tileWithCoordToJS(await tester.getTile(outIdx));
    expect(result).to.be.eql(tile);
  });

  it('contains', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    const tests = [
      [3, 0, 3],
      [8, 6, 6],
      [1, 1, 1],
      [15, 15, 1],
    ];
    const right = 16 * 123;
    const top = 16 * 321;
    // 0
    await tester.initTileWithCoord(0, right, top);
    for (const t of tests) {
      await tester.set(0, right + t[0], top + t[1], t[2]);
    }
    // 1
    for (const t of tests) {
      await tester.initTileWithCoord(1, right, top);
      await tester.set(1, right + t[0], top + t[1], t[2]);
      expect(await tester.contain(1, right + t[0], top + t[1], t[2])).to.be.true;
      expect(await tester.contain(0, right + t[0], top + t[1], t[2])).to.be.true;
    }
    expect(await tester.contain(0, right + 2, top + 2, 1)).to.be.false;
    expect(await tester.contain(0, right + 14, top + 14, 1)).to.be.false;
    expect(await tester.contain(0, right + 12, top + 12, 3)).to.be.false;
  });

  it('isEmpty', async function () {
    const tester = await loadFixture(setupTileWithCoordsLibTest);
    const right = 16 * 123;
    const top = 16 * 321;
    await tester.initTileWithCoord(0, right, top);
    expect(await tester.isEmpty(0)).to.be.true;
    await tester.set(0, right, top, 6);
    expect(await tester.isEmpty(0)).to.be.false;
    await tester.clear(0, right, top, 6);
    expect(await tester.isEmpty(0)).to.be.true;
  });

  // TODO: Add more tests, specially for clear, grid like things, etc...
});
