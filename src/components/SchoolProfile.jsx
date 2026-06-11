import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import SchoolFloodDashboard from "../features/telemetry/SchoolFloodDashboard";
import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Textarea from "./ui/Textarea";

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
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const canEdit = userRole === "superadmin" || userRole === "headmaster";

  const fetchSchoolData = useCallback(async () => {
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
  }, [school_id]);

  useEffect(() => {
    if (school_id) {
      fetchSchoolData();
    } else {
      setLoading(false);
    }
  }, [school_id, fetchSchoolData]);

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
      if (latValue && lonValue) {
        await supabase.rpc("assign_nearest_stations", {
          p_school_id: school_id,
        });
      }

      alert("School Profile Updated Successfully!");
      setIsEditing(false);
      setDashboardRefreshKey(prev => prev + 1);
    }
  };

  if (loading)
    return <div className="p-8 text-slate-500">Loading profile data...</div>;

  return (
    <div className="fade-in space-y-6 relative max-w-7xl mx-auto p-4 md:p-8 pb-28">
      {/* Header bar */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              School Profile
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Manage institutional identity, geographic coordinates, and contact information.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Left Column: School Identity */}
        <div className="lg:col-span-1">
          <Card className="p-8 text-center h-full flex flex-col justify-center items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-50 mb-6 shrink-0">
              <BuildingOfficeIcon className="w-10 h-10 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {school.school_name || "School Name"}
            </h1>
            <p className="text-slate-500 font-medium mb-6">
              {school.school_code || "Code Pending"}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-auto">
              <Badge variant="brand">{school.state || "No State"}</Badge>
              {school.ptj_code && (
                <Badge variant="neutral">PTJ: {school.ptj_code}</Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Information / Edit Form */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? "Edit School Details" : "School Information"}
              </h2>
              {canEdit && !isEditing && (
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  <PencilSquareIcon className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </div>

            <div className="p-6 flex-grow">
              {!isEditing ? (
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <MapPinIcon className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Official Address
                      </p>
                      <div className="text-slate-800">
                        {school.address_line ? (
                          <>
                            <p className="font-medium text-lg">
                              {school.address_line}
                            </p>
                            <p className="text-slate-600">
                              {school.postcode} {school.city}, {school.state}
                            </p>
                          </>
                        ) : (
                          <p className="italic text-slate-400">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <GlobeAltIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Geographic Coordinates
                        </p>
                        <div className="text-slate-800 font-mono text-sm">
                          {school.latitude && school.longitude ? (
                            <p>
                              {school.latitude}, {school.longitude}
                            </p>
                          ) : (
                            <p className="italic text-slate-400">
                              Not specified
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <PhoneIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Contact Number
                        </p>
                        <p className="text-slate-800 font-medium text-lg">
                          {school.contact_no || (
                            <span className="italic text-slate-400 font-normal">
                              Not specified
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="School Code"
                      required
                      value={school.school_code}
                      onChange={(e) =>
                        setSchool({ ...school, school_code: e.target.value })
                      }
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="School Name"
                        required
                        value={school.school_name}
                        onChange={(e) =>
                          setSchool({ ...school, school_name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Textarea
                    label="Address Line 1"
                    required
                    rows={2}
                    value={school.address_line}
                    onChange={(e) =>
                      setSchool({ ...school, address_line: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Postcode"
                      required
                      value={school.postcode}
                      onChange={(e) =>
                        setSchool({ ...school, postcode: e.target.value })
                      }
                    />
                    <Input
                      label="City"
                      required
                      value={school.city}
                      onChange={(e) =>
                        setSchool({ ...school, city: e.target.value })
                      }
                    />
                    <Select
                      label="State"
                      required
                      value={school.state}
                      onChange={handleStateChange}
                    >
                      <option value="" disabled>
                        Select State
                      </option>
                      {MALAYSIA_STATES.map((s) => (
                        <option key={s.state} value={s.state}>
                          {s.state}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Contact Number"
                      value={school.contact_no}
                      onChange={(e) =>
                        setSchool({ ...school, contact_no: e.target.value })
                      }
                    />
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      value={school.latitude}
                      onChange={(e) =>
                        setSchool({ ...school, latitude: e.target.value })
                      }
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      value={school.longitude}
                      onChange={(e) =>
                        setSchool({ ...school, longitude: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                    >
                      <CheckIcon className="w-5 h-5 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                      type="button"
                    >
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <SchoolFloodDashboard key={dashboardRefreshKey} schoolId={school_id} userRole={userRole} />
      </div>
    </div>
  );
};

export default SchoolProfile;