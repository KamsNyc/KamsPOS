"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { User01, Shield01, ShoppingBag03 } from "@untitledui/icons";

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export default function SelectProfilePage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [storeName, setStoreName] = useState("");
  
  const { storeUser, loginEmployee, logoutStore } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!storeUser) return;

    const checkStoreAndProfiles = async () => {
      try {
        // 1. Check Store Existence
        const storeRes = await fetch("/api/store");
        const storeData = await storeRes.json();

        if (!storeRes.ok || !storeData || !storeData.id) {
            router.push("/onboarding");
            return;
        }
        setStoreName(storeData.name);

        // 2. Fetch Profiles
        const profilesRes = await fetch("/api/users");
        if (profilesRes.ok) {
            const profilesData = await profilesRes.json();
            setProfiles(profilesData);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStoreAndProfiles();
  }, [storeUser, router]);

  useEffect(() => {
    if (pin.length === 4 && selectedProfile) {
      const attemptLogin = async () => {
        setIsVerifying(true);
        setError("");
        
        const success = await loginEmployee(selectedProfile.id, pin);
        
        if (success) {
          // Just navigate - AuthContext handles session
          router.push("/dashboard");
        } else {
          setError("Invalid PIN");
          setPin("");
        }
        setIsVerifying(false);
      };
      attemptLogin();
    }
  }, [pin, selectedProfile, loginEmployee, router]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || pin.length !== 4) return;
    // Manual submit if needed, though auto-submit handles it
  };

  const handleLogoutStore = async () => {
    await logoutStore();
  };

  const staffProfiles = profiles.filter(p => p.role !== "ADMIN");
  const adminProfiles = profiles.filter(p => p.role === "ADMIN");

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        Loading profiles...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative">
      {/* Store Name Badge */}
      <div className="absolute top-6 left-6 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
        <ShoppingBag03 className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-medium text-neutral-300">{storeName || "Store"}</span>
      </div>
      
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-white">Who is working?</h1>
          <div className="flex items-center gap-6">
            {adminProfiles.length > 0 && (
              <button
                onClick={() => {
                  // Select first admin for now (assuming single owner/admin usually)
                  // Ideally could show a dropdown if multiple
                  setSelectedProfile(adminProfiles[0]);
                  setPin("");
                  setError("");
                }}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
              >
                <Shield01 className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            )}
            <button 
              onClick={handleLogoutStore}
              className="text-neutral-500 hover:text-white text-sm transition-colors"
            >
              Logout Store
            </button>
          </div>
        </div>

        {staffProfiles.length === 0 ? (
          <div className="text-center text-neutral-400 bg-neutral-900/50 p-10 rounded-xl border border-neutral-800">
            <p>No staff profiles found.</p>
            {adminProfiles.length > 0 && (
              <p className="text-sm mt-2">Please login as Admin to create employee profiles.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {staffProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                    setSelectedProfile(profile);
                    setPin("");
                    setError("");
                }}
                className="group relative flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 hover:border-emerald-500/50 transition-all duration-200 active:scale-95 aspect-square"
              >
                <div className="w-20 h-20 rounded-full bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center mb-4 transition-colors border-2 border-neutral-700 group-hover:border-emerald-500/30">
                  <span className="text-2xl font-bold text-white">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
                  {profile.name}
                </h3>
                <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">
                  {profile.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PIN Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 border-2 ${
                selectedProfile.role === "ADMIN" 
                  ? "bg-emerald-900/20 border-emerald-500/50" 
                  : "bg-neutral-800 border-emerald-500/20"
              }`}>
                {selectedProfile.role === "ADMIN" ? (
                  <Shield01 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <User01 className="w-8 h-8 text-emerald-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{selectedProfile.name}</h2>
              <p className="text-neutral-400 text-sm">
                {selectedProfile.role === "ADMIN" ? "Enter Admin PIN" : "Enter your PIN"}
              </p>
            </div>

            <form onSubmit={handlePinSubmit}>
                <div className="mb-6 flex justify-center">
                    <div className="flex gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div 
                                key={i} 
                                className={`w-4 h-4 rounded-full border ${
                                    pin.length > i 
                                        ? "bg-emerald-500 border-emerald-500" 
                                        : "bg-neutral-800 border-neutral-700"
                                }`}
                            />
                        ))}
                    </div>
                </div>
                
                {error && (
                    <div className="text-red-500 text-center text-sm mb-4 animate-pulse">
                        {error}
                    </div>
                )}

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setPin(prev => (prev.length < 4 ? prev + num : prev))}
                            className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xl font-semibold transition-colors active:bg-emerald-600/20"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setSelectedProfile(null)}
                        className="h-14 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => setPin(prev => (prev.length < 4 ? prev + 0 : prev))}
                        className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xl font-semibold transition-colors active:bg-emerald-600/20"
                    >
                        0
                    </button>
                    <button
                        type="button"
                        onClick={() => setPin(prev => prev.slice(0, -1))}
                        className="h-14 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                        <span className="text-lg">⌫</span>
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={pin.length < 4 || isVerifying}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {isVerifying ? "Verifying..." : "Login"}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
