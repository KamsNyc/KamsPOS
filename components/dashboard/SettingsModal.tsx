"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  X, 
  User01, 
  Settings02, 
  Plus, 
  Trash01, 
  ChevronLeft,
  Lock01,
  Mail01,
  AlertCircle,
  Building07,
  Phone,
  Map01,
  Upload01
} from "@untitledui/icons";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import { useEmployee } from "@/app/context/AuthContext";

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface StoreData {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  logoUrl?: string | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user: currentEmployee } = useEmployee();
  const [activeTab, setActiveTab] = useState<"store" | "employees">("store");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Store State
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    logoUrl: ""
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pin: "",
    role: "CASHIER",
    email: ""
  });

  // Computed: Check if editing self
  const isEditingSelf = editingUser?.id === currentEmployee?.id;
  
  // Computed: Count admins
  const adminCount = users.filter(u => u.role === "ADMIN").length;
  
  // Computed: Is last admin (can't change role or delete)
  const isLastAdmin = isEditingSelf && editingUser?.role === "ADMIN" && adminCount <= 1;

  // Computed: Check if store form has changed
  const hasStoreChanges = storeData ? (
    storeForm.name !== (storeData.name || "") ||
    storeForm.phone !== (storeData.phone || "") ||
    storeForm.street !== (storeData.street || "") ||
    storeForm.city !== (storeData.city || "") ||
    storeForm.state !== (storeData.state || "") ||
    storeForm.zip !== (storeData.zip || "") ||
    storeForm.logoUrl !== (storeData.logoUrl || "")
  ) : false;

  // Keyboard
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "employees") {
        fetchUsers();
      } else if (activeTab === "store") {
        fetchStore();
      }
    }
  }, [isOpen, activeTab]);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store");
      if (res.ok) {
        const data = await res.json();
        setStoreData(data);
        setStoreForm({
          name: data.name || "",
          phone: data.phone || "",
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          logoUrl: data.logoUrl || ""
        });
      }
    } catch (err) {
      console.error("Failed to fetch store", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSave = async () => {
    if (!storeForm.name || !storeForm.phone || !storeForm.street || !storeForm.zip) {
      alert("Store Name, Phone, Street, and Zip are required");
      return;
    }
    
    const cleanPhone = storeForm.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    setStoreSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeForm)
      });

      if (res.ok) {
        // Update storeData to match form (so hasStoreChanges becomes false)
        setStoreData(prev => prev ? { ...prev, ...storeForm } : null);
        setStoreSuccess(true);
        // Clear session storage to refresh store data
        sessionStorage.removeItem("kams_pos_store");
        setTimeout(() => setStoreSuccess(false), 2000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save store");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setStoreSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploadingLogo(true);
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
        setStoreForm(prev => ({ ...prev, logoUrl: data.url }));
      } else {
        alert(data.error || "Failed to upload logo");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const isEdit = view === "edit" && editingUser;
      const url = isEdit ? `/api/users/${editingUser.id}` : "/api/users";
      const method = isEdit ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchUsers();
        setView("list");
        setEditingUser(null);
        setFormData({ name: "", pin: "", role: "CASHIER", email: "" });
      } else {
         const err = await res.json();
         alert(err.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    
    // Prevent self-deletion
    if (isEditingSelf) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this employee?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchUsers();
        setView("list");
        setEditingUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
        name: user.name,
        pin: "", // Don't show existing PIN
        role: user.role,
        email: user.email || ""
    });
    setView("edit");
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", pin: "", role: "CASHIER", email: "" });
    setView("create");
  };

  const handleInputClick = (field: string, value: string) => {
    setActiveInput(field);
    setKeyboardValue(value);
  };

  const handleStoreInputClick = (field: string, value: string) => {
    setActiveInput(`store${field.charAt(0).toUpperCase() + field.slice(1)}`);
    setKeyboardValue(value);
  };

  const handleKeyboardChange = (val: string) => {
    setKeyboardValue(val);
    
    // Handle store fields
    if (activeInput?.startsWith("store")) {
      const storeField = activeInput.replace("store", "").toLowerCase();
      // Handle phone max length
      if (storeField === "phone" && val.replace(/\D/g, "").length > 10) return;
      setStoreForm(prev => ({ ...prev, [storeField]: val }));
    } else {
      // Handle employee fields
      setFormData(prev => ({ ...prev, [activeInput!]: val }));
    }
  };
  
  const getKeyboardLabel = () => {
    if (!activeInput) return "";
    if (activeInput.startsWith("store")) {
      const field = activeInput.replace("store", "");
      return `Store ${field}`;
    }
    return activeInput.charAt(0).toUpperCase() + activeInput.slice(1);
  };
  
  const getKeyboardLayout = () => {
    if (activeInput === "pin" || activeInput === "storePhone" || activeInput === "storeZip") {
      return "number";
    }
    return "default";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-full max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl border border-neutral-800">
        
        {/* Sidebar */}
        <div className="w-64 bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col gap-2">
          <h2 className="text-lg font-bold text-white px-2 mb-4 flex items-center gap-2">
            <Settings02 className="w-5 h-5 text-emerald-500" />
            Settings
          </h2>
          
          <button 
            onClick={() => { setActiveTab("store"); setView("list"); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "store" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
            }`}
          >
            <Building07 className="w-4 h-4" />
            Store
          </button>
          
          <button 
            onClick={() => { setActiveTab("employees"); setView("list"); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "employees" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
            }`}
          >
            <User01 className="w-4 h-4" />
            Employees
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-neutral-900 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    {activeTab === "employees" && view !== "list" && (
                        <button 
                            onClick={() => setView("list")}
                            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 mr-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <h3 className="text-lg font-bold text-white">
                        {activeTab === "store" 
                          ? "Store Settings" 
                          : view === "list" 
                            ? "Manage Employees" 
                            : view === "create" 
                              ? "Add New Employee" 
                              : "Edit Employee"}
                    </h3>
                </div>
                <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Store Settings Tab */}
                {activeTab === "store" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-start gap-6">
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-2">Store Logo</label>
                        <div 
                          onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                          className={`w-28 h-28 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col items-center justify-center group overflow-hidden relative ${isUploadingLogo ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {isUploadingLogo ? (
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-1" />
                              <span className="text-[10px] text-neutral-400">Uploading...</span>
                            </div>
                          ) : storeForm.logoUrl ? (
                            <Image 
                              src={storeForm.logoUrl} 
                              alt="Store Logo" 
                              fill
                              className="object-contain"
                              sizes="96px"
                              quality={95}
                            />
                          ) : (
                            <>
                              <Upload01 className="w-6 h-6 text-neutral-600 group-hover:text-emerald-500 mb-1 transition-colors" />
                              <span className="text-[10px] text-neutral-500 group-hover:text-emerald-400 transition-colors">Upload</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                          />
                        </div>
                        {storeForm.logoUrl && !isUploadingLogo && (
                          <button 
                            onClick={() => setStoreForm(prev => ({ ...prev, logoUrl: "" }))}
                            className="text-[10px] text-red-400 hover:text-red-300 mt-1.5 block"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase">Store Name *</label>
                          <button
                            onClick={() => handleStoreInputClick("name", storeForm.name)}
                            className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                              activeInput === "storeName" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <Building07 className="w-5 h-5 text-neutral-500" />
                            <span className={`text-sm font-medium ${storeForm.name ? "text-white" : "text-neutral-600 italic"}`}>
                              {storeForm.name || "Enter store name..."}
                            </span>
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase">Phone *</label>
                          <button
                            onClick={() => handleStoreInputClick("phone", storeForm.phone)}
                            className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                              activeInput === "storePhone" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <Phone className="w-5 h-5 text-neutral-500" />
                            <span className={`text-sm font-medium ${storeForm.phone ? "text-white" : "text-neutral-600 italic"}`}>
                              {storeForm.phone || "Enter phone..."}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Address Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-neutral-400 flex items-center gap-2">
                        <Map01 className="w-4 h-4" />
                        Address
                      </h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Street *</label>
                        <button
                          onClick={() => handleStoreInputClick("street", storeForm.street)}
                          className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center transition-all text-left ${
                            activeInput === "storeStreet" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        >
                          <span className={`text-sm font-medium ${storeForm.street ? "text-white" : "text-neutral-600 italic"}`}>
                            {storeForm.street || "Enter street address..."}
                          </span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase">City</label>
                          <button
                            onClick={() => handleStoreInputClick("city", storeForm.city)}
                            className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center transition-all text-left ${
                              activeInput === "storeCity" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <span className={`text-sm font-medium ${storeForm.city ? "text-white" : "text-neutral-600 italic"}`}>
                              {storeForm.city || "City..."}
                            </span>
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase">State</label>
                          <button
                            onClick={() => handleStoreInputClick("state", storeForm.state)}
                            className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center transition-all text-left ${
                              activeInput === "storeState" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <span className={`text-sm font-medium ${storeForm.state ? "text-white" : "text-neutral-600 italic"}`}>
                              {storeForm.state || "State..."}
                            </span>
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase">ZIP *</label>
                          <button
                            onClick={() => handleStoreInputClick("zip", storeForm.zip)}
                            className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center transition-all text-left ${
                              activeInput === "storeZip" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <span className={`text-sm font-medium ${storeForm.zip ? "text-white" : "text-neutral-600 italic"}`}>
                              {storeForm.zip || "ZIP..."}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Save Button - Only shows when changes are made */}
                    {(hasStoreChanges || storeSuccess) && (
                      <div className="pt-4">
                        <button 
                          onClick={handleStoreSave}
                          disabled={storeSaving || !hasStoreChanges}
                          className={`w-full h-12 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            storeSuccess 
                              ? "bg-emerald-500 text-white" 
                              : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          {storeSaving ? "Saving..." : storeSuccess ? "✓ Saved!" : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Employees Tab */}
                {activeTab === "employees" && (
                  <>
                  {view === "list" ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <button 
                            onClick={openCreate}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-dashed border-neutral-700 bg-neutral-800/20 hover:bg-neutral-800/50 hover:border-emerald-500/50 transition-all group h-40"
                        >
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="font-medium text-emerald-400">Add Employee</span>
                        </button>
                        
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => openEdit(user)}
                                className="flex flex-col items-start p-5 rounded-2xl bg-neutral-800/50 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800 transition-all h-40 relative group text-left w-full"
                            >
                                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-lg font-bold text-white mb-3">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="font-bold text-white text-lg">{user.name}</div>
                                <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mt-1">{user.role}</div>
                                
                                {user.role === "ADMIN" && (
                                    <div className="absolute top-4 right-4 text-emerald-500">
                                        <Settings02 className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Full Name</label>
                                <button
                                    onClick={() => handleInputClick("name", formData.name)}
                                    className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                                        activeInput === "name" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                                    }`}
                                >
                                    <User01 className="w-5 h-5 text-neutral-500" />
                                    <span className={`text-sm font-medium ${formData.name ? "text-white" : "text-neutral-600 italic"}`}>
                                        {formData.name || "Enter name..."}
                                    </span>
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">PIN Code</label>
                                <button
                                    onClick={() => handleInputClick("pin", formData.pin)}
                                    className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                                        activeInput === "pin" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                                    }`}
                                >
                                    <Lock01 className="w-5 h-5 text-neutral-500" />
                                    <span className={`text-sm font-medium ${formData.pin ? "text-white" : "text-neutral-600 italic"}`}>
                                        {formData.pin ? "•".repeat(formData.pin.length) : (view === "edit" ? "Reset PIN (Leave empty to keep)" : "Create 4-6 digit PIN")}
                                    </span>
                                </button>
                            </div>

                                <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Role</label>
                                    {isLastAdmin ? (
                                      <div className="h-12 px-4 bg-neutral-950 border border-amber-500/30 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs text-amber-400">You are the only admin</span>
                                      </div>
                                    ) : (
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                                        {["CASHIER", "ADMIN"].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setFormData({ ...formData, role })}
                                                className={`h-10 rounded-lg text-xs font-bold transition-all ${
                                                    formData.role === role
                                                        ? "bg-neutral-800 text-white shadow-sm"
                                                        : "text-neutral-500 hover:text-neutral-300"
                                                }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Email (Optional)</label>
                                    <button
                                        onClick={() => handleInputClick("email", formData.email)}
                                        className={`w-full h-12 px-4 bg-neutral-950 border rounded-xl flex items-center gap-3 transition-all ${
                                            activeInput === "email" ? "border-emerald-500 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-700"
                                        }`}
                                    >
                                        <Mail01 className="w-5 h-5 text-neutral-500" />
                                        <span className={`text-sm font-medium truncate ${formData.email ? "text-white" : "text-neutral-600 italic"}`}>
                                            {formData.email || "Enter email..."}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-3">
                            {view === "edit" && (
                                <div className="relative group">
                                    <button 
                                        onClick={handleDelete}
                                        disabled={loading || isEditingSelf}
                                        className={`h-12 w-12 flex items-center justify-center rounded-xl transition-colors ${
                                            isEditingSelf 
                                                ? "bg-neutral-800/50 border border-neutral-700 text-neutral-600 cursor-not-allowed" 
                                                : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
                                        }`}
                                    >
                                        <Trash01 className="w-5 h-5" />
                                    </button>
                                    {isEditingSelf && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-800 rounded-lg text-xs text-neutral-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-neutral-700">
                                            Can&apos;t delete yourself
                                        </div>
                                    )}
                                </div>
                            )}
                            <button 
                                onClick={handleSave}
                                disabled={loading || !formData.name || (view === "create" && formData.pin.length < 4)}
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : "Save Employee"}
                            </button>
                        </div>
                    </div>
                )}
                  </>
                )}
            </div>
        </div>
      </div>

      {/* Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
            value={keyboardValue}
            onChange={handleKeyboardChange}
            onClose={() => setActiveInput(null)}
            inputName={getKeyboardLabel()}
            layout={getKeyboardLayout()}
            maxLength={activeInput === "pin" ? 6 : activeInput === "storePhone" ? 10 : activeInput === "storeZip" ? 10 : undefined}
        />
      )}
    </div>
  );
}

