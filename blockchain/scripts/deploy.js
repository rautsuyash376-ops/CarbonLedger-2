
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CarbonLedger...");

  const ledger = await ethers.deployContract("CarbonLedger");
  await ledger.waitForDeployment();

  const address = await ledger.getAddress();

  console.log("CarbonLedger deployed successfully!");
  console.log("Contract address:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
