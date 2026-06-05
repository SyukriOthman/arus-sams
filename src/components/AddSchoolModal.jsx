import React, { useState } from "react";
import { supabaseAdmin } from "../supabaseAdmin"; // Make sure this path is correct based on your folder structure

export default function AddSchoolModal({ onClose, refreshData }) {
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newPostcode, setNewPostcode] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [newContact, setNewContact] = useState("");

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    const { error } = await supabaseAdmin.from("schools").insert([
      {
        school_code: newSchoolCode,
        school_name: newSchoolName,
        address_line: newAddressLine,
        postcode: newPostcode,
        city: newCity,
        state: newState,
        latitude: parseFloat(newLatitude) || null,
        longitude: parseFloat(newLongitude) || null,
        contact_no: newContact,
      },
    ]);

    if (error) {
      alert("Error creating school: " + error.message);
    } else {
      refreshData(); // Tell the parent to re-fetch the database
      onClose();     // Close the modal
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">
          Onboard New School
        </h3>
        <form onSubmit={handleCreateSchool} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">School Code</label>
              <input type="text" required value={newSchoolCode} onChange={(e) => setNewSchoolCode(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. YBA1346" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Contact Number</label>
              <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. 082-123456" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700">School Name</label>
            <input type="text" required value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. SK Rantau Panjang" />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-700">Address Line 1</label>
            <input type="text" required value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. 1331, Lor Stutong 13E, Tabuan Jaya Baru 1" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">Postcode</label>
              <input type="text" required value={newPostcode} onChange={(e) => setNewPostcode(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="93350" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">City</label>
              <input type="text" required value={newCity} onChange={(e) => setNewCity(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Kuching" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">State</label>
              <input type="text" required value={newState} onChange={(e) => setNewState(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Sarawak" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4">
            <div className="col-span-2 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">iHYDRO Flood Telemetry Coordinates</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Latitude</label>
              <input type="number" step="any" value={newLatitude} onChange={(e) => setNewLatitude(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white" placeholder="e.g. 1.5333" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Longitude</label>
              <input type="number" step="any" value={newLongitude} onChange={(e) => setNewLongitude(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white" placeholder="e.g. 110.3833" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 rounded-md text-sm font-bold text-white hover:bg-teal-700">Register School</button>
          </div>
        </form>
      </div>
    </div>
  );
}