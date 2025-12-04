"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag03, Map01, Phone, Upload01, LogOut01 } from "@untitledui/icons";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import { useAuth } from "@/app/context/AuthContext";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logoutStore } = useAuth();
  
  // Keyboard
  const [activeInput, setActiveInput] = useState<"name" | "street" | "city" | "state" | "zip" | "phone" | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");

  const handleInputFocus = (field: "name" | "street" | "city" | "state" | "zip" | "phone", val: string) => {
    setActiveInput(field);
    setKeyboardValue(val);
  };

  const handleKeyboardChange = (val: string) => {
    setKeyboardValue(val);
    if (activeInput === "name") setName(val);
    if (activeInput === "street") setStreet(val);
    if (activeInput === "city") setCity(val);
    if (activeInput === "state") setState(val);
    if (activeInput === "zip") setZip(val);
    if (activeInput === "phone") setPhone(val);
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image size must be less than 5MB");
      return;
    }

    setIsUploadingLogo(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "store-logos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setLogoUrl(data.url);
      } else {
        setError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !street || !zip) {
        setError("Store Name, Phone, Street, and Zip are required");
        return;
    }
    
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
        setError("Phone number must be exactly 10 digits");
        return;
    }
    
    setLoading(true);
    try {
        const res = await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                name, 
                street, 
                city, 
                state, 
                zip, 
                phone, 
                logoUrl 
            })
        });
        
        if (res.ok) {
            router.push("/select-profile");
        } else {
            const err = await res.json();
            setError(err.error || "Failed to save store details");
        }
    } catch (err) {
        console.error(err);
        setError("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  const getInputName = () => {
    switch(activeInput) {
        case "name": return "Store Name";
        case "street": return "Street";
        case "city": return "City";
        case "state": return "State";
        case "zip": return "Zip Code";
        case "phone": return "Phone";
        default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">
        
        {/* Left Panel: Welcome */}
        <div className="w-full md:w-64 bg-neutral-800/30 border-r border-neutral-800 p-6 flex flex-col justify-between shrink-0">
            <div>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                    <ShoppingBag03 className="w-5 h-5 text-emerald-500" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Store Setup</h1>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Configure store details for receipts and invoices.
                </p>
                
                {/* Logo Preview */}
                <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase mb-1.5 block">Store Logo</label>
                    <div 
                        onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                        className={`w-full aspect-video rounded-lg border border-dashed border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col items-center justify-center group overflow-hidden relative ${isUploadingLogo ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isUploadingLogo ? (
                            <div className="flex flex-col items-center">
                                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-1" />
                                <span className="text-[9px] text-neutral-400">Uploading...</span>
                            </div>
                        ) : logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <Upload01 className="w-5 h-5 text-neutral-600 group-hover:text-emerald-500 mb-1 transition-colors" />
                                <span className="text-[9px] text-neutral-500 group-hover:text-emerald-400 transition-colors">Upload Logo</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                        />
                    </div>
                    {logoUrl && !isUploadingLogo && (
                        <button 
                            onClick={() => setLogoUrl("")}
                            className="text-[9px] text-red-400 hover:text-red-300 mt-1 block text-center w-full"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <button 
                onClick={logoutStore}
                className="mt-auto flex items-center gap-2 text-neutral-500 hover:text-white transition-colors pt-4 text-xs"
            >
                <LogOut01 className="w-3.5 h-3.5" />
                <span>Logout Store</span>
            </button>
        </div>

        {/* Right Panel: Form */}
        <div className="flex-1 p-6 overflow-y-auto">
            {error && (
                <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                    {error}
                </div>
            )}

            <div className="space-y-5">
                <section className="space-y-3">
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-1">
                        Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">Store Name *</label>
                            <button
                                onClick={() => handleInputFocus("name", name)}
                                className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                    activeInput === "name" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <ShoppingBag03 className="w-4 h-4 text-neutral-500" />
                                <span className={`text-xs font-medium ${name ? "text-white" : "text-neutral-600 italic"}`}>
                                    {name || "e.g. Joe's Pizza"}
                                </span>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">Phone</label>
                            <button
                                onClick={() => handleInputFocus("phone", phone)}
                                className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                    activeInput === "phone" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <Phone className="w-4 h-4 text-neutral-500" />
                                <span className={`text-xs font-medium ${phone ? "text-white" : "text-neutral-600 italic"}`}>
                                    {phone || "Phone..."}
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-1 pt-1">
                        Address
                    </h3>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">Street *</label>
                        <button
                            onClick={() => handleInputFocus("street", street)}
                            className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                activeInput === "street" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                        >
                            <Map01 className="w-4 h-4 text-neutral-500" />
                            <span className={`text-xs font-medium truncate ${street ? "text-white" : "text-neutral-600 italic"}`}>
                                {street || "123 Main St"}
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                            <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">City</label>
                            <button
                                onClick={() => handleInputFocus("city", city)}
                                className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                    activeInput === "city" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <span className={`text-xs font-medium truncate ${city ? "text-white" : "text-neutral-600 italic"}`}>
                                    {city || "City"}
                                </span>
                            </button>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">State</label>
                            <button
                                onClick={() => handleInputFocus("state", state)}
                                className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                    activeInput === "state" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <span className={`text-xs font-medium truncate ${state ? "text-white" : "text-neutral-600 italic"}`}>
                                    {state || "State"}
                                </span>
                            </button>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[9px] font-bold text-neutral-500 uppercase ml-1">Zip *</label>
                            <button
                                onClick={() => handleInputFocus("zip", zip)}
                                className={`w-full h-10 px-3 bg-neutral-950 border rounded-lg flex items-center gap-2 transition-all ${
                                    activeInput === "zip" ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <span className={`text-xs font-medium truncate ${zip ? "text-white" : "text-neutral-600 italic"}`}>
                                    {zip || "Zip"}
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                <div className="pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !name || !phone || !street || !zip}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 active:scale-95 text-sm"
                    >
                        {loading ? "Saving..." : "Complete Setup"}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {activeInput && (
        <OnScreenKeyboard
            value={keyboardValue}
            onChange={handleKeyboardChange}
            onClose={() => setActiveInput(null)}
            inputName={getInputName()}
            layout={(activeInput === "phone" || activeInput === "zip") ? "number" : "default"}
            maxLength={activeInput === "phone" ? 10 : activeInput === "zip" ? 10 : undefined}
        />
      )}
    </div>
  );
}
