import React, { useState } from "react";
import { ethers } from "ethers";
import './ConnectWalletButton.css';

export default function ConnectWalletButton({ 
  onConnect,
  onDisconnect, 
  setStatus, 
  setStatusType,
  setSigner,
  setUserAddress,
  setFactory,
  userAddress,
  factoryAddress,
  factoryABI
}) {
  // Connect wallet functionality moved from App.js
  const connectWallet = async () => {
    // Check if MetaMask is installed
    if (!window.ethereum?.isMetaMask) {
      setStatus("Please install MetaMask extension");
      setStatusType("error");
      return;
    }

    try {
      setStatus("Connecting wallet...");
      setStatusType("info");
      
      // Directly use window.ethereum instead of ethers.BrowserProvider
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Initialize ethers provider after successful connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setSigner(signer);
      setUserAddress(address);
      
      // Initialize contract after wallet connection
      setFactory(new ethers.Contract(factoryAddress, factoryABI, signer));
      
      setStatus("Wallet connected successfully");
      setStatusType("success");
      
      // Call parent handler if provided
      if (onConnect) {
        onConnect(signer, address);
      }
    } catch (error) {
      console.error("Connection error:", error);
      setStatus(error.message || "Failed to connect wallet");
      setStatusType("error");
      
      // Reset connection state on error
      setUserAddress(null);
      setSigner(null);
      setFactory(null);
    }
  };

  // Disconnect wallet function moved from App.js
  const disconnectWallet = () => {
    setUserAddress(null);
    setSigner(null);
    setFactory(null);
    setStatus("Wallet disconnected");
    setStatusType("info");
    
    // Call parent handler if provided
    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Show different button based on connection state
  if (userAddress) {
    return (
      <div className="wallet-info">
        <span className="address-display">{formatAddress(userAddress)}</span>
        <button 
          className="logout-button" 
          onClick={disconnectWallet}
          title="Disconnect wallet"
        >
          Logout
        </button>
      </div>
    );
  }

  // Connection button if not connected
  return (
    <button 
      className="connect-btn"
      onClick={connectWallet}
    >
      👛 Connect MetaMask
    </button>
  );
}

// Helper to format address
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};