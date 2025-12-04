"use client";

import { useState, useRef, useEffect } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeypadToggle?: (isOpen: boolean) => void;
  onSearchClick?: () => void;
  defaultOpen?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  className = "",
  onKeypadToggle,
  onSearchClick,
  defaultOpen = false,
}: PhoneInputProps) {
  const [showKeypad, setShowKeypad] = useState(defaultOpen);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);
  const keypadRef = useRef<HTMLDivElement>(null);

  // Notify parent when keypad opens/closes
  useEffect(() => {
    onKeypadToggle?.(showKeypad);
  }, [showKeypad, onKeypadToggle]);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleNumber = (num: string) => {
    if (value.length < 10) {
      const newValue = value + num;
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const handleSearch = () => {
    // Trigger search immediately when Search button is clicked
    if (onSearchClick && value.replace(/\D/g, "").length >= 4) {
      onSearchClick();
    }
    // Close keypad with smooth animation
    setIsClosing(true);
    setTimeout(() => {
      setShowKeypad(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowKeypad(false);
      setIsClosing(false);
    }, 200);
  };

  // Close keypad when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        keypadRef.current &&
        !keypadRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (showKeypad) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showKeypad]);

  return (
    <div className="relative">
      <button
        ref={inputRef}
        type="button"
        onClick={() => setShowKeypad(!showKeypad)}
        className={`w-full rounded-lg bg-black/40 border border-neutral-700/50 px-3 py-3 text-left text-sm font-medium text-white transition-all active:scale-95 ${
          showKeypad ? "ring-2 ring-emerald-500/50 border-emerald-500/50" : "hover:border-neutral-600"
        } ${className}`}
      >
        {value ? formatPhone(value) : <span className="text-neutral-500">{placeholder}</span>}
      </button>

      {showKeypad && (
        <div
          ref={keypadRef}
          className={`absolute left-0 right-0 top-full z-20 mt-1.5 ${
            isClosing 
              ? "animate-out fade-out slide-out-to-top-2 duration-200" 
              : "animate-in fade-in slide-in-from-top-2 duration-200"
          }`}
        >
          <div className="rounded-lg bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
            {/* Numeric Keypad - Compact but still touch-friendly */}
            <div className="p-2.5">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumber(num.toString())}
                    className="h-10 rounded-lg bg-neutral-800 text-base font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95 active:bg-emerald-500/20 active:text-emerald-400"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="h-10 rounded-lg bg-red-500/10 text-[10px] font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
                >
                  CLR
                </button>
                <button
                  onClick={() => handleNumber("0")}
                  className="h-10 rounded-lg bg-neutral-800 text-base font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-10 rounded-lg bg-neutral-800 text-base font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
                >
                  ⌫
                </button>
              </div>

              {/* Search Button - Compact */}
              <button
                onClick={handleSearch}
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
