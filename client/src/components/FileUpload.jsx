import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const FileUpload = ({ patientId, onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMsg("Reading file...");

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                setMsg(`Uploading ${data.length} records...`);

                // Send to Backend
                axios.post('/api/vitals/upload', {
                    patientId: patientId,
                    data: data
                })
                    .then(res => {
                        setMsg(`Success! ${res.data.count || 0} records imported.`);
                        setUploading(false);
                        if (onUploadComplete) onUploadComplete();
                    })
                    .catch(err => {
                        console.error(err);
                        setMsg("Error uploading data.");
                        setUploading(false);
                    });

            } catch (error) {
                console.error(error);
                setMsg("Error parsing Excel.");
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div>
            <input type="file" accept=".xlsx" onChange={handleFileUpload} disabled={uploading} />
            <span>{msg}</span>
        </div>
    );
};

export default FileUpload;
