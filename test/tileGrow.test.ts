import {drawExtendedTile, extendedTileToArray, printTile} from './helpers';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';

describe('TileLib grow and flood', async function () {
  const {
    ethers: {getContractFactory},
    networkHelpers: {loadFixture},
  } = await network.connect();
  async function setupTileLibTest() {
    const factory = await getContractFactory('TileLibMock');
    return await factory.deploy();
  }

  it('a dot', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 8, 8, 1);
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [24, 23, 1, 3],
      [23, 24, 3, 1],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('some square in the center', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 8, 8, 6);
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [24, 23, 6, 8],
      [23, 24, 8, 6],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('square border', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let i = 0; i < 16; i++) {
      await tester.set(0, i, 0, 1);
      await tester.set(0, 0, i, 1);
      await tester.set(0, i, 15, 1);
      await tester.set(0, 15, i, 1);
    }
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [16, 15, 16, 3],
      [16, 30, 16, 3],
      [15, 16, 3, 16],
      [30, 16, 3, 16],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('top border', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let i = 0; i < 16; i++) {
      await tester.set(0, i, 0, 1);
    }
    const tile = await tester.grow(0);
    const result = drawExtendedTile([[16, 15, 16, 3]]);
    result[16][15] = true;
    result[16][32] = true;
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('down border', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let i = 0; i < 16; i++) {
      await tester.set(0, i, 15, 1);
    }
    const tile = await tester.grow(0);
    const result = drawExtendedTile([[16, 30, 16, 3]]);
    result[31][15] = true;
    result[31][32] = true;
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('left border', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let i = 0; i < 16; i++) {
      await tester.set(0, 0, i, 1);
    }
    const tile = await tester.grow(0);
    const result = drawExtendedTile([[15, 16, 3, 16]]);
    result[15][16] = true;
    result[32][16] = true;
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('right border', async function () {
    const tester = await loadFixture(setupTileLibTest);
    for (let i = 0; i < 16; i++) {
      await tester.set(0, 15, i, 1);
    }
    const tile = await tester.grow(0);
    const result = drawExtendedTile([[30, 16, 3, 16]]);
    result[15][31] = true;
    result[32][31] = true;
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('a full square', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 0, 0, 16);
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [15, 16, 18, 16],
      [16, 15, 16, 18],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('two dots in the division of the tile', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 8, 0, 1);
    await tester.set(0, 8, 15, 1);
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [24, 15, 1, 3],
      [23, 16, 3, 1],
      [24, 30, 1, 3],
      [23, 31, 3, 1],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it('four corners', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 0, 0, 1);
    await tester.set(0, 0, 15, 1);
    await tester.set(0, 15, 0, 1);
    await tester.set(0, 15, 15, 1);
    const tile = await tester.grow(0);
    const result = drawExtendedTile([
      [16, 15, 1, 3],
      [15, 16, 3, 1],
      [31, 15, 1, 3],
      [30, 16, 3, 1],
      [16, 30, 1, 3],
      [15, 31, 3, 1],
      [31, 30, 1, 3],
      [30, 31, 3, 1],
    ]);
    expect(extendedTileToArray(tile)).to.be.eql(result);
  });

  it.skip('flood test', async function () {
    const tester = await loadFixture(setupTileLibTest);
    await tester.set(0, 8, 8, 1);
    let spot = await tester.findAPixel(0);
    for (let i = 0; i < 14; i++) {
      printTile(extendedTileToArray(spot.next));
      console.log('--------------------------->', i, 2 * i + 1);
      spot = await tester.floodStep({data: spot.next.middle.data});
    }
  });
});
