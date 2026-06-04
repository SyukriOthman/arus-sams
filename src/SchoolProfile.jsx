import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const SchoolProfile = ({ school_id }) => {
  // Initial state now uses contact_no
  const [school, setSchool] = useState({ school_name: '', address: '', contact_no: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (school_id) fetchSchoolData();
    else setLoading(false);
  }, [school_id]);

  const fetchSchoolData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('school_id', school_id)
      .single();

    if (error) {
      console.error("Supabase Fetch Error:", error.message);
    } else if (data) {
      // Map the database response to your state
      setSchool({
        school_name: data.school_name || '',
        address: data.address || '',
        contact_no: data.contact_no || ''
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Ensure these keys match your exact database column names
    const { error } = await supabase
      .from('schools')
      .update({
        school_name: school.school_name,
        address: school.address,
        contact_no: school.contact_no
      })
      .eq('school_id', school_id);

    if (error) {
      alert("Update Failed: " + error.message);
      console.error("Update Error:", error);
    } else {
      alert("School Profile Updated Successfully!");
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading profile data...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border border-slate-200 fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit School Information</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Name</label>
          <input 
            type="text" 
            value={school.school_name} 
            onChange={e => setSchool({...school, school_name: e.target.value})} 
            className="border p-2 w-full rounded" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Address</label>
          <textarea 
            value={school.address || ''} 
            onChange={e => setSchool({...school, address: e.target.value})} 
            className="border p-2 w-full rounded h-24" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Number</label>
          <input 
            type="text" 
            value={school.contact_no || ''} 
            onChange={e => setSchool({...school, contact_no: e.target.value})} 
            className="border p-2 w-full rounded" 
          />
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 mt-6">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default SchoolProfile;