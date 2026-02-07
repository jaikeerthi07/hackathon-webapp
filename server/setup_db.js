const db = require('./db');

function setupDatabase() {
    db.serialize(() => {
        // Patients Table
        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mrn TEXT UNIQUE NOT NULL,
            age INTEGER,
            gender TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating patients table:", err);
            else console.log("Patients table ready.");
        });

        // Vitals Log Table
        db.run(`CREATE TABLE IF NOT EXISTS vitals_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            heart_rate INTEGER,
            spo2 INTEGER,
            temperature REAL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating vitals_log table:", err);
            else console.log("Vitals log table ready.");
        });

        // Clinical Alerts Table
        db.run(`CREATE TABLE IF NOT EXISTS clinical_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            alert_type TEXT,
            severity TEXT CHECK(severity IN ('Low', 'Medium', 'High', 'Critical')),
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating clinical_alerts table:", err);
            else console.log("Clinical alerts table ready.");
        });

        // Insert Dummy Patient
        const insertDummy = `
            INSERT OR IGNORE INTO patients (id, name, mrn, age, gender) 
            VALUES (1, 'John Doe', 'MRN-001', 45, 'Male')
        `;
        db.run(insertDummy, (err) => {
            if (err) console.error("Error inserting dummy patient:", err);
            else console.log("Dummy patient inserted/verified.");
        });
    });

    // Close connection after setup? 
    // Usually keep it open for app, but for setup script we might want to close.
    // However, db.js opens it automatically. We'll let the process exit naturally or force it if needed.
    // For this script, we can add a timeout or just let node exit when event loop is empty, 
    // but sqlite3 might keep it open.
    // Let's close it explicitly after a short delay to ensure ops finish.
    setTimeout(() => {
        db.close((err) => {
            if (err) console.error(err.message);
            console.log('Database connection closed.');
        });
    }, 1000);
}

setupDatabase();
