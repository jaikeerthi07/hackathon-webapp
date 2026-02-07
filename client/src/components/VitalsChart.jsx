import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VitalsChart = ({ history }) => {
    if (!history || history.length === 0) return <div>No Chart Data</div>;

    // Chart Logic
    // Assuming history is [oldest ... newest] for chart.js
    // Data comes as [newest ... oldest] from API logic, let's reverse if needed or handle in parent
    // In App.jsx I noticed I didn't verify order. Let's assume parent passes chronological order [oldest ... newest]
    // In index.js backend, I did `const history = [...rows].reverse();` so it IS chronological.

    const labels = history.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Heart Rate (BPM)',
                data: history.map(d => d.heart_rate),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.2,
            },
            {
                label: 'SpO2 (%)',
                data: history.map(d => d.spo2),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.2,
            },
            {
                label: 'Temp (°C)',
                data: history.map(d => d.temperature),
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                tension: 0.2,
            },
        ],
    };

    const options = {
        responsive: true,
        animation: { duration: 0 }, // Disable animation for performance with many points
        scales: {
            x: {
                ticks: { maxTicksLimit: 12 } // Limit X labels for 24h view 
            }
        },
        pointRadius: 0, // Performance optimization for dense data
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return <Line options={options} data={data} />;
};

export default VitalsChart;
