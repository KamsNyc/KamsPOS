"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import OnScreenKeyboard from "./OnScreenKeyboard";
import {
  X,
  User01,
  MarkerPin01,
  Plus,
  Phone,
  RefreshCw01,
} from "@untitledui/icons";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  extraDirections?: string;
  isDefault: boolean;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  defaultAddress?: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface CustomerCreateSheetProps {
  phone: string;
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export default function CustomerCreateSheet({
  phone,
  isOpen,
  onClose,
  onCustomerCreated,
}: CustomerCreateSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: phone,
  });
  const [address, setAddress] = useState<Omit<Address, 'id' | 'label'> | null>(null);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [activeInputLabel, setActiveInputLabel] = useState<string>("");
  const [keyboardValue, setKeyboardValue] = useState("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [streetError, setStreetError] = useState<string>("");
  const [zipError, setZipError] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [avatarSeed, setAvatarSeed] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: "",
        phone: phone,
      });
      setAddress({
        street: "",
        city: "Queens",
        state: "NY",
        zip: "",
        extraDirections: "",
        isDefault: true,
      });
      setActiveInput(null);
      setActiveInputLabel("");
      setKeyboardValue("");
      setPhoneError("");
      setNameError("");
      setStreetError("");
      setZipError("");
      setShowAddressForm(true);
      setAvatarSeed("");
    }
  }, [isOpen, phone]);

  const handleInputFocus = (field: string, currentValue: string, label: string) => {
    setActiveInput(field);
    setActiveInputLabel(label);
    setKeyboardValue(currentValue);
    
    // Update avatar seed when full name field is focused and has a value
    if (field === "fullName" && currentValue && currentValue.trim() !== "") {
      setAvatarSeed(currentValue.trim());
    }
  };

  const handleNameBlur = () => {
    // Update avatar seed when user finishes typing the name
    if (formData.fullName && formData.fullName.trim() !== "") {
      setAvatarSeed(formData.fullName.trim());
    }
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const generateRandomName = () => {
    const firstNames = [
      "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Jessica",
      "Robert", "Ashley", "William", "Amanda", "Richard", "Melissa", "Joseph", "Nicole",
      "Thomas", "Michelle", "Christopher", "Kimberly", "Daniel", "Amy", "Matthew", "Angela",
      "Anthony", "Lisa", "Mark", "Nancy", "Donald", "Karen", "Steven", "Betty",
      "Paul", "Helen", "Andrew", "Sandra", "Joshua", "Donna", "Kenneth", "Carol",
      "Kevin", "Ruth", "Brian", "Sharon", "George", "Michelle", "Timothy", "Laura",
      "Ronald", "Sarah", "Jason", "Kimberly", "Edward", "Deborah", "Jeffrey", "Jessica"
    ];
    const lastNames = [
      "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
      "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
      "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
      "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
      "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
      "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
    ];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };

  const handleGenerateRandomName = () => {
    const randomName = generateRandomName();
    setFormData(prev => ({ ...prev, fullName: randomName }));
    setAvatarSeed(randomName); // Update avatar immediately when generating random name
    if (nameError) {
      setNameError("");
    }
  };

  const validatePhone = (phone: string): string => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required";
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length === 0) {
      return "Phone number must contain digits";
    }
    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    return "";
  };

  const handleKeyboardChange = (value: string) => {
    setKeyboardValue(value);
    
    if (activeInput?.startsWith('address_')) {
      // Handle address field updates
      if (address) {
        const fieldName = activeInput.replace('address_', '');
        setAddress({
          ...address,
          [fieldName]: value
        });
      }
    } else {
      // Handle phone max length - only allow 10 digits
      if (activeInput === "phone") {
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length > 10) {
          // Don't update if it would exceed 10 digits
          return;
        }
      }
      
      // Handle customer form updates
      const newFormData = {
        ...formData,
        [activeInput!]: value,
      };
      setFormData(newFormData);
      
      // Validate in real-time
      if (activeInput === "phone") {
        const error = validatePhone(value);
        setPhoneError(error);
      } else if (activeInput === "fullName") {
        if (!value || value.trim() === "") {
          setNameError("Full name is required");
        } else {
          setNameError("");
        }
        // Don't update avatar seed while typing - only on blur
      } else if (activeInput === "address_street") {
        if (!value || value.trim() === "") {
          setStreetError("Street address is required");
        } else {
          setStreetError("");
        }
      } else if (activeInput === "address_zip") {
        if (!value || value.trim() === "") {
          setZipError("ZIP code is required");
        } else {
          setZipError("");
        }
      }
    }
  };

  const handleKeyboardClose = () => {
    setActiveInput(null);
    setActiveInputLabel("");
    setKeyboardValue("");
  };

  // Check if form is valid
  const isFormValid = () => {
    const nameValid = formData.fullName && formData.fullName.trim() !== "";
    const phoneValid = formData.phone && formData.phone.replace(/\D/g, "").length === 10;
    const streetValid = !showAddressForm || (address && address.street && address.street.trim() !== "");
    const zipValid = !showAddressForm || (address && address.zip && address.zip.trim() !== "");
    return nameValid && phoneValid && streetValid && zipValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate full name
    if (!formData.fullName || formData.fullName.trim() === "") {
      setNameError("Full name is required");
      setTimeout(() => {
        const nameButton = document.querySelector('[data-field="fullName"]');
        nameButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // Validate phone number
    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setTimeout(() => {
        const phoneButton = document.querySelector('[data-field="phone"]');
        phoneButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // Validate address if address form is shown
    if (showAddressForm && address) {
      if (!address.street || address.street.trim() === "") {
        setStreetError("Street address is required");
        setTimeout(() => {
          const streetButton = document.querySelector('[data-field="address_street"]');
          streetButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
      if (!address.zip || address.zip.trim() === "") {
        setZipError("ZIP code is required");
        setTimeout(() => {
          const zipButton = document.querySelector('[data-field="address_zip"]');
          zipButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
    
    setIsLoading(true);
    setPhoneError("");
    setNameError("");
    setStreetError("");
    setZipError("");

    try {
      // Normalize phone (remove non-digits)
      const normalizedPhone = formData.phone.replace(/\D/g, "");
      
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: normalizedPhone,
          address: address && address.street ? {
            label: "Home",
            street: address.street,
            city: address.city || "Queens",
            state: address.state || "NY",
            zip: address.zip,
            extraDirections: "",
            isDefault: true,
          } : undefined,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        // Map the response to match the expected Customer type
        const customer: Customer = {
          id: created.id,
          fullName: created.fullName,
          phone: created.phone,
          email: created.email,
          defaultAddress: created.defaultAddress ? {
            id: created.defaultAddress.id,
            label: created.defaultAddress.label,
            street: created.defaultAddress.street,
            city: created.defaultAddress.city,
            state: created.defaultAddress.state,
            zip: created.defaultAddress.zip,
          } : undefined,
        };
        onCustomerCreated(customer);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to create customer: ${errorData.error || "Please try again"}`);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error creating customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Backdrop - No click to close */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-none ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        
        {/* Sheet - Slides down from top */}
        <div className={`absolute left-0 right-0 top-0 max-h-[60vh] bg-neutral-900 border-b border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out pointer-events-auto ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Create New Customer</h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg p-2 transition-all touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto bg-neutral-900 p-3">
            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-2">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Side - User Profile */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-800">
                    <User01 className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Profile</h3>
                  </div>
                  
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-neutral-700 flex items-center justify-center mb-2 shadow-inner overflow-hidden bg-neutral-800 relative">
                      <Image 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed || formData.phone || "new-customer")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                        alt={formData.fullName || "Customer"}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-field="fullName"
                        onClick={() => handleInputFocus("fullName", formData.fullName, "Full Name")}
                        onBlur={handleNameBlur}
                        className={`flex-1 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border rounded-lg text-white text-sm text-left transition-all touch-manipulation flex items-center gap-2 ${
                          activeInput === "fullName"
                            ? 'border-emerald-500/70 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                            : nameError || !formData.fullName
                            ? 'border-red-500/50 hover:border-red-500/70' 
                            : 'border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <User01 className={`w-4 h-4 ${activeInput === "fullName" ? 'text-emerald-400' : nameError ? 'text-red-500' : 'text-neutral-500'}`} />
                        <span className="flex-1 flex items-center">
                          {formData.fullName || <span className="text-neutral-500 italic">Enter full name...</span>}
                          {activeInput === "fullName" && (
                            <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-1 animate-pulse" />
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateRandomName}
                        className="px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded-lg text-neutral-400 hover:text-emerald-400 transition-all touch-manipulation"
                        title="Generate random name"
                      >
                        <RefreshCw01 className="w-4 h-4" />
                      </button>
                    </div>
                    {nameError && (
                      <p className="text-[10px] text-red-400 ml-1 mt-0.5">{nameError}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      data-field="phone"
                      onClick={() => handleInputFocus("phone", formData.phone, "Phone Number")}
                      className={`w-full px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border rounded-lg text-white text-sm font-mono text-left transition-all touch-manipulation flex items-center gap-2 ${
                        activeInput === "phone"
                          ? 'border-emerald-500/70 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                          : phoneError || !formData.phone || formData.phone.replace(/\D/g, "").length !== 10
                          ? 'border-red-500/50 hover:border-red-500/70' 
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <Phone className={`w-4 h-4 ${activeInput === "phone" ? 'text-emerald-400' : phoneError ? 'text-red-500' : 'text-neutral-500'}`} />
                      <span className="flex-1 flex items-center">
                        {formData.phone ? formatPhone(formData.phone) : <span className="text-neutral-500 italic">Enter phone...</span>}
                        {activeInput === "phone" && (
                          <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-1 animate-pulse" />
                        )}
                      </span>
                    </button>
                    {phoneError && (
                      <p className="text-[10px] text-red-400 ml-1 mt-0.5">{phoneError}</p>
                    )}
                  </div>
                </section>

                {/* Right Side - Address */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-800">
                    <MarkerPin01 className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Address</h3>
                  </div>

                  {showAddressForm && address && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          data-field="address_street"
                          onClick={() => handleInputFocus("address_street", address.street, "Street Address")}
                          className={`w-full px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border rounded-lg text-white text-sm text-left transition-all touch-manipulation ${
                            activeInput === "address_street"
                              ? 'border-emerald-500/70 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                              : streetError || !address.street
                              ? 'border-red-500/50 hover:border-red-500/70' 
                              : 'border-neutral-700 hover:border-neutral-600'
                          }`}
                        >
                          <span className="flex items-center">
                            {address.street || <span className="text-neutral-500 italic">Enter street address...</span>}
                            {activeInput === "address_street" && (
                              <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-1 animate-pulse" />
                            )}
                          </span>
                        </button>
                        {streetError && (
                          <p className="text-[10px] text-red-400 ml-1 mt-0.5">{streetError}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                          ZIP <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          data-field="address_zip"
                          onClick={() => handleInputFocus("address_zip", address.zip, "ZIP Code")}
                          className={`w-full px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border rounded-lg text-white text-sm text-left transition-all touch-manipulation ${
                            activeInput === "address_zip"
                              ? 'border-emerald-500/70 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                              : zipError || !address.zip
                              ? 'border-red-500/50 hover:border-red-500/70' 
                              : 'border-neutral-700 hover:border-neutral-600'
                          }`}
                        >
                          <span className="flex items-center">
                            {address.zip || <span className="text-neutral-500 italic">Enter ZIP code...</span>}
                            {activeInput === "address_zip" && (
                              <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-1 animate-pulse" />
                            )}
                          </span>
                        </button>
                        {zipError && (
                          <p className="text-[10px] text-red-400 ml-1 mt-0.5">{zipError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 mt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className="w-3/4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-white font-medium transition-all"
                >
                  {isLoading ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* On-Screen Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
          value={keyboardValue}
          onChange={handleKeyboardChange}
          onClose={handleKeyboardClose}
          inputName={activeInputLabel}
          layout={activeInput === "phone" || activeInput === "address_zip" ? "number" : "default"}
          maxLength={activeInput === "phone" ? 10 : undefined}
        />
      )}
    </>
  );
}

