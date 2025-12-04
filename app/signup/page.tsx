"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import { ShoppingBag03, User01, Lock01, Mail01, Eye, EyeOff } from "@untitledui/icons";

export default function SignupPage() {
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");
  
  // Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Keyboard State
  const [activeInput, setActiveInput] = useState<"email" | "password" | "adminName" | "adminPin" | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");

  const handleInputFocus = (field: "email" | "password" | "adminName" | "adminPin", currentValue: string) => {
    setActiveInput(field);
    setKeyboardValue(currentValue);
  };

  const handleKeyboardChange = (val: string) => {
    setKeyboardValue(val);
    if (activeInput === "email") setEmail(val);
    if (activeInput === "password") setPassword(val);
    if (activeInput === "adminName") setAdminName(val);
    if (activeInput === "adminPin") setAdminPin(val);
  };

  const handleKeyboardClose = () => {
    setActiveInput(null);
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    if (adminPin.length < 4) {
      setError("Admin PIN must be at least 4 digits");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Supabase Auth User (Store Owner)
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            store_name: "My Pizza Shop", 
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        let session = data.session;
        
        if (!session) {
             // Attempt immediate login (in case confirm is OFF)
             const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
             session = loginData.session;
        }

        if (session) {
            // 2. Create the first Admin Employee via API
            // Wait a bit for Supabase to set cookies properly
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const res = await fetch("/api/auth/setup-admin", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json"
              },
              credentials: "include", // Ensure cookies are sent
              body: JSON.stringify({
                name: adminName,
                pin: adminPin,
                email: email 
              }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("Setup admin failed:", err);
                throw new Error(err.error || "Failed to create admin profile");
            }

            // Small delay to ensure everything is synced
            await new Promise(resolve => setTimeout(resolve, 200));
            router.push("/select-profile");
        } else {
             setSignupSuccess(true);
             setLoading(false);
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Mail01 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          <p className="text-neutral-400 mb-8">
            We&apos;ve sent a confirmation link to <span className="text-white font-medium">{email}</span>. 
            Please verify your account to continue.
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/login"
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
            >
              Go to Login
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="block w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl transition-all"
            >
              Resend Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Left Panel: Info */}
        <div className="w-full md:w-1/3 bg-neutral-800/30 border-r border-neutral-800 p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <ShoppingBag03 className="w-6 h-6 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Setup Store</h1>
            <p className="text-sm text-neutral-400">Create your account and set up the first admin profile to get started.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 text-emerald-500 text-xs font-bold">1</div>
              <div>
                <h3 className="text-sm font-medium text-white">Store Account</h3>
                <p className="text-xs text-neutral-500">Manage billing & settings</p>
              </div>
            </div>
            <div className="w-px h-4 bg-neutral-800 ml-3"></div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 text-emerald-500 text-xs font-bold">2</div>
              <div>
                <h3 className="text-sm font-medium text-white">Admin Profile</h3>
                <p className="text-xs text-neutral-500">Your POS login access</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Right Panel: Form */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Section 1: Store Details */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
                Store Credentials
              </h2>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-neutral-400 ml-1">Email</label>
                  <button
                    type="button"
                    onClick={() => handleInputFocus("email", email)}
                    className={`w-full h-11 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                      activeInput === "email" 
                        ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <Mail01 className="w-4 h-4 text-neutral-500" />
                    <span className={`text-sm ${email ? "text-white" : "text-neutral-600 italic"}`}>
                      {email || "store@example.com"}
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-neutral-400 ml-1">Password</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleInputFocus("password", password)}
                      className={`w-full h-11 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                        activeInput === "password" 
                          ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <Lock01 className="w-4 h-4 text-neutral-500" />
                      <span className={`text-sm ${password ? "text-white" : "text-neutral-600 italic"}`}>
                        {password ? (showPassword ? password : "•".repeat(password.length)) : "Min. 6 characters"}
                      </span>
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Admin Profile */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2 pt-2">
                First Admin User
              </h2>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-neutral-400 ml-1">Admin Name</label>
                  <button
                    type="button"
                    onClick={() => handleInputFocus("adminName", adminName)}
                    className={`w-full h-11 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                      activeInput === "adminName" 
                        ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <User01 className="w-4 h-4 text-neutral-500" />
                    <span className={`text-sm ${adminName ? "text-white" : "text-neutral-600 italic"}`}>
                      {adminName || "e.g. John Doe"}
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-neutral-400 ml-1">Create PIN</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleInputFocus("adminPin", adminPin)}
                      className={`w-full h-11 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                        activeInput === "adminPin" 
                          ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <Lock01 className="w-4 h-4 text-neutral-500" />
                      <span className={`text-sm font-mono tracking-widest ${adminPin ? "text-white" : "text-neutral-600 italic"}`}>
                        {adminPin ? (showPin ? adminPin : "•".repeat(adminPin.length)) : "4-6 digits"}
                      </span>
                    </button>
                    {adminPin && (
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <button
              onClick={() => handleSignup()}
              disabled={loading || !email || !password || !adminName || !adminPin}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
            >
              {loading ? "Creating Account..." : "Create & Start"}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
          value={keyboardValue}
          onChange={handleKeyboardChange}
          onClose={handleKeyboardClose}
          inputName={
            activeInput === "email" ? "Email" : 
            activeInput === "password" ? "Password" : 
            activeInput === "adminName" ? "Admin Name" : "Admin PIN"
          }
          layout={activeInput === "adminPin" ? "number" : "default"}
          maxLength={activeInput === "adminPin" ? 6 : undefined}
        />
      )}
    </div>
  );
}
