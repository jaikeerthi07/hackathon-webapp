import React from 'react';

const VitalsTable = ({ latest, trends }) => {
    if (!latest) return <div>No Vitals Data</div>;

    const renderTrend = (direction) => {
        if (direction === 'UP') return <span className="arrow-up">↑</span>;
        if (direction === 'DOWN') return <span className="arrow-down">↓</span>;
        return <span className="arrow-stable">→</span>;
    };

    // Status flags (simple logic for display, matching original HTML)
    const getFlag = (val, type) => {
        if (!val) return "";
        if (type === 'HR') {
            if (val > 100) return <span className="badge high">HIGH</span>;
            if (val < 60) return <span className="badge high">LOW</span>;
        }
        if (type === 'SPO2') {
            if (val < 94) return <span className="badge high">LOW</span>;
        }
        if (type === 'TEMP') {
            if (val > 38) return <span className="badge high">HIGH</span>;
        }
        return <span className="badge low">OK</span>;
    };

    return (
        <table>
            <thead>
                <tr>
                    <th>Vital</th>
                    <th>Value</th>
                    <th>Trend</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Heart Rate</td>
                    <td>{latest.heart_rate} BPM</td>
                    <td>{renderTrend(trends.hr)}</td>
                    <td>{getFlag(latest.heart_rate, 'HR')}</td>
                </tr>
                <tr>
                    <td>SpO₂</td>
                    <td>{latest.spo2} %</td>
                    <td>{renderTrend(trends.spo2)}</td>
                    <td>{getFlag(latest.spo2, 'SPO2')}</td>
                </tr>
                <tr>
                    <td>Temperature</td>
                    <td>{latest.temperature} °C</td>
                    <td>{renderTrend(trends.temp)}</td>
                    <td>{getFlag(latest.temperature, 'TEMP')}</td>
                </tr>
            </tbody>
        </table>
    );
};

export default VitalsTable;
