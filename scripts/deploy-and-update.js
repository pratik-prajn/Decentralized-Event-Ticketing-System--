const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏭 Deploying EventFactory...");

  // Get the EventFactory contract factory
  const Factory = await ethers.getContractFactory("EventFactory");

  // Deploy the contract
  const factory = await Factory.deploy();

  // Wait for deployment (ethers v6)
  if (factory.waitForDeployment) {
    await factory.waitForDeployment();
  }

  // Get the address
  const factoryAddress = factory.target ?? factory.address;
  console.log("✅ EventFactory deployed to:", factoryAddress);

  // Update the constants.js file
  const constantsPath = path.join(__dirname, "..", "frontend", "src", "utils", "constants.js");
  const constantsContent = `import EventFactoryArtifact from "../abis/EventFactory.json";

export const NETWORK_URL     = "http://localhost:8545";
export const FACTORY_ADDRESS = "${factoryAddress}";
export const FACTORY_ABI     = EventFactoryArtifact.abi;`;

  fs.writeFileSync(constantsPath, constantsContent);
  console.log("✅ Updated frontend constants with new address");

  return factoryAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error deploying EventFactory:", error);
    process.exit(1);
  });
