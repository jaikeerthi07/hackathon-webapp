import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import VitalsChart from './components/VitalsChart';
import VitalsTable from './components/VitalsTable';
import NewsScore from './components/NewsScore';
import FileUpload from './components/FileUpload';

function App() {
  const [patientId, setPatientId] = useState(1);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/patient/${patientId}/dashboard`);
      setDashboardData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll every 5 seconds for "Live" simulation
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, [patientId]);

  const exportPDF = () => {
    const element = reportRef.current;
    html2pdf().from(element).save('MediGlove_Medical_Report.pdf');
  };

  if (!dashboardData && loading) return <div className="container">Loading Dashboard...</div>;
  if (!dashboardData) return <div className="container">No Data Available</div>;

  const { latest, history, analysis } = dashboardData;

  return (
    <div className="container" ref={reportRef}>
      <h1>MEDIGLOVE – Physician Dashboard</h1>

      {/* Patient Selection & Upload */}
      <div className="section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Patient Controls</h3>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="1">Patient 1 (John Doe)</option>
            {/* Future: Map other patients */}
          </select>
        </div>
        <FileUpload patientId={patientId} onUploadComplete={fetchDashboard} />
      </div>

      {/* Chart */}
      <div className="section">
        <h3>Vitals Trends (24h)</h3>
        <VitalsChart history={history} />
      </div>

      {/* Vitals Table */}
      <div className="section">
        <h3>Current Vitals & Trends</h3>
        <VitalsTable latest={latest} trends={analysis.trends} />
      </div>

      {/* NEWS Score */}
      <div className="section">
        <NewsScore newsScore={analysis.newsScore} latest={latest} />
      </div>

      {/* Interpretation */}
      <div className="section">
        <h3>Clinical Interpretation</h3>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
          {analysis.interpretation}
        </p>
      </div>

      {/* Notes */}
      <div className="section">
        <h3>Doctor Override Notes</h3>
        <textarea rows="4" placeholder="Doctor observations, override decision, medication notes..."></textarea>
      </div>

      {/* Actions */}
      <div className="section" data-html2canvas-ignore="true">
        <button className="export" onClick={exportPDF}>Export Medical PDF</button>
      </div>
    </div>
  );
}

export default App;
