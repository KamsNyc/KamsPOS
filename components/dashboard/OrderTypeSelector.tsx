"use client";

import type { OrderType } from "@prisma/client";

interface OrderTypeSelectorProps {
  value: OrderType | null;
  onChange: (type: OrderType) => void;
}

export function OrderTypeSelector({
  value,
  onChange,
}: OrderTypeSelectorProps) {
  const types: Array<{ value: OrderType; label: string; icon: string }> = [
    { value: "PICKUP", label: "Pickup", icon: "📦" },
    { value: "DELIVERY", label: "Delivery", icon: "🚗" },
    { value: "DINE_IN", label: "Dine-In", icon: "🍽️" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 transition-all active:scale-95 ${
            value === type.value
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "border-neutral-800 bg-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-700"
          }`}
        >
          <span className="text-xl">{type.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide">{type.label}</span>
        </button>
      ))}
    </div>
  );
}
