import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function AddAssetModal({ schoolId, onClose, refreshData }) {
  const [locations, setLocations] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("Good");
  const [loading, setLoading] = useState(false);

  // Fetch locations so the user can assign the asset to a specific room/area
  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("locations")
        .select("location_id, location_name") // Adjust column names to match your DB
        .eq("school_id", schoolId);
      if (data) setLocations(data);
    };
    fetchLocations();
  }, [schoolId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("assets").insert([
      {
        asset_id: assetId.toUpperCase(), // Best practice to keep QR IDs uppercase
        asset_name: assetName,
        category: category,
        location_id: parseInt(locationId),
        status: status,
        school_id: schoolId, // Assuming assets are tied to schools
      },
    ]);

    if (error) {
      alert("Error adding asset: " + error.message);
      setLoading(false);
    } else {
      refreshData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2 border-teal-500">
          ➕ Register New Asset
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">Asset Tag ID (QR String)</label>
            <input type="text" required value={assetId} onChange={(e) => setAssetId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md uppercase font-mono" placeholder="e.g. AST-001" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Asset Name</label>
            <input type="text" required value={assetName} onChange={(e) => setAssetName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g. Dell Optiplex 7090" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Network Equipment">Network Equipment</option>
              <option value="Lab Equipment">Lab Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Location / Room</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md bg-white" required>
              <option value="" disabled>-- Select a Location --</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
              <option value="Good">Good (Operational)</option>
              <option value="Damaged">Damaged (Faulty)</option>
              <option value="Submerged">Submerged (Critical)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 rounded-md text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">
              {loading ? "Saving..." : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}