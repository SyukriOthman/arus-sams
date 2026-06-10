import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // Two folders up!

export default function MinistryOverview() {
  const [stats, setStats] = useState({ schools: 0, staff: 0, assets: 0 });
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistryData();
  }, []);

  const fetchMinistryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch High-Level Counts for the KPIs
      const { count: schoolCount } = await supabase.from("schools").select("*", { count: "exact", head: true });
      const { count: staffCount } = await supabase.from("staff").select("*", { count: "exact", head: true });
      const { count: assetCount } = await supabase.from("assets").select("*", { count: "exact", head: true });

      setStats({
        schools: schoolCount || 0,
        staff: staffCount || 0,
        assets: assetCount || 0,
      });

      // 2. Fetch Active Flood Alerts (Warning or Danger)
      // Grabs the latest telemetry that isn't 'normal'
      const { data: alertsData, error: alertsError } = await supabase
        .from("water_data")
        .select(`
          water_level,
          status,
          recorded_at,
          stations (
            station_name,
            school_station (
              schools (school_name, contact_no)
            )
          )
        `)
        .in("status", ["warning", "danger", "alert"])
        .order("recorded_at", { ascending: false })
        .limit(5);

      if (!alertsError && alertsData) {
        // Flatten the nested database relationship so it's easy to render
        const formattedAlerts = alertsData.map(alert => {
          const school = alert.stations?.school_station?.[0]?.schools;
          return {
            id: alert.recorded_at,
            schoolName: school ? school.school_name : "Unmapped Station",
            contact: school ? school.contact_no : "N/A",
            stationName: alert.stations?.station_name,
            level: alert.water_level,
            status: alert.status,
            time: new Date(alert.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
        });
        setActiveAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading Global Ministry Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      
      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-2xl">🏫</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Schools</p>
            <p className="text-3xl font-black text-slate-800">{stats.schools}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 text-2xl">👥</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">System Users</p>
            <p className="text-3xl font-black text-slate-800">{stats.staff}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-2xl">💻</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tracked Assets</p>
            <p className="text-3xl font-black text-slate-800">{stats.assets}</p>
          </div>
        </div>
      </div>

      {/* ACTIVE FLOOD ALERTS PANEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🚨 Active iHYDRO Flood Watch
          </h3>
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {activeAlerts.length} Active Alerts
          </span>
        </div>
        
        <div className="p-0">
          {activeAlerts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50">
              <span className="text-5xl block mb-4">☀️</span>
              <p className="text-slate-800 text-lg font-bold">All Clear</p>
              <p className="text-sm text-slate-500 mt-1">No schools are currently reporting elevated telemetry levels.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeAlerts.map((alert, idx) => (
                <div key={idx} className={`p-5 flex justify-between items-center ${alert.status === 'danger' ? 'bg-red-50' : 'bg-orange-50'}`}>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{alert.schoolName}</h4>
                    <p className="text-sm text-slate-600 flex gap-4 mt-2">
                      <span className="flex items-center gap-1">📍 {alert.stationName}</span>
                      <span className="flex items-center gap-1">📞 {alert.contact}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black ${alert.status === 'danger' ? 'text-red-700' : 'text-orange-600'}`}>
                      {alert.level}m
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                      Status: {alert.status} • {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}