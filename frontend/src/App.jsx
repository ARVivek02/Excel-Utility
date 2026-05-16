import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css'; 
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SearchPanel from './components/SearchPanel';
import DataTable from './components/DataTable';

function App() {
  const [masterData, setMasterData] = useState(null);
  const [stagedData, setStagedData] = useState([]);
  const [isDone, setIsDone] = useState(false); 
  const [theme, setTheme] = useState('light'); 

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleDataParsed = (data) => {
    setMasterData(data);
    setStagedData([]);
    setIsDone(false);
  };

  // NEW LOGIC: Handles the 3 different set operations
  const handleProcessResults = (action, newResults) => {
    if (action === 'INITIAL_ADD' || action === 'OVERWRITE') {
      // Overwrite: Replaces everything with the new search
      const uniqueSet = new Set(newResults.map(row => JSON.stringify(row)));
      setStagedData(Array.from(uniqueSet).map(str => JSON.parse(str)));
      
    } else if (action === 'APPEND') {
      // Append: Adds new results to existing, filtering out duplicates
      setStagedData(prevData => {
        const combined = [...prevData, ...newResults];
        const uniqueSet = new Set(combined.map(row => JSON.stringify(row)));
        return Array.from(uniqueSet).map(str => JSON.parse(str));
      });
      
    } else if (action === 'RETAIN') {
      // Retain: Keeps ONLY the overlapping records (Intersection)
      setStagedData(prevData => {
        const prevSet = new Set(prevData.map(row => JSON.stringify(row)));
        const common = newResults.filter(row => prevSet.has(JSON.stringify(row)));
        const uniqueSet = new Set(common.map(row => JSON.stringify(row)));
        return Array.from(uniqueSet).map(str => JSON.parse(str));
      });
    }
  };

  const handleExportExcel = () => {
    if (stagedData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(stagedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Compiled Data");
    XLSX.writeFile(workbook, "Filtered_Records.xlsx");
  };

  return (
    <div className="app-layout">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="main-content">
        {!masterData ? (
          <div className="card" style={{ maxWidth: '800px', margin: '4rem auto' }}>
            <FileUpload onDataParsed={handleDataParsed} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="top-status-bar">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Master File Loaded: </span>
                <strong style={{ color: 'var(--text-main)' }}>{masterData.length} records</strong>
              </div>
              <button className="btn btn-outline" onClick={() => setMasterData(null)}>📁 Change File</button>
            </div>

            {!isDone ? (
              <>
                <SearchPanel 
                  masterData={masterData} 
                  stagedData={stagedData} // PASSING FULL STAGED DATA HERE
                  onProcessResults={handleProcessResults}
                  onDone={() => setIsDone(true)}
                />

                {stagedData.length > 0 && (
                  <div className="card">
                    <h3 style={{marginBottom: '1rem'}}>Current Temporary File ({stagedData.length} Unique Records)</h3>
                    <DataTable data={stagedData} />
                  </div>
                )}
              </>
            ) : (
              <div className="prompt-box alert-info" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '2rem' }}>
                <h2>🏁 FINAL RESULT</h2>
                <p>You have compiled <strong>{stagedData.length}</strong> unique records.</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleExportExcel} disabled={stagedData.length === 0}>
                    📥 DOWNLOAD EXCEL
                  </button>
                  <button className="btn btn-outline" onClick={() => setIsDone(false)}>
                    ⬅ Back to Search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;