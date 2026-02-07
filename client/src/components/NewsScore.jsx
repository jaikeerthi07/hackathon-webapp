import React from 'react';

const NewsScore = ({ newsScore, latest }) => {
    if (!latest) return null;

    // Re-calculate individual components for display if not passed from backend
    // Or just display '?' if we want to be strict about backend source
    // For now, let's implement simple client-side display logic to match the table breakdown

    const getScore = (val, type) => {
        let s = 0;
        if (type === 'HR') {
            if (val <= 40 || val >= 131) s = 3;
            else if (val >= 111) s = 2;
            else if (val <= 50 || (val >= 91 && val <= 110)) s = 1;
        }
        if (type === 'SPO2') {
            if (val <= 91) s = 3;
            else if (val >= 92 && val <= 93) s = 2;
            else if (val >= 94 && val <= 95) s = 1;
        }
        if (type === 'TEMP') {
            if (val <= 35.0) s = 3;
            else if (val >= 39.1) s = 2;
            else if ((val >= 35.1 && val <= 36.0) || (val >= 38.1 && val <= 39.0)) s = 1;
        }
        return s;
    };

    const hrScore = getScore(latest.heart_rate, 'HR');
    const spo2Score = getScore(latest.spo2, 'SPO2');
    const tempScore = getScore(latest.temperature, 'TEMP');

    let riskClass = "low";
    let riskLabel = "LOW";
    let showICU = false;

    if (newsScore >= 7) {
        riskClass = "high";
        riskLabel = "HIGH";
        showICU = true;
    } else if (newsScore >= 5) {
        riskClass = "medium";
        riskLabel = "MEDIUM";
    }

    return (
        <div>
            <h3>NEWS Score Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Heart Rate</td>
                        <td>{hrScore}</td>
                    </tr>
                    <tr>
                        <td>SpO₂</td>
                        <td>{spo2Score}</td>
                    </tr>
                    <tr>
                        <td>Temperature</td>
                        <td>{tempScore}</td>
                    </tr>
                    <tr>
                        <th>Total</th>
                        <th>{newsScore}</th>
                    </tr>
                </tbody>
            </table>

            <p style={{ marginTop: '15px', fontSize: '1.2em' }}>
                Clinical Risk:
                <span className={`badge ${riskClass}`} style={{ marginLeft: '10px' }}>{riskLabel}</span>
                {showICU && <span className="badge high" style={{ marginLeft: '10px' }}>ICU ESCALATION</span>}
            </p>
        </div>
    );
};

export default NewsScore;
