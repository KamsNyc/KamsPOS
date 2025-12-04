"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import { ShoppingBag03, Lock01, Mail01, Eye, EyeOff } from "@untitledui/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Keyboard state
  const [activeInput, setActiveInput] = useState<"email" | "password" | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleInputFocus = (field: "email" | "password", currentValue: string) => {
    setActiveInput(field);
    setKeyboardValue(currentValue);
  };

  const handleKeyboardChange = (val: string) => {
    setKeyboardValue(val);
    if (activeInput === "email") setEmail(val);
    if (activeInput === "password") setPassword(val);
  };

  const handleKeyboardClose = () => {
    setActiveInput(null);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/select-profile");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-800/50 p-6 text-center border-b border-neutral-800">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <ShoppingBag03 className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Store Login</h1>
          <p className="text-xs text-neutral-400 mt-1">Access your POS terminal</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">
              Store Email
            </label>
            <button
              type="button"
              onClick={() => handleInputFocus("email", email)}
              className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                activeInput === "email" 
                  ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <Mail01 className="w-4 h-4 text-neutral-500" />
              <span className={`text-sm ${email ? "text-white" : "text-neutral-600 italic"}`}>
                {email || "Enter email..."}
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => handleInputFocus("password", password)}
                className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                  activeInput === "password" 
                    ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" 
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <Lock01 className="w-4 h-4 text-neutral-500" />
                <span className={`text-sm ${password ? "text-white" : "text-neutral-600 italic"}`}>
                  {password ? (showPassword ? password : "•".repeat(password.length)) : "Enter password..."}
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

          <button
            onClick={() => handleLogin()}
            disabled={loading || !email || !password}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 mt-2"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="pt-4 text-center border-t border-neutral-800/50">
            <p className="text-xs text-neutral-500">
              New terminal?{" "}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Setup Store
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
          value={keyboardValue}
          onChange={handleKeyboardChange}
          onClose={handleKeyboardClose}
          inputName={activeInput === "email" ? "Store Email" : "Password"}
          layout="default"
        />
      )}
    </div>
  );
}
