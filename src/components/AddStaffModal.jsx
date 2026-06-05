import React, { useState } from "react";
import { supabaseAdmin } from "../supabaseAdmin"; // Make sure this path is correct

export default function AddStaffModal({ schools, onClose, refreshData }) {
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffFormError, setStaffFormError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newIcNumber, setNewIcNumber] = useState("");
  const [newRole, setNewRole] = useState("admin"); 
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffFormError("");

    if (!selectedSchoolId && newRole !== "super-admin") {
      setStaffFormError("You must select a school for this user role.");
      return;
    }

    const icRegex = /^\d{12}$/;
    if (!icRegex.test(newIcNumber)) {
      setStaffFormError("IC Number must be exactly 12 digits without dashes.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 15) {
      setStaffFormError("Password must be between 8 and 15 characters.");
      return;
    }

    setStaffLoading(true);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });

    if (authError) {
      setStaffFormError("Registration Error: " + authError.message);
      setStaffLoading(false);
      return;
    }

    const newUserId = authData.user.id;

    setTimeout(async () => {
      const { error: updateError } = await supabaseAdmin
        .from("staff")
        .update({
          full_name: newFullName,
          ic_number: newIcNumber,
          role: newRole,
          stored_password: newPassword,
          school_id: newRole === "super-admin" ? null : selectedSchoolId,
        })
        .eq("id", newUserId);

      if (updateError) {
        alert("Account created, but failed to save profile details: " + updateError.message);
      }

      refreshData();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Create System User</h3>

        {staffFormError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold">
            {staffFormError}
          </div>
        )}

        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">Full Name</label>
            <input type="text" required value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g. Ahmad bin Ali" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">IC Number</label>
            <input type="text" required value={newIcNumber} onChange={(e) => setNewIcNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g. 040813130993" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">System Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
              <option value="admin">Headmaster (School Admin)</option>
              <option value="teacher">Standard Teacher</option>
              <option value="asset-teacher">Asset Management Teacher</option>
              <option value="super-admin">Ministry (Super Admin)</option>
            </select>
          </div>

          {newRole !== "super-admin" && (
            <div>
              <label className="block text-sm font-bold text-teal-700">Assign to School</label>
              <select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-teal-500 rounded-md bg-teal-50 shadow-sm" required>
                <option value="" disabled>-- Select a School --</option>
                {schools.map((school) => (
                  <option key={school.school_id} value={school.school_id}>
                    {school.school_name} ({school.school_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 mt-4">
            <label className="block text-sm font-bold text-slate-700">Login Email</label>
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Temporary Password</label>
            <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="8-15 characters" />
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={staffLoading} className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
              {staffLoading ? "Creating..." : "Register User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}