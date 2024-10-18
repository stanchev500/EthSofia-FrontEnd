// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import Navbar from './components/Navbar';
import Predict from './components/Predict';
import Redeem from './components/Redeem';
import './App.css'; // Import the updated CSS

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
const CONTRACT_ABI = require('./contract/MarketSenseABI.json');

function App() {
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        const connectWallet = async () => {
            try {
                if (window.ethereum) {
                    const tempProvider = new BrowserProvider(window.ethereum);
                    const tempSigner = await tempProvider.getSigner();
                    const tempAccount = await tempSigner.getAddress();
                    setAccount(tempAccount);
                    const tempContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, tempSigner);
                    setContract(tempContract);
                } else {
                    alert("Please install MetaMask!");
                }
            } catch (err) {
                console.error("Wallet connection failed:", err);
            }
        };
        connectWallet();
    }, []);

    return (
        <div className="App">
            {/* Header */}
            <div className="header">
                <h1>MarketSense</h1>
                {account && (
                    <div className="wallet-info">
                        Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="container">
                <h1 className="title">marketsense</h1>
                <Predict contract={contract} account={account} />
                <Redeem contract={contract} account={account} />
            </div>
        </div>
    );
}

export default App;
