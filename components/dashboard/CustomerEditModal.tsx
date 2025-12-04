"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import OnScreenKeyboard from "./OnScreenKeyboard";
import {
  X,
  User01,
  MarkerPin01,
  ShoppingBag03,
  BankNote01,
  Calendar,
  Clock,
  Plus,
  Phone,
  Edit01
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
  notes?: string;
  defaultAddress?: Address;
  addresses?: Address[];
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
}

interface CustomerEditModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCustomer: Customer) => void;
}

export default function CustomerEditModal({
  customer,
  isOpen,
  onClose,
  onUpdate,
}: CustomerEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
  });
  const [addresses, setAddresses] = useState<Address[]>(
    customer.addresses || []
  );
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [activeInputLabel, setActiveInputLabel] = useState<string>("");
  const [keyboardValue, setKeyboardValue] = useState("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [avatarError, setAvatarError] = useState(false);
  
  // Address editing state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressData, setEditingAddressData] = useState<Address | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      setFormData({
        fullName: customer.fullName,
        phone: customer.phone,
      });
      setAddresses(customer.addresses || []);
      setAvatarError(false); // Reset avatar error when customer changes
    }
  }, [isOpen, customer]);

  const handleInputFocus = (field: string, currentValue: string, label: string) => {
    setActiveInput(field);
    setActiveInputLabel(label);
    setKeyboardValue(currentValue);
  };

  const validatePhone = (phone: string): string => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required";
    }
    // Remove all non-digits
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
      if (editingAddressData) {
        const fieldName = activeInput.replace('address_', '');
        setEditingAddressData({
          ...editingAddressData,
          [fieldName]: value
        });
      }
    } else {
      // Handle customer form updates
      const newFormData = {
        ...formData,
        [activeInput!]: value,
      };
      setFormData(newFormData);
      
      // Validate phone in real-time
      if (activeInput === "phone") {
        const error = validatePhone(value);
        setPhoneError(error);
      }
    }
  };

  const handleKeyboardClose = () => {
    setActiveInput(null);
    setActiveInputLabel("");
    setKeyboardValue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save any unsaved address edits first
    if (editingAddressId && editingAddressData) {
      setAddresses(prev => prev.map(addr => 
        addr.id === editingAddressData.id ? editingAddressData : addr
      ));
      setEditingAddressId(null);
      setEditingAddressData(null);
    }
    
    // Validate phone number
    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      // Scroll to phone field
      setTimeout(() => {
        const phoneButton = document.querySelector('[data-field="phone"]');
        phoneButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    // Validate full name
    if (!formData.fullName || formData.fullName.trim() === "") {
      alert("Full name is required");
      return;
    }
    
    setIsLoading(true);
    setPhoneError("");

    try {
      // Get the latest addresses state (in case we just saved an edit)
      const finalAddresses = editingAddressId && editingAddressData
        ? addresses.map(addr => 
            addr.id === editingAddressData.id ? editingAddressData : addr
          )
        : addresses;
      
      // Normalize phone (remove non-digits)
      const normalizedPhone = formData.phone.replace(/\D/g, "");
      
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: normalizedPhone,
          addresses: finalAddresses.map((addr) => ({
            id: addr.id,
            label: addr.label,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            extraDirections: addr.extraDirections,
            isDefault: addr.isDefault,
          })),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to update customer: ${errorData.error || "Please try again"}`);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Error updating customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setEditingAddressData({ ...address });
  };

  const handleSaveAddress = () => {
    if (!editingAddressData) return;
    
    setAddresses(prev => prev.map(addr => 
      addr.id === editingAddressData.id ? editingAddressData : addr
    ));
    setEditingAddressId(null);
    setEditingAddressData(null);
  };

  const handleAddNewAddress = () => {
    const newId = `new_${Date.now()}`;
    const newAddress: Address = {
      id: newId,
      label: "Home",
      street: "",
      city: "",
      state: "",
      zip: "",
      extraDirections: "",
      isDefault: addresses.length === 0
    };
    setAddresses(prev => [...prev, newAddress]);
    handleEditAddress(newAddress);
  };

  if (!isOpen) return null;

  // Calculate average order
  const averageOrder =
    customer.orderCount && customer.orderCount > 0 && customer.totalSpent
      ? customer.totalSpent / customer.orderCount
      : 0;

  // Format dates
  const customerSince = new Date(customer.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const lastOrderDate = customer.lastOrderDate
    ? new Date(customer.lastOrderDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <User01 className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Edit Customer Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg p-2 transition-all touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content - Sidebar + Form */}
          <div className="flex-1 flex overflow-hidden bg-neutral-900">
            {/* Stats Sidebar - More Compact */}
            <div className="w-56 border-r border-neutral-800 bg-neutral-900/50 p-4 hidden md:flex flex-col gap-4 overflow-y-auto">
              {/* Profile Summary */}
              <div className="relative flex flex-col items-center text-center pb-4 border-b border-neutral-800">
                {/* Since Badge - Top Left */}
                <div className="absolute top-0 left-0 bg-neutral-800/80 border border-neutral-700 rounded-md px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-wide">Since</span>
                    <span className="text-[9px] font-semibold text-neutral-300">{customerSince}</span>
                  </div>
                </div>
                
                <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center mb-2 shadow-inner mt-6 overflow-hidden bg-neutral-800 relative">
                  {avatarError ? (
                    <span className="text-xl font-bold text-neutral-300">
                      {customer.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  ) : (
                    <Image 
                      src={customer.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customer.fullName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                      alt={customer.fullName}
                      fill
                      className="object-cover"
                      sizes="64px"
                      quality={95}
                      unoptimized
                      onError={() => setAvatarError(true)}
                    />
                  )}
                </div>
                <div className="text-sm font-semibold text-white mb-0.5 truncate w-full px-2">{customer.fullName}</div>
                <div className="text-xs text-neutral-400 font-mono bg-neutral-800 px-2 py-0.5 rounded">{customer.phone}</div>
              </div>

              {/* Stats List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30">
                  <ShoppingBag03 className="w-4 h-4 text-emerald-500" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-medium text-neutral-500">Orders</div>
                    <div className="text-sm font-bold text-emerald-400">{customer.orderCount || 0}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30">
                  <BankNote01 className="w-4 h-4 text-emerald-500" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-medium text-neutral-500">Total Spent</div>
                    <div className="text-sm font-bold text-emerald-400">${customer.totalSpent?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>

                {averageOrder > 0 && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30">
                    <BankNote01 className="w-4 h-4 text-neutral-500" />
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-wider font-medium text-neutral-500">Avg Order</div>
                      <div className="text-xs font-medium text-neutral-300">${averageOrder.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-medium text-neutral-500">Last Order</div>
                    <div className="text-xs font-medium text-neutral-300">{lastOrderDate}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-900 p-5">
              <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-20">
                {/* Contact Info Section - More Compact */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-800">
                    <User01 className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Contact Info</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                        Full Name
                      </label>
                      <button
                        type="button"
                        onClick={() => handleInputFocus("fullName", formData.fullName, "Full Name")}
                        className="w-full px-3 py-2.5 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded-lg text-white text-sm text-left transition-all touch-manipulation flex items-center gap-2"
                      >
                        <User01 className="w-4 h-4 text-neutral-500" />
                        {formData.fullName || <span className="text-neutral-500 italic">Enter full name...</span>}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide ml-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        data-field="phone"
                        onClick={() => handleInputFocus("phone", formData.phone, "Phone Number")}
                        className={`w-full px-3 py-2.5 bg-neutral-800/50 hover:bg-neutral-800 border rounded-lg text-white text-sm text-left font-mono transition-all touch-manipulation flex items-center gap-2 ${
                          phoneError 
                            ? 'border-red-500/50 hover:border-red-500/70' 
                            : 'border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <Phone className={`w-4 h-4 ${phoneError ? 'text-red-500' : 'text-neutral-500'}`} />
                        {formData.phone || <span className="text-neutral-500 italic">Enter phone...</span>}
                      </button>
                      {phoneError && (
                        <p className="text-[10px] text-red-400 ml-1 mt-0.5">{phoneError}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Addresses Section */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <MarkerPin01 className="w-3.5 h-3.5 text-emerald-500" />
                      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Addresses</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddNewAddress}
                      className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      ADD NEW
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-6 bg-neutral-800/30 rounded-lg border border-dashed border-neutral-800">
                      <p className="text-xs text-neutral-500">No addresses saved</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`group relative bg-neutral-800/40 hover:bg-neutral-800 border ${
                            address.isDefault 
                              ? 'border-emerald-500/30 bg-emerald-500/5' 
                              : 'border-neutral-700 hover:border-neutral-600'
                          } rounded-lg p-3 transition-all duration-200`}
                        >
                          {editingAddressId === address.id ? (
                            <div className="space-y-3 p-1">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleInputFocus("address_label", editingAddressData?.label || "", "Label")}
                                  className="col-span-2 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm text-left"
                                >
                                  {editingAddressData?.label || "Label"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputFocus("address_street", editingAddressData?.street || "", "Street")}
                                  className="col-span-2 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm text-left"
                                >
                                  {editingAddressData?.street || "Street Address"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputFocus("address_city", editingAddressData?.city || "", "City")}
                                  className="px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm text-left"
                                >
                                  {editingAddressData?.city || "City"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputFocus("address_zip", editingAddressData?.zip || "", "ZIP")}
                                  className="px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm text-left"
                                >
                                  {editingAddressData?.zip || "ZIP"}
                                </button>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  onClick={() => setEditingAddressId(null)}
                                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveAddress}
                                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleEditAddress(address)}
                              className="flex items-start gap-3 cursor-pointer"
                            >
                              <div className={`p-2 rounded-md mt-0.5 ${
                                address.isDefault ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/50 text-neutral-400'
                              }`}>
                                <MarkerPin01 className="w-4 h-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold text-white">
                                    {address.label}
                                  </span>
                                  {address.isDefault && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold tracking-wide">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-neutral-300">
                                  {address.street || <span className="text-neutral-500 italic">No street address</span>}
                                </div>
                                <div className="text-xs text-neutral-400">
                                  {address.city}, {address.state} {address.zip}
                                </div>
                              </div>

                              {!address.isDefault && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefaultAddress(address.id);
                                  }}
                                  className="px-2 py-1 text-[10px] font-medium bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                                >
                                  Set Default
                                </button>
                              )}
                              <div className="p-1 text-neutral-500">
                                <Edit01 className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-800 bg-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-800 rounded-lg transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
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
