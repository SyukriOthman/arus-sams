import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import AddAssetModal from "./AddAssetModal";
import EditAssetModal from "./EditAssetModal";
import AssetAnalytics from "./AssetAnalytics";
import { generateQrId, generateAndSaveQR, incrementQrCounter } from "../hooks/useAssets";

function SortButton({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 group"
    >
      <span className={`text-xs font-bold uppercase ${active ? 'text-teal-600' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className={`text-xs ${active ? 'text-teal-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </button>
  );
}

export default function AssetMasterList({ schoolId, userRole }) {
  const [assets, setAssets] = useState([]);
  const [locationPaths, setLocationPaths] = useState({});
  const [lastUsageMap, setLastUsageMap] = useState({}); // asset_id → usage_status
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [qrToast, setQrToast] = useState(null);
  const [generatingQrFor, setGeneratingQrFor] = useState(null);

  // Sort state
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const canEdit = userRole === "headmaster" || userRole === "asset_teacher";

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Sorted asset list
  const sortedAssets = useMemo(() => {
    if (!sortField) return assets;
    return [...assets].sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assets, sortField, sortDir]);

  const handleGenerateQR = async (assetId) => {
    setGeneratingQrFor(assetId);
    try {
      const { qrId, newNumber } = await generateQrId(supabase, schoolId);
      await generateAndSaveQR(supabase, assetId, qrId);
      await incrementQrCounter(supabase, schoolId, newNumber);
      setQrToast(`QR generated: ${qrId}`);
      setTimeout(() => setQrToast(null), 4000);
      fetchData();
    } catch (err) {
      alert("QR generation failed: " + err.message);
    } finally {
      setGeneratingQrFor(null);
    }
  };

  useEffect(() => {
    if (schoolId) fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAssets(), fetchLocationPaths()]);
    setLoading(false);
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAssets(data);
      fetchLastUsageStatus(data.map(a => a.asset_id));
    }
  };

  const fetchLastUsageStatus = async (assetIds) => {
    if (!assetIds.length) return;
    // Fetch all inspections for these assets, ordered newest first
    const { data } = await supabase
      .from("asset_inspection")
      .select("asset_id, usage_status, verified_at")
      .in("asset_id", assetIds)
      .order("verified_at", { ascending: false });

    if (!data) return;
    // Keep only the first (latest) record per asset
    const map = {};
    data.forEach(row => {
      if (!map[row.asset_id]) map[row.asset_id] = row.usage_status;
    });
    setLastUsageMap(map);
  };

  const fetchLocationPaths = async () => {
    const { data } = await supabase
      .from("locations")
      .select("location_id, location_name, parent_location_id")
      .eq("school_id", schoolId);

    if (!data) return;
    const map = {};
    data.forEach(loc => { map[loc.location_id] = loc; });
    const paths = {};
    data.forEach(loc => {
      const parts = [];
      let current = loc;
      while (current) {
        parts.unshift(current.location_name);
        current = current.parent_location_id ? map[current.parent_location_id] : null;
      }
      paths[loc.location_id] = parts.join(" › ");
    });
    setLocationPaths(paths);
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    if (!window.confirm(`Are you sure you want to permanently delete: ${assetName}?`)) return;
    const { error } = await supabase.from("assets").delete().eq("asset_id", assetId);
    if (error) {
      alert("Failed to delete asset: " + error.message);
    } else {
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-slate-500 font-bold p-8">Loading master list...</div>;
  }

  const colSpan = canEdit ? 7 : 6;

  return (
    <div className="fade-in space-y-6 relative">
      {qrToast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg animate-pulse">
          ✓ {qrToast}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 bg-white p-4 md:p-6 rounded-xl shadow-md border border-slate-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">📦 Asset Master List</h2>
          <p className="text-slate-500 text-sm mt-1">
            {canEdit
              ? "Manage and track all physical assets registered to this school."
              : "View all physical assets registered to this school."}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg font-bold shadow transition-colors text-sm"
          >
            + Register New Asset
          </button>
        )}
      </div>

      <AssetAnalytics assets={assets} title="📊 School Asset Health Overview" />

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SortButton label="Tag ID (QR)" field="qr_code_id" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton label="Asset Name" field="asset_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Usage</th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedAssets.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-8 text-center text-slate-500">
                    No assets found for this school.
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset) => {
                  const usage = lastUsageMap[asset.asset_id];
                  return (
                    <tr key={asset.asset_id} className="hover:bg-slate-50">
                      {/* QR ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {asset.qr_code_id
                          ? <span className="font-mono font-bold text-teal-600">{asset.qr_code_id}</span>
                          : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">No QR</span>
                        }
                      </td>

                      {/* Asset Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {asset.asset_name}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                          {asset.category || "Uncategorized"}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {locationPaths[asset.location_id] || "Unassigned"}
                      </td>

                      {/* Lifecycle Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.status === 'Active'           ? 'bg-green-100 text-green-800' :
                          asset.status === 'Under Maintenance'? 'bg-yellow-100 text-yellow-800' :
                          asset.status === 'Lost'             ? 'bg-orange-100 text-orange-800' :
                          asset.status === 'Disposed'         ? 'bg-red-100 text-red-800'
                                                              : 'bg-slate-100 text-slate-800'
                        }`}>
                          {asset.status || "Unknown"}
                        </span>
                      </td>

                      {/* Usage Status (from last audit) */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {usage ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            usage === 'In Use'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {usage}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Not audited</span>
                        )}
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!asset.qr_code_id && (
                              <button
                                onClick={() => handleGenerateQR(asset.asset_id)}
                                disabled={generatingQrFor === asset.asset_id}
                                className="text-xs px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                              >
                                {generatingQrFor === asset.asset_id ? '...' : 'Generate QR'}
                              </button>
                            )}
                            <button onClick={() => setEditingAsset(asset)} className="text-xl hover:scale-110 transition-transform" title="Edit">✏️</button>
                            <button onClick={() => handleDeleteAsset(asset.asset_id, asset.asset_name)} className="text-xl hover:scale-110 transition-transform" title="Delete">🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddAssetModal
          schoolId={schoolId}
          onClose={() => setIsAddModalOpen(false)}
          refreshData={fetchData}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          schoolId={schoolId}
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          refreshData={fetchData}
        />
      )}
    </div>
  );
}
