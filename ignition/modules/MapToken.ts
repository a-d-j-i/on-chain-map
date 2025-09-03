import {buildModule} from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('MapToken', m => {
  const initialOwner = m.getAccount(0);
  const sparseMap = m.library('SparseMap');
  const mapToken = m.contract('MapToken', [initialOwner, {x: 256, y: 256}], {
    libraries: {
      SparseMap: sparseMap,
    },
  });
  const mintSeeds = [];
  for (let i = 0; i < 4; i++) {
    const coords = [];
    const lines = [];
    for (let y = 64 * i + 8; y < 64 * i + 64; y += 16) {
      lines.push(y);
      for (let x = 8; x < 256; x += 16) {
        coords.push({x, y});
      }
    }
    mintSeeds.push(
      m.call(mapToken, 'mintSeeds', [coords], {
        after: [mapToken],
        id: 'mintSeeds' + i.toString(),
      }),
    );
  }
  m.call(mapToken, 'setSeeded', [true], {
    after: [mapToken, ...mintSeeds],
  });
  return {mapToken};
});
