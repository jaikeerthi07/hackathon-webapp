// MOCK DATABASE FOR VERCEL DEMO
// Replaces sqlite3 to avoid native binding errors in serverless environment

class MockDB {
    constructor() {
        this.patients = [
            { id: 1, name: 'John Doe', mrn: 'MRN-001', age: 45, gender: 'Male', ward: 'ICU', room: '101', created_at: new Date().toISOString() }
        ];
        this.vitals_log = [];
        this.clinical_alerts = [];
        this.currentPatientId = 1;
        this.currentVitalsId = 1;

        console.log("MockDB Initialized with 1 patient.");
    }

    serialize(callback) {
        callback();
    }

    run(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        // Handle INSERTS
        if (sql.includes('INSERT INTO vitals_log')) {
            // "INSERT INTO vitals_log (patient_id, heart_rate, spo2, temperature, timestamp) VALUES (?, ?, ?, ?, ?)"
            // params: [pid, hr, spo2, temp, ts]
            const [pid, hr, spo2, temp, ts] = params;
            this.vitals_log.push({
                id: this.currentVitalsId++,
                patient_id: pid,
                heart_rate: hr,
                spo2: spo2,
                temperature: temp,
                timestamp: ts || new Date().toISOString()
            });
            if (callback) callback.call({ lastID: this.currentVitalsId - 1 }, null);
        } else {
            // Ignore other runs (CREATE TABLE etc)
            if (callback) callback(null);
        }
    }

    get(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        // Handle SELECT * FROM patients WHERE id = ?
        if (sql.includes('FROM patients WHERE id')) {
            const id = params[0];
            const p = this.patients.find(p => p.id == id);
            callback(null, p);
        }
        // Handle SELECT count(*)
        else if (sql.includes('count(*)')) {
            callback(null, { count: this.patients.length });
        }
        else {
            callback(null, null);
        }
    }

    all(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        // Handle SELECT * FROM vitals_log WHERE patient_id = ?
        if (sql.includes('FROM vitals_log')) {
            const pid = params[0];
            // Filter and Sort DESC
            const rows = this.vitals_log
                .filter(v => v.patient_id == pid)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

            // Limit if needed, simplified
            callback(null, rows.slice(0, 2000));
        }
        // Handle SELECT DISTINCT ward
        else if (sql.includes('DISTINCT ward')) {
            const wards = [...new Set(this.patients.map(p => ({ ward: p.ward })))];
            callback(null, wards);
        }
        // Handle Search
        else if (sql.includes('FROM patients WHERE 1=1')) {
            // Simplified search - return all for demo
            callback(null, this.patients);
        }
        else {
            callback(null, []);
        }
    }

    prepare(sql) {
        // Return dummy statement object
        const db = this;
        return {
            run: function (...args) {
                // Forward to db.run, last arg might be callback but usually prepared statement run doesn't take callback in same way
                // In our code: stmt.run(patientId, item.HeartRate, item.SpO2, item.Temperature, ts);
                // We need to construct parameters array
                db.run(sql, args);
            },
            finalize: function () { }
        }
    }
}

const db = new MockDB();
module.exports = db;
