import {buildModule} from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('MapToken', m => {
  const initialOwner = m.getParameter('admin');
  const deployer = m.getAccount(0);
  const sparseMap = m.library('SparseMap');
  const mapToken = m.contract('MapToken', [initialOwner, {x: 256, y: 256}], {
    from: deployer,
    libraries: {
      SparseMap: sparseMap,
    },
  });
  return {mapToken};
});
