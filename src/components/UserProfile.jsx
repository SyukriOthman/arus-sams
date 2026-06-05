import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const UserProfile = ({ session, onSessionUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState({ name: "", code: "" });
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (session && session.id) fetchProfileData();
  }, [session]);

  const fetchProfileData = async () => {
    setLoading(true);

    // 1. Fetch the user's staff profile
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .eq("id", session.id)
      .single();

    if (staffError) {
      console.error("Error fetching profile:", staffError.message);
      setLoading(false);
      return;
    }

    setProfile(staffData);

    // 2. Fetch the school name and code using the user's school_id
    if (staffData.school_id) {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("school_name, school_code")
        .eq("school_id", staffData.school_id)
        .single();

      if (!schoolError && schoolData) {
        setSchoolInfo({
          name: schoolData.school_name,
          code: schoolData.school_code,
        });
      }
    }

    setLoading(false);
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      alert("Please select a new image file first.");
      return;
    }

    setIsUploading(true);

    // 1. Validate file size and type
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png"];
    if (
      !ALLOWED_TYPES.includes(avatarFile.type) ||
      avatarFile.size > MAX_FILE_SIZE
    ) {
      alert("Upload Blocked: Invalid format or size. Max 2MB JPG/PNG.");
      setIsUploading(false);
      return;
    }

    // 2. Upload to Supabase 'avatar' storage bucket
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${profile.ic_number}-update-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatar")
      .upload(fileName, avatarFile);

    if (uploadError) {
      alert("Image Upload Failed: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    // 3. Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from("avatar")
      .getPublicUrl(fileName);

    const finalProfilePicUrl = publicUrlData.publicUrl;

    // 4. Update the staff table with the new URL
    const { error: updateError } = await supabase
      .from("staff")
      .update({ profile_pic: finalProfilePicUrl })
      .eq("id", profile.id);

    if (updateError) {
      alert("Database Update Failed: " + updateError.message);
    } else {
      alert("Profile picture updated successfully!");

      // Update local state to show new picture immediately
      setProfile({ ...profile, profile_pic: finalProfilePicUrl });

      // Update the parent App.jsx state so the sidebar updates instantly!
      if (onSessionUpdate) {
        onSessionUpdate({ profile_pic: finalProfilePicUrl });
      }

      setIsEditing(false);
      setAvatarFile(null);
    }

    setIsUploading(false);
  };

  if (loading)
    return <div className="p-8 text-slate-500">Loading your profile...</div>;
  if (!profile)
    return (
      <div className="p-8 text-red-500">
        Error: Could not load profile data.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow border border-slate-200 fade-in">
      {/* HEADER WITH EDIT BUTTON */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          My Personal Profile
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-slate-200"
          >
            📷 Change Picture
          </button>
        )}
      </div>

      {/* HEADER: AVATAR AND NAME */}
      <div className="flex items-center space-x-6 mb-8">
        {profile.profile_pic ? (
          <img
            src={profile.profile_pic}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-4xl border-4 border-slate-100 shadow-sm">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-3xl font-bold text-slate-800">
            {profile.full_name}
          </h3>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize 
            ${
              profile.role === "superadmin"
                ? "bg-purple-100 text-purple-700"
                : profile.role === "headmaster"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-teal-100 text-teal-700"
            }`}
          >
            {profile.role.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* CONDITIONAL UPLOAD FORM */}
      {isEditing && (
        <form
          onSubmit={handleUpdateAvatar}
          className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200 fade-in"
        >
          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Upload New Profile Picture
          </h4>
          <input
            type="file"
            accept="image/jpeg, image/png"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 mb-4 border border-slate-300 p-2 rounded bg-white"
            required
          />
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setAvatarFile(null);
              }}
              className="w-1/3 bg-white border border-slate-300 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-teal-600 text-white font-bold py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md disabled:bg-teal-400"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "💾 Save Picture"}
            </button>
          </div>
        </form>
      )}

      {/* READ-ONLY DETAILS GRID */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
            Email Address
          </p>
          <p className="text-slate-800 font-medium">{profile.email}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
            Phone Number
          </p>
          <p className="text-slate-800 font-medium">{profile.phone_no}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
            IC Number
          </p>
          <p className="text-slate-800 font-mono">{profile.ic_number}</p>
        </div>

        {/* Shows School Name and Code instead of ID */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
            Assigned Institution
          </p>
          <p className="text-slate-800 font-medium">
            {profile.school_id
              ? `${schoolInfo.name || "Loading..."} (${schoolInfo.code || "..."})`
              : "Ministry Level (Superadmin)"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
