import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onDemoLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Look inside your custom 'staff' table for the matching email and password
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('stored_password', password)
      .single();

    setLoading(false);

    if (error || !data) {
      alert('Invalid Email or Password. Please check with your Headmaster.');
    } else {
      // Success! Send the user's data to the main App
      onDemoLogin(data);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-teal-500 fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Arus-SAMS</h1>
          <p className="text-sm text-slate-500 mt-2">Staff Access Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Institutional Email</label>
            <input 
              type="email" 
              placeholder="e.g. teacher@school.edu.my" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Access Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-700 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}