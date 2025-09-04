import {drawTile, getEmptyTile, resultToArray, setRectangle} from './helpers';
import {Contract} from 'ethers';
import {describe, it} from 'mocha';
import {network} from 'hardhat';
import {expect} from 'chai';
const {
  ethers: {getContractFactory},
  networkHelpers: {loadFixture},
} = await network.connect();
async function setTileBox(tester: Contract, tile: boolean[][]) {
  for (let y = 0; y < tile.length; y++) {
    for (let x = 0; x < tile[0].length; x++) {
      if (tile[y][x]) {
        await tester.set(0, x, y, 1);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function printGasEstimate(tester: Contract) {
  // console.log('Gas estimate:', await tester.isAdjacent.estimateGas(0));
}

describe('TileLib tester flood', function () {
  async function setupTileLibTest() {
    const factory = await getContractFactory('TileLibMock');
    return await factory.deploy();
  }

  describe('adjacent', function () {
    it('a line', async function () {
      const tester = await loadFixture(setupTileLibTest);
      await setTileBox(tester, resultToArray(['O X X O', 'O X X O', 'O X X O']));
      expect(await tester.isAdjacent(0)).to.be.true;
      await printGasEstimate(tester);
    });
    it('a square', async function () {
      const tester = await loadFixture(setupTileLibTest);
      const tile = drawTile([[3, 3, 10, 10]], getEmptyTile);
      await setTileBox(tester, tile);
      expect(await tester.isAdjacent(0)).to.be.true;
      await printGasEstimate(tester);
    });
    it('a square with a hole', async function () {
      const tester = await loadFixture(setupTileLibTest);
      const tile = setRectangle(drawTile([[3, 3, 10, 10]], getEmptyTile), 5, 5, 3, 3, false);
      await setTileBox(tester, tile);
      expect(await tester.isAdjacent(0)).to.be.true;
      await printGasEstimate(tester);
    });
    it('two squares on a 4-connected component', async function () {
      const tester = await loadFixture(setupTileLibTest);
      const tile = drawTile(
        [
          [3, 3, 2, 2],
          [4, 5, 2, 2],
        ],
        getEmptyTile,
      );
      await setTileBox(tester, tile);
      expect(await tester.isAdjacent(0)).to.be.true;
      await printGasEstimate(tester);
    });
  });
  describe('not adjacent', function () {
    it('truncated line', async function () {
      const tester = await loadFixture(setupTileLibTest);
      await setTileBox(tester, resultToArray(['O X X O', 'O O O O', 'O X X O', 'O X X O']));
      expect(await tester.isAdjacent(0)).to.be.false;
      await printGasEstimate(tester);
    });

    it('two squares', async function () {
      const tester = await loadFixture(setupTileLibTest);
      const tile = drawTile(
        [
          [3, 3, 2, 2],
          [10, 10, 2, 2],
        ],
        getEmptyTile,
      );
      await setTileBox(tester, tile);
      expect(await tester.isAdjacent(0)).to.be.false;
      await printGasEstimate(tester);
    });
    it('two squares on a 8-connected component', async function () {
      const tester = await loadFixture(setupTileLibTest);
      const tile = drawTile(
        [
          [3, 3, 2, 2],
          [5, 5, 2, 2],
        ],
        getEmptyTile,
      );
      await setTileBox(tester, tile);
      expect(await tester.isAdjacent(0)).to.be.false;
      await printGasEstimate(tester);
    });
  });
});
