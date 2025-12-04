"use client";

import { useState, useEffect, useCallback } from "react";
import { PhoneInput } from "./PhoneInput";
import { Plus } from "@untitledui/icons";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  defaultAddress?: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface CustomerSearchProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  required: boolean;
  onKeypadToggle?: (isOpen: boolean) => void;
  onSearchTrigger?: () => void; // kept in interface for API compatibility
  onCreateCustomer?: (phone: string) => void;
  defaultKeypadOpen?: boolean;
}

export function CustomerSearch({
  phone,
  onPhoneChange,
  onCustomerSelect,
  required,
  onKeypadToggle,
  onCreateCustomer,
  defaultKeypadOpen = false,
}: CustomerSearchProps) {
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [shouldSearch, setShouldSearch] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(defaultKeypadOpen);

  // Search function that can be called immediately or debounced
  const performSearch = useCallback(async (): Promise<boolean> => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone || digitsOnly.length < 4) {
      setSearchResults([]);
      setSelectedCustomer(null);
      onCustomerSelect(null);
      setIsSearching(false);
      return false;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/customers?phone=${encodeURIComponent(phone)}&pageSize=5`,
      );
      const data = await response.json();
      const results = data.items || [];
      setSearchResults(results);

      // Auto-select if exact match
      const exactMatch = results.find(
        (c: Customer) => c.phone.replace(/\D/g, "") === digitsOnly,
      );
      if (exactMatch) {
        setSelectedCustomer(exactMatch);
        onCustomerSelect(exactMatch);
        return false; // Customer found, don't open create modal
      } else {
        setSelectedCustomer(null);
        onCustomerSelect(null);
        // Return true if 10 digits and no results (should open create modal)
        return digitsOnly.length === 10 && results.length === 0;
      }
    } catch (error) {
      console.error("Customer search error:", error);
      return false;
    } finally {
      setIsSearching(false);
    }
  }, [phone, onCustomerSelect]);

  // Handle immediate search trigger (from Search button)
  useEffect(() => {
    if (shouldSearch) {
      setShouldSearch(false);
      performSearch().then((shouldOpenCreateModal) => {
        // If search found no customer and it's 10 digits, open create modal
        if (shouldOpenCreateModal) {
          onCreateCustomer?.(phone);
        }
      });
    }
  }, [shouldSearch, performSearch, phone, onCreateCustomer]);

  // Debounced search while typing (reduces API calls)
  useEffect(() => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (!phone || digitsOnly.length < 4) {
      setSearchResults([]);
      setSelectedCustomer(null);
      onCustomerSelect(null);
      setIsSearching(false);
      return;
    }

    // Skip debounce if we just triggered a manual search
    if (shouldSearch) {
      return;
    }

    // Debounce to 600ms to reduce API calls while typing
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [phone, performSearch, shouldSearch]);

  // Reset selected customer when phone changes significantly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 4) {
      setSelectedCustomer(null);
      onCustomerSelect(null);
      setIsSearching(false);
    }
  }, [phone]); // onCustomerSelect intentionally omitted - only react to phone changes

  return (
    <div className="space-y-3">
      {/* Customer Input Section - Always visible when no customer selected */}
      {!selectedCustomer && (
        <>
          {/* Phone Number Input Section */}
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="mb-2 block text-xs font-medium text-neutral-400">
              Phone Number {required && <span className="text-red-400">*</span>}
            </label>
            <PhoneInput 
              value={phone} 
              onChange={onPhoneChange}
              onKeypadToggle={(open) => {
                setIsKeypadOpen(open);
                onKeypadToggle?.(open);
              }}
              onSearchClick={() => {
                const digitsOnly = phone.replace(/\D/g, "");
                if (digitsOnly.length >= 4) {
                  setShouldSearch(true);
                }
              }}
              defaultOpen={defaultKeypadOpen}
            />
          </div>
          
          {/* Customer Search Results Section - Separate section below keypad */}
          {/* This section appears below the keypad with proper spacing and is scrollable */}
          <div 
            className={`space-y-2 transition-all duration-300 ${
              isKeypadOpen ? 'mt-[260px]' : 'mt-3'
            }`}
          >
            {/* Searching Indicator */}
            {isSearching && phone.replace(/\D/g, "").length >= 4 && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                <span className="text-xs font-medium text-neutral-300">Searching...</span>
              </div>
            )}

            {/* Search Results - Show recommendations with scrollable container */}
            {!isSearching && 
             searchResults.length > 0 && 
             phone.replace(/\D/g, "").length >= 4 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-[9px] text-neutral-500 uppercase tracking-wider px-1 mb-1.5">Recommended:</div>
                {/* Scrollable container for recommendations */}
                <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        onCustomerSelect(customer);
                      }}
                      className="w-full rounded-lg bg-neutral-800/60 border border-neutral-700/50 p-2.5 text-left transition-all hover:bg-neutral-800 hover:border-emerald-500/50 active:scale-95"
                    >
                      <div className="font-semibold text-xs text-neutral-200">{customer.fullName}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{customer.phone}</div>
                      {customer.defaultAddress && (
                        <div className="text-[9px] text-neutral-500 mt-1">
                          📍 {customer.defaultAddress.street}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Customer Button - Show when 10 digits and no customer found */}
            {!isSearching &&
              phone.replace(/\D/g, "").length === 10 &&
              searchResults.length === 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => onCreateCustomer?.(phone)}
                    className="w-full rounded-lg bg-emerald-500/20 border-2 border-emerald-500/50 p-3 text-left transition-all hover:bg-emerald-500/30 hover:border-emerald-500 active:scale-95 flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-emerald-400">Create New Customer</div>
                      <div className="text-xs text-emerald-300/70 mt-0.5">Add customer with this phone number</div>
                    </div>
                  </button>
                </div>
              )}

            {/* No Customer Found Message - Show for 4-9 digits */}
            {!isSearching &&
              phone.replace(/\D/g, "").length >= 4 &&
              phone.replace(/\D/g, "").length < 10 &&
              searchResults.length === 0 && (
                <div className="text-[10px] text-neutral-500 animate-in fade-in duration-200 px-1">
                  No customer found. Continue typing to search or create new customer.
                </div>
              )}
          </div>
        </>
      )}

      {/* Selected Customer - Hide input when customer is found */}
      {selectedCustomer && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-bold text-sm text-emerald-400 mb-1">
                {selectedCustomer.fullName}
              </div>
              <div className="text-xs text-emerald-300/80">{selectedCustomer.phone}</div>
              {selectedCustomer.defaultAddress && (
                <div className="mt-2 text-xs text-emerald-200/70">
                  📍 {selectedCustomer.defaultAddress.street}, {selectedCustomer.defaultAddress.city}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                onCustomerSelect(null);
                onPhoneChange("");
              }}
              className="ml-2 rounded-lg p-1.5 text-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
              title="Change customer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
