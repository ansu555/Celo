import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiRouteSwapperModule = buildModule("MultiRouteSwapperModule", (m) => {
  const swapper = m.contract("MultiRouteSwapper", []);

  return { swapper };
});

export default MultiRouteSwapperModule;
