import {createTestMap, tileWithCoordToJS} from './helpers';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';

describe('SparseMap.sol main', async function () {
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
    const tester = await factory.deploy();
    return {
      tester,
      getMap: async function (idx: bigint) {
        const length = await tester.length(idx);
        const ret = [];
        for (let i = 0n; i < length; i++) {
          ret.push(tileWithCoordToJS(await tester.at(idx, i)));
        }
        return ret;
      },
    };
  }

  it('Some Map With Coords', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const tests = createTestMap(240, 240, 30);
    // 0
    for (const t of tests) {
      await tester.set(0, t[0], t[1], t[2]);
    }
    const map = await getMap(0);
    for (const t of tests) {
      const x0 = (BigInt(t[0]) / 16n) * 16n;
      const y0 = (BigInt(t[1]) / 16n) * 16n;
      // for each one at least one tile must be available
      expect(map.some((v: {x: bigint; y: bigint}) => v.x == x0 && v.y == y0)).to.be.true;
    }
    // printMap(map);
  });

  it('merge', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const maps = [];
    for (let i = 0; i < 6; i++) {
      maps.push(createTestMap(60, 60, 50));
    }
    // 0
    for (const map of maps) {
      for (const t of map) {
        await tester.set(0, t[0], t[1], t[2]);
      }
    }
    // merge
    const outIdx = 29;
    // 1 - 11
    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      for (const t of map) {
        await tester.set(i + 1, t[0], t[1], t[2]);
      }
      await tester.setMap(outIdx, i + 1);
      expect(await tester.containMap(outIdx, i + 1)).to.be.true;
    }
    expect(await getMap(0)).to.be.eql(await getMap(outIdx));
  });

  it('contain', async function () {
    const {tester} = await loadFixture(setupMapTest);
    const maps = createTestMap(240, 240, 10);
    for (const t of maps) {
      await tester.set(0, t[0], t[1], t[2]);
      expect(await tester.contain(0, t[0], t[1], t[2])).to.be.true;
      expect(await tester.containTileAtCoord(0, t[0], t[1])).to.be.true;
      for (let i = 0; i < t[2]; i++) {
        for (let j = 0; j < t[2]; j++) {
          expect(await tester.containCoord(0, t[0] + i, t[1] + j)).to.be.true;
        }
      }
    }
    const t = maps[0];
    await tester.set(1, t[0], t[1], t[2]);
    expect(await tester.containMap(0, 1)).to.be.true;
  });

  it('clear map', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const maps = [];
    for (let i = 0; i < 10; i++) {
      maps.push(createTestMap(60, 60, 10));
    }
    // set
    for (const map of maps) {
      for (const t of map) {
        await tester.set(0, t[0], t[1], t[2]);
      }
    }
    // clear
    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      for (const t of map) {
        await tester.set(i + 1, t[0], t[1], t[2]);
        await tester.clearMap(0, i + 1);
      }
    }
    // clear
    expect(await getMap(0)).to.be.empty;
  });

  it('clear', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const maps = [];
    for (let i = 0; i < 10; i++) {
      maps.push(createTestMap(60, 60, 10));
    }
    // set
    for (const map of maps) {
      for (const t of map) {
        await tester.set(0, t[0], t[1], t[2]);
      }
    }
    // clear
    for (const map of maps) {
      for (const t of map) {
        await tester.clear(0, t[0], t[1], t[2]);
      }
    }
    expect(await getMap(0)).to.be.empty;
  });

  it('clear 2', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const maps = [];
    for (let i = 0; i < 10; i++) {
      maps.push(createTestMap(60, 60, 10));
    }
    // set
    for (const map of maps) {
      for (const t of map) {
        await tester.set(0, t[0], t[1], t[2]);
      }
    }
    await tester.clear(0);
    // clear
    expect(await getMap(0)).to.be.empty;
  });

  it('isEqual', async function () {
    const {tester} = await loadFixture(setupMapTest);
    const maps = [];
    maps.push({x: 6, y: 6, size: 3});
    maps.push({x: 1, y: 1, size: 1});
    maps.push({x: 3, y: 3, size: 1});
    for (const t of maps) {
      await tester.set(0, t.x, t.y, t.size);
    }
    for (let i = 0; i < maps.length; i++) {
      const t = maps[i];
      await tester.set(1, t.x, t.y, t.size);
      if (i < maps.length - 1) {
        expect(await tester.isEqual(0, 1)).to.be.false;
        expect(await tester.isEqual(1, 0)).to.be.false;
      }
    }
    expect(await tester.isEqual(0, 1)).to.be.true;
    expect(await tester.isEqual(1, 0)).to.be.true;
    expect(await tester.containMap(0, 1)).to.be.true;
    expect(await tester.containMap(1, 0)).to.be.true;
  });

  // TODO: Add more tests, specially for clear, grid like things, etc...
});
