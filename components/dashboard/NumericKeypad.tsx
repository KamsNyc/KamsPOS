"use client";

import { useState } from "react";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  label?: string;
  maxLength?: number;
}

export function NumericKeypad({
  value,
  onChange,
  onClose,
  label = "Enter number",
  maxLength = 20,
}: NumericKeypadProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const handleNumber = (num: string) => {
    if (displayValue.length < maxLength) {
      const newValue = displayValue + num;
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    const newValue = displayValue.slice(0, -1);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setDisplayValue("");
    onChange("");
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[320px] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-neutral-800/50 p-4 text-center border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{label}</h3>
          <div className="relative rounded-xl bg-black/40 border border-neutral-700/50 p-4">
            <span className="text-3xl font-mono font-bold text-white tracking-widest">
              {displayValue || <span className="text-neutral-600">0</span>}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumber(num.toString())}
                className="h-14 rounded-xl bg-neutral-800 text-2xl font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95 active:bg-emerald-500/20 active:text-emerald-400 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 rounded-xl bg-red-500/10 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
            >
              CLR
            </button>
            <button
              onClick={() => handleNumber("0")}
              className="h-14 rounded-xl bg-neutral-800 text-2xl font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-14 rounded-xl bg-neutral-800 text-xl font-medium text-neutral-200 transition-all hover:bg-neutral-700 active:scale-95"
            >
              ⌫
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-neutral-800 py-3 text-sm font-bold text-neutral-400 transition-all hover:bg-neutral-700 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
