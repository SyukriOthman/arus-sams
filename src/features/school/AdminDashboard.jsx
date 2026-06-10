import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import AdminStaffTable from "./AdminStaffTable";
import AdminAddStaffForm from "./AdminAddStaffForm";
import AdminEditStaffForm from "./AdminEditStaffForm";

const AdminDashboard = ({ schoolId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState("manage"); 
  const [staffList, setStaffList] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);

  useEffect(() => {
    if (schoolId) fetchSchoolName();
    if (activeTab === "manage") fetchStaffList();
  }, [schoolId, activeTab]);

  const fetchSchoolName = async () => {
    if (!schoolId) return;
    const { data, error } = await supabase
      .from("schools")
      .select("school_name")
      .eq("school_id", schoolId)
      .single();
    if (!error && data) setSchoolName(data.school_name);
  };

  const fetchStaffList = async () => {
    if (!schoolId) return;
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("school_id", schoolId)
      .order("full_name", { ascending: true });
    if (!error && data) setStaffList(data);
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${staffName}'s access profile?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from("staff").delete().eq("id", staffId);
    if (error) {
      alert("Failed to delete staff: " + error.message);
    } else {
      fetchStaffList(); 
    }
  };

  const triggerEditMode = (staff) => {
    setEditingStaff(staff);
    setActiveTab("edit");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between w-full">
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-2.5 rounded-md font-bold text-sm transition-colors ${activeTab === "manage" ? "bg-teal-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}
          >
            📋 Master Staff List
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-6 py-2.5 rounded-md font-bold text-sm transition-colors ${activeTab === "register" ? "bg-teal-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}
          >
            ➕ Register New Staff
          </button>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("locations")}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-lg font-bold text-sm transition-colors"
          >
            📐 Location Manager →
          </button>
        )}
      </div>

      {/* COMPONENTS RENDERING */}
      {activeTab === "manage" && (
        <AdminStaffTable 
          staffList={staffList} 
          schoolName={schoolName} 
          onEdit={triggerEditMode} 
          onDelete={handleDeleteStaff} 
        />
      )}

      {activeTab === "register" && (
        <AdminAddStaffForm 
          schoolId={schoolId} 
          onSuccess={() => setActiveTab("manage")} 
        />
      )}

      {activeTab === "edit" && editingStaff && (
        <AdminEditStaffForm 
          staff={editingStaff} 
          onSuccess={() => setActiveTab("manage")} 
          onCancel={() => setActiveTab("manage")} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;