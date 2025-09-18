import {tileToArray} from './helpers.ts';
import {describe, it} from 'mocha';
import {network} from 'hardhat';
import {expect} from 'chai';
import {Contract} from 'ethers';

const {
  ethers: {getContractFactory},
  networkHelpers: {loadFixture},
} = await network.connect();

const eqTiles = (arr1: boolean[][], arr2: boolean[][]) =>
  arr1.length == arr2.length &&
  arr1.every((r, i) => r.length === arr2[i].length && r.every((s, j) => s === arr2[i][j]));

async function floodTest(tester: Contract, isAdjacentTest: (isAdjacent: boolean) => void): Promise<void> {
  let spot = await tester.floodStepWithSpot(0);
  // const {printTile} = await import('./helpers.ts');
  // let j = 0;
  while (!spot.done) {
    // console.log('------------------------------------', j++);
    // for (let i = 0; i < spot.next.length; i++) {
    //   if (spot.next[i].data == 0n) {
    //     continue;
    //   }
    //   console.log('\t', 'idx:', i, 'x:', i % 8, 'y:', BigInt(i) / 8n);
    //   printTile(tileToArray(spot.next[i]));
    // }
    spot = await tester.floodStep(
      0,
      spot.next.map((x: {data: bigint}) => [x.data]),
    );
  }
  const map = await tester.getMap(0);
  let adj = true;
  for (let i = 0; i < map.tiles.length; i++) {
    const orig = map.tiles[i];
    const floodTile = tileToArray(spot.next[i]);
    const origTile = tileToArray(orig.data);
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

describe('CompactMap.sol flood', function () {
  async function setupMapTest() {
    const libFactory = await getContractFactory('CompactMap');
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();

    const factory = await getContractFactory('CompactMapMock', {
      libraries: {
        CompactMap: await lib.getAddress(),
      },
    });
    return await factory.deploy();
  }

  describe('adjacent', function () {
    it('everything is empty', async function () {
      const tester = await loadFixture(setupMapTest);
      const spot = await tester.floodStepWithSpot(0);
      expect(spot.done).to.be.true;
      expect(spot.next.every((x: {data: bigint}) => x.data == 0n)).to.be.true;
      expect(spot.current.every((x: {data: bigint}) => x.data == 0n)).to.be.true;
    });

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

    it('full map', async function () {
      this.timeout(10000);
      const tester = await loadFixture(setupMapTest);
      const size = await tester.getSize(0);
      for (let x = 0n; x < size.width; x += 16n) {
        for (let y = 0n; y < size.height; y += 16n) {
          await tester.set(0, x, y, 16);
        }
      }
      await adjacentTest(tester);
    });
  });
  describe('not adjacent', function () {
    it('two squares in the same tile', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 6, 6, 6);
      await tester.set(0, 14, 14, 2);
      await notAdjacentTest(tester);
    });
    it('two squares in two different tiles', async function () {
      const tester = await loadFixture(setupMapTest);
      await tester.set(0, 8, 8, 6);
      await tester.set(0, 36, 36, 6);
      await notAdjacentTest(tester);
    });
  });
  it('start searching from the middle of the map', async function () {
    const tester = await loadFixture(setupMapTest);
    const size = await tester.getSize(0);
    let ret;

    await tester.set(0, size.width - 1n, size.height - 1n, 1);
    ret = await tester.findNonEmptyTile(0);
    expect(ret.found).to.be.true;
    expect(ret.i).to.be.equal((size.width * size.height) / 16n / 16n - 1n);

    await tester.set(0, 0, 0, 1);
    ret = await tester.findNonEmptyTile(0);
    expect(ret.found).to.be.true;
    expect(ret.i).to.be.equal(0);

    await tester.set(0, size.width, size.width / 2n - 1n, 1);
    ret = await tester.findNonEmptyTile(0);
    expect(ret.found).to.be.true;
    expect(ret.i).to.be.equal((size.width * size.height) / 16n / 16n / 2n);
  });
});
