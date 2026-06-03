import React, { useState } from 'react';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 bg-slate-900 text-white p-6 shadow-xl z-10">
        <h1 className="text-2xl font-bold text-teal-400 mb-8 border-b border-slate-700 pb-4">Arus-SAMS</h1>
        <div className="space-y-3">
          <button onClick={() => setCurrentTab('dashboard')} className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === 'dashboard' ? 'bg-teal-600' : 'hover:bg-slate-800'}`}>🖥️ Admin Dashboard</button>
          <button onClick={() => setCurrentTab('mobile-audit')} className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === 'mobile-audit' ? 'bg-teal-600' : 'hover:bg-slate-800'}`}>📱 Mobile QR Audit</button>
          <button onClick={() => setCurrentTab('simulator')} className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === 'simulator' ? 'bg-teal-600' : 'hover:bg-slate-800'}`}>⚙️ iHYDRO Simulator</button>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 p-10 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <div className="fade-in">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Location & Elevation Registry</h2>
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
               <p className="text-slate-500">Feature 1: Admin Data Table and Input Form goes here.</p>
            </div>
          </div>
        )}

        {currentTab === 'mobile-audit' && (
          <div className="max-w-md mx-auto fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Field Asset Scan</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-500">
              <p className="text-slate-500 text-center">Feature 3: QR Scanner and Condition Update Form goes here.</p>
            </div>
          </div>
        )}

        {currentTab === 'simulator' && (
          <div className="fade-in">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Telemetry Override</h2>
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200 border-l-4 border-red-500">
               <p className="text-slate-500">Feature 2: Water level slider goes here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;