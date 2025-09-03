import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {expect} from 'chai';

describe('MapToken', async function () {
  const {
    ethers: {getContractFactory, getSigners},
    networkHelpers: {loadFixture},
  } = await network.connect();

  async function setupMapToken() {
    const libFactory = await getContractFactory('SparseMap');
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();

    const factory = await getContractFactory('MapToken', {
      libraries: {
        SparseMap: await lib.getAddress(),
      },
    });
    const [deployer, admin] = await getSigners();
    const tester = await factory.deploy(admin, {x: 256, y: 256});
    return {tester, deployer, admin};
  }

  it('Some Tile', async function () {
    const {tester, admin} = await loadFixture(setupMapToken);
    for (let i = 0; i < 4; i++) {
      const coords = [];
      const lines = [];
      for (let y = 64 * i + 8; y < 64 * i + 64; y += 16) {
        lines.push(y);
        for (let x = 8; x < 256; x += 16) {
          coords.push({x, y});
        }
      }
      const tx = await tester.connect(admin).mintSeeds(coords);
      const receipt = await tx.wait();
      console.log('Gas estimate:', receipt.gasUsed.toString(), 'for lines', lines);
    }
    await tester.connect(admin).setSeeded(true);
    expect(await tester.isSeeded()).to.be.true;
  });
});
