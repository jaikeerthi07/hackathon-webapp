const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static('public')); // Serve static assets
app.set('view engine', 'ejs');
app.set('views', './views'); // Look for views in server/views

const PORT = process.env.PORT || 3000;

// --- LOGIC ENGINES ---

// 1. NEWS Score Logic
function calculateNEWS(hr, spo2, temp) {
    let score = 0;

    // HR (BPM)
    if (hr <= 40) score += 3;
    else if (hr >= 131) score += 3;
    else if (hr >= 111) score += 2;
    else if (hr <= 50) score += 1;
    else if (hr >= 91) score += 1;

    // SpO2 (%)
    if (spo2 <= 91) score += 3;
    else if (spo2 >= 92 && spo2 <= 93) score += 2;
    else if (spo2 >= 94 && spo2 <= 95) score += 1;

    // Temperature (°C)
    if (temp <= 35.0) score += 3;
    else if (temp >= 39.1) score += 2;
    else if (temp >= 38.1) score += 1;
    else if (temp <= 36.0) score += 1;

    return score;
}

// 2. Trend Analysis
function analyzeTrend(current, previous) {
    if (!previous) return "STABLE";
    if (current > previous) return "UP";
    if (current < previous) return "DOWN";
    return "STABLE";
}

// 3. Interpretation Engine
function generateInterpretation(hr, spo2, temp, news) {
    let notes = [];

    if (news >= 7) notes.push("CRITICAL: Immediate ICU review required");
    else if (news >= 5) notes.push("URGENT: Urgent clinical review required");

    if (hr > 100) notes.push("Tachycardia");
    if (spo2 < 94) notes.push("Hypoxia");
    if (temp > 38) notes.push("Fever");

    return notes.length > 0 ? notes.join(". ") : "Patient Stable";
}

// --- ROUTES ---

// Routes
app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/dashboard', (req, res) => {
    // In a real app, check session/token here
    const patientId = req.query.id;
    if (!patientId) return res.redirect('/select-patient');

    db.get("SELECT * FROM patients WHERE id = ?", [patientId], (err, patient) => {
        if (err || !patient) return res.redirect('/select-patient');
        res.render('dashboard', { patient });
    });
});

app.get('/select-patient', (req, res) => {
    res.render('select_patient');
});

// API Routes
app.get('/api/patients/search', (req, res) => {
    const { ward, room } = req.query;
    let query = "SELECT * FROM patients WHERE 1=1";
    const params = [];

    if (ward) {
        query += " AND ward = ?";
        params.push(ward);
    }
    if (room) {
        query += " AND room = ?";
        params.push(room);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/wards', (req, res) => {
    db.all("SELECT DISTINCT ward FROM patients WHERE ward IS NOT NULL", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.ward));
    });
});

app.post('/api/vitals/upload', async (req, res) => {
    const { patientId, data } = req.body;
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: "Invalid data" });

    // Validate patient exists
    db.get('SELECT id FROM patients WHERE id = ?', [patientId], (err, row) => {
        if (err || !row) {
            // Auto-create for demo if not exists? Or strict? Let's be strict for now, or just use ID 1
            if (!row && patientId != 1) return res.status(404).json({ error: "Patient not found" });
        }

        const stmt = db.prepare('INSERT INTO vitals_log (patient_id, heart_rate, spo2, temperature, timestamp) VALUES (?, ?, ?, ?, ?)');
        const today = new Date().toISOString().split('T')[0];

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            try {
                data.forEach(item => {
                    // Excel keys might correspond to implementation_plan: Time, HeartRate, SpO2, Temperature
                    // Construct timestamp: "YYYY-MM-DD HH:MM:SS"
                    let ts = item.Time;
                    if (!ts.includes(' ')) ts = `${today} ${ts}`;

                    stmt.run(patientId, item.HeartRate, item.SpO2, item.Temperature, ts);
                });
                db.run("COMMIT");
                res.json({ success: true, count: data.length });
            } catch (e) {
                db.run("ROLLBACK");
                res.status(500).json({ error: e.message });
            }
        });
        stmt.finalize();
    });
});

// Get Dashboard Data
app.get('/api/patient/:id/dashboard', (req, res) => {
    const pid = req.params.id;

    const query = `
        SELECT * FROM vitals_log 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 2000
    `;

    db.all(query, [pid], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Rows are DESC (newest first). 
        // For Chart.js, we need ASC (oldest first).
        const history = [...rows].reverse();

        const latest = rows[0] || {};
        const prev = rows[1] || {};

        // Calculate Logic on the fly
        const currentNews = latest.id ? calculateNEWS(latest.heart_rate, latest.spo2, latest.temperature) : 0;

        const trends = {
            hr: analyzeTrend(latest.heart_rate, prev.heart_rate),
            spo2: analyzeTrend(latest.spo2, prev.spo2),
            temp: analyzeTrend(latest.temperature, prev.temperature)
        };

        const interpretation = latest.id ? generateInterpretation(latest.heart_rate, latest.spo2, latest.temperature, currentNews) : "No Data";

        res.json({
            patientId: pid,
            latest: latest,
            history: history,
            analysis: {
                newsScore: currentNews,
                trends: trends,
                interpretation: interpretation
            }
        });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
