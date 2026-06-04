import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const AdminDashboard = ({ schoolId }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState('standard_teacher');
  const [icNumber, setIcNumber] = useState('');
  const [phoneNo, setPhoneNo] = useState('');

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    
    // 1. DATA SANITIZATION
    const cleanIcNumber = icNumber.replace(/-/g, '');
    
    // 2. VERIFICATION CHECK: Query database to see if IC already exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('ic_number')
      .eq('ic_number', cleanIcNumber);

    if (checkError) {
      alert("Verification Error: " + checkError.message);
      return; // Stop execution
    }

    // If the array has any results, the IC is already in use!
    if (existingStaff && existingStaff.length > 0) {
      alert("Registration Failed: A staff member with this IC Number (" + cleanIcNumber + ") already exists in the system.");
      return; // Stop the registration from happening
    }

    // 3. SAFE INSERT: If we reach this line, the IC is unique!
    const { error: insertError } = await supabase
      .from('staff')
      .insert([{
        full_name: fullName,
        email: email,               
        stored_password: password,  
        role: role,                 
        ic_number: cleanIcNumber,   
        phone_no: phoneNo,          
        school_id: schoolId         
      }]);

    if (insertError) {
      alert("Database Error: " + insertError.message);
    } else {
      alert("Comprehensive Staff Profile Registered Successfully!");
      setFullName(''); 
      setEmail('');
      setPassword(''); 
      setIcNumber('');
      setPhoneNo('');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200 fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Register School Staff Profile</h2>
      <p className="text-sm text-slate-500 mb-6">Complete personnel provisioning for the institutional tenant.</p>
      
      <form onSubmit={handleRegisterStaff} className="space-y-4">
        
        {/* ROW 1: Name and Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <input type="text" placeholder="e.g. Cikgu Ahmad" value={fullName} onChange={e => setFullName(e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Workspace Scope</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="border p-2 w-full rounded bg-slate-50 font-medium text-slate-700">
              <option value="standard_teacher">Standard Classroom Teacher</option>
              <option value="asset_teacher">Authorized Asset Field Teacher</option>
            </select>
          </div>
        </div>

        {/* ROW 2: Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Email</label>
            <input type="email" placeholder="ahmad@school.edu.my" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
            <input type="tel" placeholder="012-3456789" value={phoneNo} onChange={e => setPhoneNo(e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-500" required />
          </div>
        </div>

        {/* ROW 3: Identity */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IC Number</label>
          <input type="text" placeholder="04081313XXXX" value={icNumber} onChange={e => setIcNumber(e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-500" required />
          <p className="text-[10px] text-slate-400 mt-1">Hyphens will be automatically stripped before database storage.</p>
        </div>
        
        {/* ROW 4: Demo Authentication */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-red-500">Temporary System Password</label>
          <input type="text" placeholder="Assign initial login password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-red-400 bg-red-50 placeholder-red-300" required />
          <p className="text-[10px] text-slate-400 mt-1">* This is a temporary access token for the prototype demonstration.</p>
        </div>

        <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-700 transition-colors mt-6">
          Provision Complete Staff Identity
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;