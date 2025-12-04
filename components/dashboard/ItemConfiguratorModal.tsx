/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { XClose } from "@untitledui/icons";

interface ModifierPrice {
  id: string;
  sizeLabel: string;
  price: string;
}

interface Modifier {
  id: string;
  name: string;
  prices: ModifierPrice[];
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: string;
  categoryId?: string;
  isAvailable?: boolean;
  size?: string | null;
  modifierGroups?: {
    modifierGroup: ModifierGroup;
  }[];
}

interface ItemConfiguratorModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (item: MenuItem, selectedModifiers: Record<string, string[]>) => void;
}

export default function ItemConfiguratorModal({
  item,
  isOpen,
  onClose,
  onAddToOrder,
}: ItemConfiguratorModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(parseFloat(item.basePrice));

  // Reset state when modal opens - intentional initialization
  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers({});
      setCalculatedPrice(parseFloat(item.basePrice));
    }
  }, [isOpen, item.id, item.basePrice]);

  // Calculate total price - intentional derived state calculation
  useEffect(() => {
    let total = parseFloat(item.basePrice);

    item.modifierGroups?.forEach(({ modifierGroup }) => {
      const selected = selectedModifiers[modifierGroup.id] || [];
      selected.forEach((modifierId) => {
        const modifier = modifierGroup.modifiers.find((m) => m.id === modifierId);
        if (modifier) {
          // Find price for this item's size, or use "Default"
          const priceEntry = modifier.prices.find(
            (p) => p.sizeLabel === (item.size || "Default")
          ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];

          if (priceEntry) {
            total += parseFloat(priceEntry.price);
          }
        }
      });
    });

    setCalculatedPrice(total);
  }, [selectedModifiers, item]);

  const handleModifierToggle = (groupId: string, modifierId: string) => {
    const group = item.modifierGroups?.find((mg) => mg.modifierGroup.id === groupId)?.modifierGroup;
    if (!group) return;

    const current = selectedModifiers[groupId] || [];
    const isSelected = current.includes(modifierId);

    let newSelection: string[];

    if (group.maxSelect === 1) {
      // Radio button behavior
      newSelection = isSelected ? [] : [modifierId];
    } else {
      // Checkbox behavior
      if (isSelected) {
        newSelection = current.filter((id) => id !== modifierId);
      } else {
        if (current.length >= group.maxSelect) {
          return; // Can't select more
        }
        newSelection = [...current, modifierId];
      }
    }

    setSelectedModifiers({
      ...selectedModifiers,
      [groupId]: newSelection,
    });
  };

  const handleAddToOrder = () => {
    onAddToOrder(item, selectedModifiers);
    onClose();
  };

  if (!isOpen) return null;

  const canAdd = item.modifierGroups?.every(({ modifierGroup }) => {
    const selected = selectedModifiers[modifierGroup.id] || [];
    return selected.length >= modifierGroup.minSelect && selected.length <= modifierGroup.maxSelect;
  }) ?? true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-emerald-400">${parseFloat(item.basePrice).toFixed(2)}</span>
              {item.modifierGroups && item.modifierGroups.length > 0 && (
                <span className="text-[10px] text-neutral-500">+ modifiers</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            <XClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modifier Groups - Compact Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {item.modifierGroups?.map(({ modifierGroup }) => {
            const selected = selectedModifiers[modifierGroup.id] || [];
            const isRequired = modifierGroup.minSelect > 0;

            return (
              <div key={modifierGroup.id} className="space-y-2.5">
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{modifierGroup.name}</h4>
                    {isRequired && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  {selected.length > 0 && (
                    <span className="text-[10px] text-neutral-500">
                      {selected.length} of {modifierGroup.maxSelect < 99 ? modifierGroup.maxSelect : '∞'} selected
                    </span>
                  )}
                </div>
                
                {/* Modifiers as Pills/Chips */}
                <div className="flex flex-wrap gap-2">
                  {modifierGroup.modifiers.map((modifier) => {
                    const isSelected = selected.includes(modifier.id);
                    const priceEntry = modifier.prices.find(
                      (p) => p.sizeLabel === (item.size || "Default")
                    ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                    const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                    return (
                      <button
                        key={modifier.id}
                        onClick={() => handleModifierToggle(modifierGroup.id, modifier.id)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 text-sm font-medium ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                        }`}
                      >
                        <span>{modifier.name}</span>
                        {modifierPrice > 0 && (
                          <span className={`text-xs font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                            +${modifierPrice.toFixed(2)}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-emerald-400 text-xs">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Compact with Price and Add Button */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Total</span>
            <span className="text-2xl font-bold text-emerald-400">
              ${calculatedPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToOrder}
            disabled={!canAdd}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            {!canAdd ? "Select Required Options" : "Add to Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

