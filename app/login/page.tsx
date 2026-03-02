"use client";

// 1. Make sure you import the Supabase browser client at the top
import { createClient } from "@/utils/supabase/client"; 
import { Hexagon } from "lucide-react"; // Or whatever icons you use

export default function LoginPage() {
  const supabase = createClient();

  // 2. Add this SSO function
  const handleMicrosoftLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure', // Supabase calls Microsoft 'azure'
      options: {
        scopes: 'email openid profile',
        redirectTo: `${window.location.origin}/auth/callback`, // Supabase auto-handles the redirect
      },
    });

    if (error) {
      console.error("SSO Error:", error.message);
      alert("Failed to log in with Microsoft.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        
        <div className="flex flex-col items-center mb-8">
          <Hexagon className="h-12 w-12 text-blue-600 mb-2 fill-blue-600/20" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Harmony OP</h1>
          <p className="text-sm text-slate-500 text-center mt-2">
            Sign in with your corporate Microsoft account to access the onboarding platform.
          </p>
        </div>

        {/* 3. Add the SSO Button */}
        <button 
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {/* A simple Microsoft Logo SVG */}
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>

      </div>
    </div>
  );
}