"use client";

import Image from "next/image";
import type { OrderType } from "@prisma/client";

interface QuickMenuSidebarProps {
  orderType: OrderType | null;
  onOrderTypeChange: (type: OrderType | null) => void;
  categories: Array<{ id: string; name: string; icon?: string | null; imageUrl?: string | null }>;
  onCategoryClick: (categoryId: string) => void;
  selectedCategoryId?: string | null;
}

export function QuickMenuSidebar({
  categories,
  onCategoryClick,
  selectedCategoryId,
}: QuickMenuSidebarProps) {
  return (
    <aside className="flex w-[68px] flex-col border-r border-neutral-800 bg-neutral-900/50 z-20 shrink-0 h-full">
      <div className="flex-1 flex flex-col justify-center gap-1.5 p-1 overflow-y-auto scrollbar-hide">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={`w-full flex-1 min-h-[48px] max-h-[64px] px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? "bg-emerald-500 text-black shadow-sm shadow-emerald-500/30"
                  : "bg-neutral-800/70 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
              title={category.name}
            >
              {category.icon ? (
                <span className="text-xl leading-none">{category.icon}</span>
              ) : category.imageUrl ? (
                <div className="relative w-6 h-6">
                  <Image 
                    src={category.imageUrl} 
                    alt="" 
                    fill
                    className="object-contain"
                    sizes="24px"
                    quality={95}
                  />
                </div>
              ) : (
                <span className="text-xl leading-none">📦</span>
              )}
              <span className="leading-tight text-center line-clamp-2 px-0.5">{category.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
