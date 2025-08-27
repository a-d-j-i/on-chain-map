import {createTestMap, tileToArray} from './helpers';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';

describe('CompactMap.sol main', async function () {
  const {
    ethers: {getContractFactory},
    networkHelpers: {loadFixture},
  } = await network.connect();

  async function setupMapTest() {
    const libFactory = await getContractFactory('CompactMap');
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();

    const factory = await getContractFactory('CompactMapMock', {
      libraries: {
        CompactMap: await lib.getAddress(),
      },
    });
    const tester = await factory.deploy();
    return {
      tester,
      getMap: async function (idx: bigint) {
        const length = await tester.length(idx);
        const ret = [];
        for (let i = 0n; i < length; i++) {
          const data = await tester.at(idx, i);
          ret.push({
            tile: tileToArray(data),
            x: (i % 4n) * 16n,
            y: (i / 4n) * 16n,
            idx: i,
            data,
          });
        }
        return ret;
      },
    };
  }

  it('Some Map With Coords', async function () {
    const {tester, getMap} = await loadFixture(setupMapTest);
    const tests = createTestMap(64, 64, 30);
    // 0
    for (const t of tests) {
      await tester.set(0, t[0], t[1], t[2]);
    }
    const map = await getMap(0);
    // printMap(map, false);
    for (const t of tests) {
      const x0 = BigInt(t[0]);
      const y0 = BigInt(t[1]);
      const idx = x0 / 16n + (y0 / 16n) * 4n;
      // check the first pixel of the box
      expect(map[idx].tile[y0 % 16n][x0 % 16n]).to.be.true;
    }
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
    const maps = createTestMap(64, 64, 10);
    for (const t of maps) {
      await tester.set(0, t[0], t[1], t[2]);
      expect(await tester.contain(0, t[0], t[1], t[2])).to.be.true;
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
    expect((await getMap(0)).every(x => x.data == 0n)).to.be.true;
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
    expect((await getMap(0)).every(x => x.data == 0n)).to.be.true;
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
    expect((await getMap(0)).every(x => x.data == 0n)).to.be.true;
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
