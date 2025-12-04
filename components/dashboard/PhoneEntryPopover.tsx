"use client";

import { useState, useEffect, useRef } from "react";
import { NumericKeypad } from "./NumericKeypad";

interface PhoneEntryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneEntered: (phone: string) => void;
  position: { top: number; left: number };
  orderType: "PICKUP" | "DELIVERY";
}

export function PhoneEntryPopover({
  isOpen,
  onClose,
  onPhoneEntered,
  position,
  orderType,
}: PhoneEntryPopoverProps) {
  const [phone, setPhone] = useState("");
  const [showKeypad, setShowKeypad] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setShowKeypad(true);
    }
  }, [isOpen]);

  const handleDone = () => {
    if (phone.length >= 10) {
      onPhoneEntered(phone);
      setPhone("");
      setShowKeypad(false);
      onClose();
    }
  };

  const handleKeypadClose = () => {
    setShowKeypad(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={popoverRef}
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="w-[300px] rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-b border-emerald-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {orderType === "DELIVERY" ? "🚗 Delivery" : "📦 Pickup"}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Enter phone number</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Phone Display */}
          <div className="p-4 bg-neutral-950/50">
            <div className="relative rounded-xl bg-black/40 border border-neutral-700/50 p-4">
              <div className="text-xs text-neutral-500 mb-1">Phone Number</div>
              <div className="text-2xl font-mono font-bold text-white tracking-widest min-h-[32px]">
                {phone || <span className="text-neutral-600">(   )   -    </span>}
              </div>
            </div>
          </div>

          {/* Quick Number Buttons */}
          <div className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (phone.length < 10) {
                      const newPhone = phone + num.toString();
                      setPhone(newPhone);
                    }
                  }}
                  className="h-12 rounded-lg bg-neutral-800 text-lg font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95 active:bg-emerald-500/20 active:text-emerald-400"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  if (phone.length < 10) {
                    setPhone(phone + "0");
                  }
                }}
                className="h-12 rounded-lg bg-neutral-800 text-lg font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => setPhone(phone.slice(0, -1))}
                className="h-12 rounded-lg bg-neutral-800 text-sm font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
              >
                ⌫
              </button>
              <button
                onClick={() => setPhone("")}
                className="h-12 rounded-lg bg-red-500/10 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
              >
                Clear
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="rounded-lg bg-neutral-800 py-3 text-sm font-bold text-neutral-400 transition-all hover:bg-neutral-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={phone.length < 10}
                className="rounded-lg bg-emerald-500 py-3 text-sm font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Keypad Option (if they want the big keypad) */}
      {showKeypad && (
        <NumericKeypad
          value={phone}
          onChange={setPhone}
          onClose={handleKeypadClose}
          label={`Enter phone for ${orderType.toLowerCase()}`}
          maxLength={10}
        />
      )}
    </>
  );
}

