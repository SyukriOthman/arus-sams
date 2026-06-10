import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import SchoolFloodDashboard from "../features/telemetry/SchoolFloodDashboard";

const MALAYSIA_STATES = [
  { state: "Johor", ptj: "JPNJ" },
  { state: "Kedah", ptj: "JPNKD" },
  { state: "Kelantan", ptj: "JPNK" },
  { state: "Melaka", ptj: "JPNM" },
  { state: "Negeri Sembilan", ptj: "JPNNS" },
  { state: "Pahang", ptj: "JPNPH" },
  { state: "Perak", ptj: "JPNPK" },
  { state: "Perlis", ptj: "JPNPLS" },
  { state: "Pulau Pinang", ptj: "JPNPP" },
  { state: "Sabah", ptj: "JPNSB" },
  { state: "Sarawak", ptj: "JPNSAR" },
  { state: "Selangor", ptj: "JPNSEL" },
  { state: "Terengganu", ptj: "JPNT" },
  { state: "W.P. Kuala Lumpur", ptj: "JPNWPKL" },
  { state: "W.P. Labuan", ptj: "JPNWPL" },
  { state: "W.P. Putrajaya", ptj: "JPNWPP" },
];

const SchoolProfile = ({ school_id, userRole }) => {
  const [school, setSchool] = useState({
    school_code: "",
    school_name: "",
    address_line: "",
    postcode: "",
    city: "",
    state: "",
    ptj_code: "",
    latitude: "",
    longitude: "",
    contact_no: "",
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = userRole === "superadmin" || userRole === "headmaster";

  useEffect(() => {
    if (school_id) fetchSchoolData();
    else setLoading(false);
  }, [school_id]);

  const fetchSchoolData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("school_id", school_id)
      .single();

    if (error) {
      console.error("Supabase Fetch Error:", error.message);
    } else if (data) {
      setSchool({
        school_code: data.school_code || "",
        school_name: data.school_name || "",
        address_line: data.address_line || "",
        postcode: data.postcode || "",
        city: data.city || "",
        state: data.state || "",
        ptj_code: data.ptj_code || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        contact_no: data.contact_no || "",
      });
    }
    setLoading(false);
  };

  const handleStateChange = (e) => {
    const selected = e.target.value;
    const match = MALAYSIA_STATES.find((s) => s.state === selected);
    setSchool({
      ...school,
      state: selected,
      ptj_code: match ? match.ptj : "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const latValue =
      school.latitude === "" ? null : parseFloat(school.latitude);
    const lonValue =
      school.longitude === "" ? null : parseFloat(school.longitude);

    const { error } = await supabase
      .from("schools")
      .update({
        school_code: school.school_code,
        school_name: school.school_name,
        address_line: school.address_line,
        postcode: school.postcode,
        city: school.city,
        state: school.state,
        ptj_code: school.ptj_code,
        latitude: latValue,
        longitude: lonValue,
        contact_no: school.contact_no,
      })
      .eq("school_id", school_id);

    if (error) {
      alert("Update Failed: " + error.message);
      console.error("Update Error:", error);
    } else {
      // 🚀 CRITICAL: Recalculate nearest flood stations instantly if coordinates change
      if (latValue && lonValue) {
        await supabase.rpc("assign_nearest_stations", {
          p_school_id: school_id,
        });
      }

      alert("School Profile Updated Successfully!");
      setIsEditing(false);
    }
  };

  if (loading)
    return <div className="p-8 text-slate-500">Loading profile data...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow border border-slate-200 fade-in">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? "Edit School Information" : "School Information"}
        </h2>

        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-slate-200"
          >
            ✏️ Edit Details
          </button>
        )}
      </div>

      {/* VIEW ONLY MODE */}
      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 col-span-1">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                School Code
              </p>
              <p className="text-lg font-bold text-teal-700">
                {school.school_code || "N/A"}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                School Name
              </p>
              <p className="text-lg font-bold text-slate-800">
                {school.school_name || "Not specified"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Official Address
            </p>
            <div className="text-slate-800 font-medium">
              {school.address_line ? (
                <>
                  <p>{school.address_line}</p>
                  <p>
                    {school.postcode} {school.city}, {school.state}
                  </p>
                  {school.ptj_code && (
                    <p className="text-teal-600 text-xs mt-2 font-bold tracking-wide">
                      PTJ CODE: {school.ptj_code}
                    </p>
                  )}
                </>
              ) : (
                <p>Not specified</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                Contact Number
              </p>
              <p className="text-slate-800 font-medium">
                {school.contact_no || "Not specified"}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                Latitude
              </p>
              <p className="text-slate-800 font-mono text-sm">
                {school.latitude || "Not specified"}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                Longitude
              </p>
              <p className="text-slate-800 font-mono text-sm">
                {school.longitude || "Not specified"}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <SchoolFloodDashboard schoolId={school_id} />
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM */
        <form
          onSubmit={handleUpdate}
          className="space-y-5 bg-slate-50 p-6 rounded-lg border border-slate-200"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                School Code
              </label>
              <input
                type="text"
                required
                value={school.school_code}
                onChange={(e) =>
                  setSchool({ ...school, school_code: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                School Name
              </label>
              <input
                type="text"
                required
                value={school.school_name}
                onChange={(e) =>
                  setSchool({ ...school, school_name: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              required
              value={school.address_line}
              onChange={(e) =>
                setSchool({ ...school, address_line: e.target.value })
              }
              className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Postcode
              </label>
              <input
                type="text"
                required
                value={school.postcode}
                onChange={(e) =>
                  setSchool({ ...school, postcode: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={school.city}
                onChange={(e) => setSchool({ ...school, city: e.target.value })}
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                State
              </label>
              <select
                required
                value={school.state}
                onChange={handleStateChange}
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="" disabled>
                  — Select State —
                </option>
                {MALAYSIA_STATES.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={school.contact_no}
                onChange={(e) =>
                  setSchool({ ...school, contact_no: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={school.latitude}
                onChange={(e) =>
                  setSchool({ ...school, latitude: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={school.longitude}
                onChange={(e) =>
                  setSchool({ ...school, longitude: e.target.value })
                }
                className="border border-slate-300 p-2.5 w-full rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-1/3 bg-white border border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-teal-600 text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-md"
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SchoolProfile;
