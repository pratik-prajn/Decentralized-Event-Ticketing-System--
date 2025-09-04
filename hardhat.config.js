require("dotenv").config();
require("hardhat-gas-reporter");
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    ...(process.env.SEPOLIA_RPC_URL && {
      sepolia: {
        url: process.env.SEPOLIA_RPC_URL,
        accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      },
    }),
  },
};
