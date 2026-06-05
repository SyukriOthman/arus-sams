import React from "react";

export default function AssetAnalytics({ assets, title = "📊 Asset Intelligence" }) {
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
        <p className="text-slate-500 font-medium">No asset data available yet.</p>
      </div>
    );
  }

  // Calculate high-level stats
  const totalAssets = assets.length;
  const goodAssets = assets.filter((a) => a.status === "Good").length;
  const damagedAssets = assets.filter((a) => a.status === "Damaged").length;
  const submergedAssets = assets.filter((a) => a.status === "Submerged").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">
          {title}
        </h3>
      </div>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-4 gap-6">
        {/* Total Assets */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col justify-center items-center">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assets</p>
          <p className="text-4xl font-black text-slate-800">{totalAssets}</p>
        </div>

        {/* Operational */}
        <div className="bg-white rounded-xl shadow-md border-b-4 border-b-green-500 p-6 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl">🟢</div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Operational</p>
          <p className="text-4xl font-black text-green-600">{goodAssets}</p>
        </div>

        {/* Damaged */}
        <div className="bg-white rounded-xl shadow-md border-b-4 border-b-yellow-500 p-6 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl">🟡</div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Damaged</p>
          <p className="text-4xl font-black text-yellow-600">{damagedAssets}</p>
        </div>

        {/* Submerged / Critical */}
        <div className="bg-white rounded-xl shadow-md border-b-4 border-b-red-500 p-6 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl">🚨</div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Inundation Critical</p>
          <p className="text-4xl font-black text-red-600">{submergedAssets}</p>
        </div>
      </div>
    </div>
  );
}