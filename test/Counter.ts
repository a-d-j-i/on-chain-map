// We don't have Ethereum specific assertions in Hardhat 3 yet
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {network} from 'hardhat';

describe('Counter', async function () {
  const {
    viem,
    networkHelpers: {loadFixture},
  } = await network.connect();
  const publicClient = await viem.getPublicClient();

  async function fixtures() {
    const counter = await viem.deployContract('Counter');
    return {counter};
  }

  await it('Should emit the Increment event when calling the inc() function', async function () {
    const {counter} = await loadFixture(fixtures);
    await viem.assertions.emitWithArgs(
      counter.write.inc(),
      counter,
      'Increment',
      [1n],
    );
  });

  await it('The sum of the Increment events should match the current value', async function () {
    const {counter} = await loadFixture(fixtures);
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    // run a series of increments
    for (let i = 1n; i <= 10n; i++) {
      await counter.write.incBy([i]);
    }

    const events = await publicClient.getContractEvents({
      address: counter.address,
      abi: counter.abi,
      eventName: 'Increment',
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    // check that the aggregated events match the current value
    let total = 0n;
    for (const event of events) {
      total += event.args.by;
    }

    assert.equal(total, await counter.read.x());
  });
});
