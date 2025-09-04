const { ethers } = require("hardhat");

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

  // Address may be in factory.target (v6) or factory.address
  console.log("✅ EventFactory deployed to:", factory.target ?? factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error deploying EventFactory:", error);
    process.exit(1);
  });
