import {buildModule} from '@nomicfoundation/hardhat-ignition/modules';
import MapToken from './MapToken.ts';

export default buildModule('MintSeeds', m => {
  const initialOwner = m.getParameter('admin');
  const {mapToken} = m.useModule(MapToken);
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
        from: initialOwner,
        after: [mapToken],
        id: 'mintSeeds' + i.toString(),
      }),
    );
  }
  m.call(mapToken, 'setSeeded', [true], {
    from: initialOwner,
    after: [mapToken, ...mintSeeds],
  });
});
