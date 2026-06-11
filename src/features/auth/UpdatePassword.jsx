import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function UpdatePassword({ navigate }) {
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setErrorMessage("Invalid or expired recovery link. Please request a new one.");
        setStatus("error");
      }
    });
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatus("loading");
    
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("success");
      setTimeout(() => navigate("login"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <CheckCircleIcon className="w-16 h-16 text-green-500" />
            <p className="text-slate-800 font-bold">Password Updated Successfully!</p>
            <p className="text-sm text-slate-500">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {status === "error" && (
              <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded border border-red-100">
                {errorMessage}
              </div>
            )}
            
            <Input
              label="New Secure Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />

            <Button type="submit" variant="primary" className="w-full py-3 mt-4" disabled={status === "loading"}>
              {status === "loading" ? "Saving..." : "Save New Password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
