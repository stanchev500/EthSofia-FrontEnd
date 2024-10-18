// src/components/Redeem.js
import React, { useState } from 'react';
import './Redeem.css'; // Custom CSS

function Redeem({ contract, account }) {
    const [questionId, setQuestionId] = useState('');

    const handleRedeem = async () => {
        if (contract) {
            try {
                await contract.redeem(questionId, { from: account });
                alert('Redeem successful!');
            } catch (error) {
                console.error(error);
                alert('Redeem failed!');
            }
        }
    };

    return (
        <div className="redeem-container">
            <h2>redeem</h2>
            <input
                type="text"
                className="input-field"
                placeholder="will ethereum hit 5k - questionID"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
            />
            <button className="redeem-button" onClick={handleRedeem}>
                Redeem
            </button>
        </div>
    );
}

export default Redeem;
