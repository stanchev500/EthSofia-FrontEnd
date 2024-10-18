// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';

function CustomNavbar({ setAccount }) {
    const [account, setLocalAccount] = useState(null);

    // Connect to MetaMask and get the account
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new BrowserProvider(window.ethereum);
                await provider.send('eth_requestAccounts', []);
                const signer = provider.getSigner();
                const accountAddress = await signer.getAddress();
                setLocalAccount(accountAddress);
                setAccount(accountAddress);
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                alert('Could not connect wallet. Please try again.');
            }
        } else {
            alert('Please install MetaMask!');
        }
    };

    useEffect(() => {
        const checkConnectedWallet = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setLocalAccount(accounts[0]);
                    setAccount(accounts[0]);
                }
            }
        };
        checkConnectedWallet();
    }, [setAccount]);

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href="#">MarketSense DApp</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#predict">Predict</Nav.Link>
                        <Nav.Link href="#redeem">Redeem</Nav.Link>
                    </Nav>
                    <div className="d-flex">
                        {account ? (
                            <span className="navbar-text text-white me-3">
                                Connected: {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                        ) : (
                            <Button variant="outline-light" onClick={connectWallet}>
                                Connect Wallet
                            </Button>
                        )}
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default CustomNavbar;
