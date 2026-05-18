import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const FileUpload = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file) => {
    setError('');
    
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload a .xlsx or .xls file.');
      return;
    }

    setIsLoading(true);

    // Helper function to process the workbook once successfully read
    const extractDataFromWorkbook = (workbook) => {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (jsonData.length === 0) {
        setError('The uploaded Excel file appears to be empty.');
        setIsLoading(false);
        return;
      }
      onDataParsed(jsonData);
    };

    // ATTEMPT 3: Raw UTF-8 Text (Catches XML Spreadsheet 2003 and HTML disguised as .xls)
    const attempt3Text = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'string' });
          extractDataFromWorkbook(workbook);
        } catch (err) {
          console.error("All 3 parsing attempts failed:", err);
          setError('Failed to read the file. The format is severely corrupted or strictly proprietary.');
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    };

    // ATTEMPT 2: Binary String (Catches some older legacy Excel formats)
    const attempt2Binary = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          extractDataFromWorkbook(workbook);
        } catch (err) {
          console.warn("Attempt 2 (Binary) failed. Trying Attempt 3 (Raw Text)...");
          attempt3Text();
        }
      };
      reader.readAsBinaryString(file);
    };

    // ATTEMPT 1: Standard ArrayBuffer (Best for standard .xlsx and standard .xls)
    const attempt1ArrayBuffer = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          extractDataFromWorkbook(workbook);
        } catch (err) {
          console.warn("Attempt 1 (ArrayBuffer) failed. Trying Attempt 2 (Binary String)...");
          attempt2Binary();
        }
      };
      reader.readAsArrayBuffer(file);
    };

    // Start the chain of attempts
    attempt1ArrayBuffer();
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
        Upload your master spreadsheet to begin searching. We automatically bypass "unsafe file" formatting errors using a 3-tier parsing engine.
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
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Parsing File & Bypassing Errors...</h3>
        ) : (
          <>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Drag & Drop your Excel file here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              or click to browse from your computer
            </p>
            <input 
              id="file-upload-input"
              type="file" 
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv" 
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