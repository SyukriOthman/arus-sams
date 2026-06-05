import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; 
import AddAssetModal from "./AddAssetModal";
import EditAssetModal from "./EditAssetModal";
import AssetAnalytics from "./AssetAnalytics"; // <--- 1. Import it here!

export default function AssetMasterList({ schoolId, userRole }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Check if the user has permission to edit/delete
  const canEdit = userRole === "headmaster" || userRole === "asset-teacher";

  useEffect(() => {
    if (schoolId) {
      fetchAssets();
    }
  }, [schoolId]);

  const fetchAssets = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        locations (
          location_name
        )
      `)
      .eq("school_id", schoolId) 
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", error);
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the asset: ${assetName}?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from("assets").delete().eq("asset_id", assetId);

    if (error) {
      alert("Failed to delete asset. Error: " + error.message);
    } else {
      fetchAssets(); 
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset); 
  };

  if (loading) {
    return <div className="text-slate-500 font-bold p-8">Loading master list...</div>;
  }

  return (
    <div className="fade-in space-y-6 relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            📦 Asset Master List
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {canEdit 
              ? "Manage and track all physical assets registered to this school." 
              : "View all physical assets registered to this school."}
          </p>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-bold shadow transition-colors"
          >
            + Register New Asset
          </button>
        )}
      </div>

      {/* 2. RENDER THE ANALYTICS COMPONENT HERE */}
      <AssetAnalytics 
        assets={assets} 
        title="📊 School Asset Health Overview" 
      />

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tag ID (QR)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? "6" : "5"} className="px-6 py-8 text-center text-slate-500">
                    No assets found for this school.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-teal-700">
                      {asset.asset_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {asset.asset_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                        {asset.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                      {asset.locations?.location_name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${asset.status === 'Good' ? 'bg-green-100 text-green-800' : 
                          asset.status === 'Damaged' ? 'bg-yellow-100 text-yellow-800' : 
                          asset.status === 'Submerged' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                        {asset.status || "Unknown"}
                      </span>
                    </td>
                    
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button onClick={() => handleEditAsset(asset)} className="text-xl hover:scale-110 transition-transform" title="Edit Asset">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteAsset(asset.asset_id, asset.asset_name)} className="text-xl hover:scale-110 transition-transform" title="Delete Asset">
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENDER MODALS */}
      {isAddModalOpen && (
        <AddAssetModal 
          schoolId={schoolId} 
          onClose={() => setIsAddModalOpen(false)} 
          refreshData={fetchAssets} 
        />
      )}

      {editingAsset && (
        <EditAssetModal 
          schoolId={schoolId} 
          asset={editingAsset} 
          onClose={() => setEditingAsset(null)} 
          refreshData={fetchAssets} 
        />
      )}
    </div>
  );
}