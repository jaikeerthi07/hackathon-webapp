const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        console.error('Please ensure MySQL is running and credentials in .env are correct.');
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    const dbName = 'mediglove';

    // Create Database
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
        }
        console.log(`Database ${dbName} checked/created.`);

        // Use Database
        connection.changeUser({ database: dbName }, (err) => {
            if (err) {
                console.error('Error selecting database:', err);
                process.exit(1);
            }

            // Create Tables
            const createPatients = `
        CREATE TABLE IF NOT EXISTS patients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          mrn VARCHAR(50) UNIQUE NOT NULL,
          age INT,
          gender ENUM('Male', 'Female', 'Other'),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

            const createVitals = `
        CREATE TABLE IF NOT EXISTS vitals_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          patient_id INT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          heart_rate INT,
          spo2 INT,
          temperature DECIMAL(4, 1),
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
      `;

            const createAlerts = `
        CREATE TABLE IF NOT EXISTS clinical_alerts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          patient_id INT,
          alert_type VARCHAR(50),
          severity ENUM('Low', 'Medium', 'High', 'Critical'),
          message TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
      `;

            connection.query(createPatients, (err) => {
                if (err) throw err;
                console.log('Patients table ready.');

                // Insert dummy patient if empty
                const dummyPatient = "INSERT IGNORE INTO patients (id, name, mrn, age, gender) VALUES (1, 'John Doe', 'MRN-001', 45, 'Male')";
                connection.query(dummyPatient, (err) => {
                    if (err) console.error('Error inserting dummy patient:', err);
                    else console.log('Dummy patient inserted.');
                });

                connection.query(createVitals, (err) => {
                    if (err) throw err;
                    console.log('Vitals table ready.');

                    connection.query(createAlerts, (err) => {
                        if (err) throw err;
                        console.log('Alerts table ready.');
                        connection.end();
                        process.exit(0);
                    });
                });
            });
        });
    });
});
