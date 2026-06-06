import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import SchoolProfile from "./components/SchoolProfile";
import UserProfile from "./components/UserProfile";
import LocationManager from "./pages/LocationManager";
import AssetMasterList from "./components/AssetMasterList";
import AssetRegistration from "./pages/AssetRegistration";

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userSchoolId, setUserSchoolId] = useState(null);
  const [currentTab, setCurrentTab] = useState("mobile-audit");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isCritical, setIsCritical] = useState(false);
  const [scannedAssetId, setScannedAssetId] = useState("");
  const [auditStatus, setAuditStatus] = useState("Good");

  useEffect(() => {
    const savedSession = localStorage.getItem("demo_session");
    if (savedSession) {
      handleDemoLogin(JSON.parse(savedSession));
    }

    const telemetryChannel = supabase
      .channel("public:hydro_telemetry")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "hydro_telemetry" },
        (payload) => setIsCritical(payload.new.is_critical_alert),
      )
      .subscribe();

    return () => supabase.removeChannel(telemetryChannel);
  }, []);

  const handleDemoLogin = (userData) => {
    setSession(userData);
    localStorage.setItem("demo_session", JSON.stringify(userData));

    const roleStr = userData.role.toLowerCase().trim();
    setUserRole(roleStr);
    setUserSchoolId(userData.school_id);

    if (roleStr === "superadmin") setCurrentTab("super-dashboard");
    else if (roleStr === "headmaster") setCurrentTab("admin-management");
    else setCurrentTab("mobile-audit");
  };

  const navigate = (tab) => {
    setCurrentTab(tab);
    setSidebarOpen(false);
  };

  const handleSignOut = () => {
    setSession(null);
    setUserRole(null);
    setUserSchoolId(null);
    localStorage.removeItem("demo_session");
  };

  const handleSessionUpdate = (updatedFields) => {
    const updatedSession = { ...session, ...updatedFields };
    setSession(updatedSession);
    localStorage.setItem("demo_session", JSON.stringify(updatedSession));
  };

  const toggleFloodSimulation = async (statusValue) => {
    await supabase
      .from("hydro_telemetry")
      .update({
        is_critical_alert: statusValue,
        live_water_level_meters: statusValue ? 5.35 : 1.1,
      })
      .eq("id", 1);
  };

  const handleAssetAuditSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("asset_inspections").insert([
      {
        asset_id: scannedAssetId.toUpperCase(),
        inspection_status: auditStatus,
        updated_at: new Date().toISOString(),
      },
    ]);
    if (!error) {
      alert(`Audit logged for ${scannedAssetId.toUpperCase()}!`);
      setScannedAssetId("");
    }
  };

  if (!session) return <Auth onDemoLogin={handleDemoLogin} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans relative overflow-hidden">
      {isCritical && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-3 font-bold animate-pulse z-50 shadow-md">
          ⚠️ CRITICAL ALERTS: LIVE iHYDRO TELEMENTRY BREACH AT BATU KAWA.
          PRIORITIZED EVACUATION ROUTINE ENGAGED!
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 flex flex-col justify-between shadow-2xl z-30 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-teal-400">
                Arus-SAMS
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => navigate("my-profile")}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left ${currentTab === "my-profile" ? "bg-slate-800 border-teal-500 shadow-md" : "bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600"}`}
              title="View My Profile"
            >
              {session.profile_pic ? (
                <img
                  src={session.profile_pic}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-slate-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold border border-teal-500 shadow-inner">
                  {session.full_name ? session.full_name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-white truncate">{session.full_name}</p>
                <p className="text-xs text-teal-400 capitalize truncate">{session.role.replace("_", " ")}</p>
              </div>
            </button>
          </div>

          <div className="space-y-1">
            <button onClick={() => navigate("locations")}
              className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "locations" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
              📐 Location Manager
            </button>
            <button onClick={() => navigate("mobile-audit")}
              className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "mobile-audit" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
              📱 Mobile QR Audit Input
            </button>
            <button onClick={() => navigate("hydrological-simulator")}
              className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "hydrological-simulator" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
              ⚙️ iHYDRO Simulation Panel
            </button>
            {userRole !== "superadmin" && (
              <button onClick={() => navigate("school")}
                className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "school" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
                🏫 School Profile
              </button>
            )}
            {userRole === "headmaster" && (
              <button onClick={() => navigate("admin-management")}
                className={`block w-full text-left px-4 py-3 rounded transition-colors border-t border-slate-800 mt-4 pt-4 ${currentTab === "admin-management" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
                👥 Manage School Staff
              </button>
            )}
            {userRole !== "superadmin" && (
              <button onClick={() => navigate("asset-master-list")}
                className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "asset-master-list" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
                📦 Master Asset List
              </button>
            )}
            {userRole !== "standard_teacher" && userRole !== "superadmin" && (
              <button onClick={() => navigate("asset-registration")}
                className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "asset-registration" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
                ✏️ Asset Registration
              </button>
            )}
            {userRole === "superadmin" && (
              <button onClick={() => navigate("super-dashboard")}
                className={`block w-full text-left px-4 py-3 rounded transition-colors ${currentTab === "super-dashboard" ? "bg-teal-600 font-medium" : "hover:bg-slate-800 text-slate-300"}`}>
                👑 Ministry Portal
              </button>
            )}
          </div>
        </div>

        <button onClick={handleSignOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded transition-colors shadow">
          🚪 Sign Out
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-slate-900 text-white px-4 py-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl leading-none">
            ☰
          </button>
          <span className="font-bold text-teal-400 text-lg">Arus-SAMS</span>
        </div>

        <div className="p-4 md:p-10 pt-4 md:pt-16">
        {currentTab === "my-profile" && (
          <UserProfile
            session={session}
            onSessionUpdate={handleSessionUpdate}
          />
        )}

        {userRole === "superadmin" && currentTab === "super-dashboard" && (
          <SuperAdminDashboard />
        )}

        {userRole === "headmaster" && currentTab === "admin-management" && (
          <AdminDashboard schoolId={userSchoolId} onNavigate={setCurrentTab} />
        )}

        {currentTab === "school" && (
          <SchoolProfile school_id={userSchoolId} userRole={userRole} />
        )}

        {currentTab === "asset-master-list" && (
          <AssetMasterList schoolId={userSchoolId} userRole={userRole} />
        )}

        {currentTab === "locations" && (
          <LocationManager user={session} schoolId={userSchoolId} />
        )}

        {currentTab === "asset-registration" && (
          <AssetRegistration user={session} schoolId={userSchoolId} userRole={userRole} />
        )}

        {currentTab === "mobile-audit" && (
          <div className="max-w-md mx-auto mt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Field Audit Operations
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-teal-500 space-y-6">
              <form onSubmit={handleAssetAuditSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="SCANNED QR DATA KEY STRING"
                  value={scannedAssetId}
                  onChange={(e) => setScannedAssetId(e.target.value)}
                  className="border p-3 w-full rounded font-mono uppercase tracking-widest"
                  required
                />
                <select
                  value={auditStatus}
                  onChange={(e) => setAuditStatus(e.target.value)}
                  className="border p-3 w-full rounded font-medium bg-slate-50"
                >
                  <option value="Good">
                    🟢 Operational Verification (Good)
                  </option>
                  <option value="Damaged">
                    🟡 Infrastructure Faulty (Damaged)
                  </option>
                  <option value="Submerged">
                    🔴 Inundation Critical (Submerged)
                  </option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800"
                >
                  Transmit Condition
                </button>
              </form>
            </div>
          </div>
        )}

        {currentTab === "hydrological-simulator" && (
          <div className="max-w-xl mx-auto mt-6 bg-white p-8 rounded-xl shadow border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              iHYDRO Regional Telemetry Simulator
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => toggleFloodSimulation(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                🚨 Fire Torrential Surge Trigger
              </button>
              <button
                onClick={() => toggleFloodSimulation(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                ✅ Restore Stream Equilibrium
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;
