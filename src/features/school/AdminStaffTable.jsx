import React from "react";

export default function AdminStaffTable({ staffList, schoolName, onEdit, onDelete }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow border border-slate-200 fade-in">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        {schoolName ? `${schoolName} Master Staff List` : "Loading Master Staff List..."}
      </h2>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Profile</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Staff Details</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Role Scope</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {staffList.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">
                  No staff members provisioned.
                </td>
              </tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 align-middle">
                    {staff.profile_pic ? (
                      <img src={staff.profile_pic} alt={staff.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-500 font-bold">
                        {staff.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    <p className="font-bold text-slate-800">{staff.full_name}</p>
                    <p className="text-slate-500 text-xs mt-1">{staff.email} | {staff.phone_no}</p>
                    <p className="font-mono text-slate-400 text-[10px] mt-1">IC: {staff.ic_number}</p>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${staff.role === "asset_teacher" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
                      {staff.role === "asset_teacher" ? "Asset Field Ops" : "Classroom Standard"}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right space-x-3">
                    <button onClick={() => onEdit(staff)} className="text-xl hover:scale-110 transition-transform" title="Edit Profile">✏️</button>
                    <button onClick={() => onDelete(staff.id, staff.full_name)} className="text-xl hover:scale-110 transition-transform" title="Delete Profile">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}