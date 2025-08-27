import {tileToArray} from './helpers';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';
import {Contract} from 'ethers';
const eqTiles = (arr1: boolean[][], arr2: boolean[][]) =>
  arr1.length == arr2.length &&
  arr1.every((r, i) => r.length === arr2[i].length && r.every((s, j) => s === arr2[i][j]));

async function floodTest(tester: Contract, isAdjacentTest: (isAdjacent: boolean) => void): Promise<void> {
  let spot = await tester.floodStepWithSpot(0);
  // let j = 0;
  while (!spot.done) {
    // console.log('------------------------------------', j++);
    // for (let i = 0; i < spot.next.length; i++) {
    //   console.log('\t', i);
    //   printTile(tileToArray(spot.next[i].data));
    // }
    spot = await tester.floodStep(
      0,
      spot.next.map(x => [x.data]),
    );
  }
  const len = await tester.length(0);
  let adj = true;
  for (let i = 0n; i < len; i++) {
    const orig = await tester.at(0, i);
    const floodTile = tileToArray(spot.next[i].data);
    const origTile = tileToArray(orig.tile.data);
    adj = adj && eqTiles(floodTile, origTile);
  }
  isAdjacentTest(adj);
  isAdjacentTest(await tester.isAdjacent(0));
  console.log('Gas estimate:', await tester.isAdjacent.estimateGas(0));
}

async function adjacentTest(tester: Contract) {
  await floodTest(tester, isAdjacent => expect(isAdjacent).to.be.true);
}

async function notAdjacentTest(tester: Contract) {
  await floodTest(tester, isAdjacent => expect(isAdjacent).to.be.false);
}

describe('SparseMap.sol flood', async function () {
  const {
    ethers: {getContractFactory},
    networkHelpers: {loadFixture},
  } = await network.connect();

  async function setupMapTest() {
    const libFactory = await getContractFactory('SparseMap');
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();

    const factory = await getContractFactory('SparseMapMock', {
      libraries: {
        SparseMap: await lib.getAddress(),
      },
    });
    return await factory.deploy();
  }

  describe('adjacent', function () {
    it('some square in the center', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 8, 8, 6);
      await adjacentTest(tester);
    });
    it('a square over two tiles', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 0, 8, 8);
      await tester.set(0, 0, 16, 8);
      await adjacentTest(tester);
    });
    it('a square over four tiles', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 8, 8, 8);
      await tester.set(0, 8, 16, 8);
      await tester.set(0, 16, 8, 8);
      await tester.set(0, 16, 16, 8);
      await adjacentTest(tester);
    });
    it('four full tiles', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 0, 0, 16);
      await tester.set(0, 0, 16, 16);
      await tester.set(0, 16, 0, 16);
      await tester.set(0, 16, 16, 16);
      await adjacentTest(tester);
    });
  });
  describe('not adjacent', function () {
    it('two squares in the same tile', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 6, 6, 6);
      await tester.set(0, 18, 18, 6);
      await notAdjacentTest(tester);
    });
    it('two squares in two different tiles', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 8, 8, 6);
      await tester.set(0, 36, 36, 6);
      await notAdjacentTest(tester);
    });
  });
});
