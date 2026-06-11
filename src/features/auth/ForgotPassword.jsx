import { useState } from "react";
import { supabase } from "../../supabaseClient";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { KeyIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, 
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <KeyIcon className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
          <p className="text-sm text-slate-500 text-center mt-2">
            Enter your official school email and we'll send you a secure recovery link.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm text-center font-medium border border-green-200">
            Recovery email sent! Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            {status === "error" && (
              <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded border border-red-100">
                {errorMessage}
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-6">
                <EnvelopeIcon className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu.my"
                className="pl-10"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 mt-2" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send Recovery Link"}
            </Button>
            
            <button 
              type="button" 
              onClick={() => navigate("login")}
              className="w-full mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
