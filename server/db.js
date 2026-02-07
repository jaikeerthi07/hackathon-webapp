const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use in-memory database for Vercel compatibility (Demo Mode)
const dbPath = ':memory:';

console.log(`Using database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database (In-Memory).');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Patients Table
        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mrn TEXT UNIQUE NOT NULL,
            age INTEGER,
            gender TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Vitals Log Table
        db.run(`CREATE TABLE IF NOT EXISTS vitals_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            heart_rate INTEGER,
            spo2 INTEGER,
            temperature REAL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`);

        // Clinical Alerts Table
        db.run(`CREATE TABLE IF NOT EXISTS clinical_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            alert_type TEXT,
            severity TEXT CHECK(severity IN ('Low', 'Medium', 'High', 'Critical')),
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`);

        // Insert Dummy Patient if not exists
        db.get("SELECT count(*) as count FROM patients", (err, row) => {
            if (err) return console.error(err.message);
            if (row.count === 0) {
                const insertDummy = `
                    INSERT INTO patients (id, name, mrn, age, gender) 
                    VALUES (1, 'John Doe', 'MRN-001', 45, 'Male')
                `;
                db.run(insertDummy, (err) => {
                    if (err) console.error("Error inserting dummy patient:", err);
                    else console.log("Dummy patient inserted.");
                });
            }
        });
    });
}

module.exports = db;
