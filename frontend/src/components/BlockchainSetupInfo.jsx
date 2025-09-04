import React from 'react';
import './BlockchainSetupInfo.css';

const BlockchainSetupInfo = ({ onClose }) => {
  return (
    <div className="setup-modal-overlay">
      <div className="setup-modal">
        <h3>🚀 Blockchain Setup Required</h3>
        <p>To use this decentralized event ticketing system, you need:</p>
        
        <div className="setup-steps">
          <div className="step">
            <span className="step-number">1</span>
            <div>
              <strong>Install MetaMask</strong>
              <p>Download and install the MetaMask browser extension</p>
            </div>
          </div>
          
          <div className="step">
            <span className="step-number">2</span>
            <div>
              <strong>Start Local Blockchain</strong>
              <p>Run these commands in your terminal:</p>
              <div className="code-block">
                <code>npx hardhat node --hostname 127.0.0.1</code>
              </div>
              <p>Then in another terminal:</p>
              <div className="code-block">
                <code>npx hardhat run scripts/deploy-and-update.js --network localhost</code>
              </div>
            </div>
          </div>
          
          <div className="step">
            <span className="step-number">3</span>
            <div>
              <strong>Connect MetaMask</strong>
              <p>Add the local network to MetaMask:</p>
              <ul>
                <li>Network Name: Localhost</li>
                <li>RPC URL: http://127.0.0.1:8545</li>
                <li>Chain ID: 31337</li>
                <li>Currency Symbol: ETH</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="setup-actions">
          <button className="setup-btn-primary" onClick={onClose}>
            I'll Set This Up Later
          </button>
          <a 
            href="https://metamask.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="setup-btn-secondary"
          >
            Download MetaMask
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockchainSetupInfo;
