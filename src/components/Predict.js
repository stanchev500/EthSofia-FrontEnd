// src/components/Predict.js
import React, { useState } from 'react';
import './Predict.css'; // Custom CSS

function Predict({ contract, account }) {
    const [questionId, setQuestionId] = useState('');
    const [amount, setAmount] = useState('');

    const handlePredict = async (prediction) => {
        if (contract) {
            try {
                await contract.predict(amount, questionId, prediction, { from: account });
                alert(`Prediction submitted: ${prediction ? 'Yes' : 'No'}`);
            } catch (error) {
                console.error(error);
                alert('Prediction failed!');
            }
        }
    };

    return (
        <div className="predict-container">
            <h2>predict</h2>
            <input
                type="text"
                className="input-field"
                placeholder="will ethereum hit 5k - questionID"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
            />
            <div className="button-group">
                <button className="yes-button" onClick={() => handlePredict(true)}>yes</button>
                <button className="no-button" onClick={() => handlePredict(false)}>no</button>
            </div>
            <input
                type="text"
                className="input-field"
                placeholder="1 eth - amount of eth to predict"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
        </div>
    );
}

export default Predict;
