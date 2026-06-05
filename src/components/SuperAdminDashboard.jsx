import React, { useState, useEffect } from "react";
import { supabaseAdmin } from "../supabaseAdmin"; // Verify this path matches your folder structure!
import SchoolsTable from "./SchoolsTable";
import StaffTable from "./StaffTable";
import AddSchoolModal from "./AddSchoolModal";
import AddStaffModal from "./AddStaffModal";

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState([]);
  const [globalStaff, setGlobalStaff] = useState([]);

  // Modal States
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    // 1. Fetch schools WITH ordering (schools table has created_at)
    const { data: schoolsData, error: schoolsError } = await supabaseAdmin
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch staff WITHOUT ordering
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from("staff")
      .select(`*, schools (school_name)`);

    if (schoolsError)
      console.error("Schools fetch error:", schoolsError.message);
    if (staffError) console.error("Staff fetch error:", staffError.message);

    if (schoolsData) setSchools(schoolsData);
    if (staffData) setGlobalStaff(staffData);
  };

  return (
    <div className="fade-in space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-2xl shadow-lg text-white">
        <div>
          <h2 className="text-3xl font-bold text-teal-400">
            Ministry Overview (Super Admin)
          </h2>
          <p className="text-slate-400 mt-2">
            Manage all registered schools and global staff directory.
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors"
          >
            + Add System User
          </button>
          <button
            onClick={() => setIsSchoolModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors"
          >
            + Onboard New School
          </button>
        </div>
      </div>

      {/* COMPONENT UI SECTIONS */}
      <SchoolsTable schools={schools} />

      <StaffTable globalStaff={globalStaff} />

      {/* MODALS */}
      {isSchoolModalOpen && (
        <AddSchoolModal
          onClose={() => setIsSchoolModalOpen(false)}
          refreshData={fetchSystemData}
        />
      )}

      {isStaffModalOpen && (
        <AddStaffModal
          schools={schools}
          onClose={() => setIsStaffModalOpen(false)}
          refreshData={fetchSystemData}
        />
      )}
    </div>
  );
}
