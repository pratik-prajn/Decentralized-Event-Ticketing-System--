// filepath: p:\CS216_Decentralised_Event_Ticketing_System_Team_RIP_Scrooge-master\scripts\deploy-localhost.js
const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏭 Deploying EventFactory...");
  const Factory = await ethers.getContractFactory("EventFactory"); // ensure name matches your Solidity contract
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log("✅ EventFactory deployed to:", factory.address);

  // Write ABI for frontend
  const artifact = await artifacts.readArtifact("EventFactory");
  const abiDir = path.join(__dirname, "..", "frontend", "src", "abi");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(path.join(abiDir, "EventFactory.json"), JSON.stringify(artifact, null, 2));

  // Update frontend env
  const frontEnvPath = path.join(__dirname, "..", "frontend", ".env");
  const frontEnv = `REACT_APP_FACTORY_ADDRESS=${factory.address}
REACT_APP_NETWORK_URL=http://127.0.0.1:8545
`;
  fs.writeFileSync(frontEnvPath, frontEnv);

  // Update constants as fallback
  const constPath = path.join(__dirname, "..", "frontend", "src", "utils", "constants.js");
  const constJs = `export const NETWORK_URL = process.env.REACT_APP_NETWORK_URL || "http://127.0.0.1:8545";
export const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS || "${factory.address}";
`;
  fs.writeFileSync(constPath, constJs);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});