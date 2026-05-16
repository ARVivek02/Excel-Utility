import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const FileUpload = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Core logic to read both .xls and .xlsx
  const processFile = (file) => {
    setError('');
    
    // Check if it's a valid Excel format
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload a .xlsx or .xls file.');
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        
        // This single line reads BOTH .xls and .xlsx perfectly into memory
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert the sheet into a JSON array for our app to use
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          setError('The uploaded Excel file appears to be empty.');
          setIsLoading(false);
          return;
        }

        onDataParsed(jsonData);
      } catch (err) {
        console.error("Excel parsing error:", err);
        setError('Failed to read the file. It might be corrupted.');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('A browser error occurred while reading the file.');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 className="card-title" style={{ textAlign: 'left', borderBottom: 'none' }}>
        📂 Load Master Data
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'left' }}>
        Upload your master spreadsheet to begin searching. We automatically convert legacy .xls files to modern formats in memory.
      </p>

      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input').click()}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          {isLoading ? '⏳' : '📊'}
        </div>
        
        {isLoading ? (
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Parsing File...</h3>
        ) : (
          <>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Drag & Drop your Excel file here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              or click to browse from your computer
            </p>
            {/* Explicitly accepting both extensions here */}
            <input 
              id="file-upload-input"
              type="file" 
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              style={{ display: 'none' }} 
              onChange={handleFileInput}
            />
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: '600' }}>.XLSX</span>
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: '600' }}>.XLS</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444' }}>
          <strong>Error: </strong> {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;