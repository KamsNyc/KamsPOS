"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XClose, ChevronDown, ChevronUp } from "@untitledui/icons";

// Pizza Size SVG Component
const PizzaSizeSVG = ({ sizeName, isSelected }: { sizeName: string; isSelected: boolean }) => {
  const sizeLower = sizeName.toLowerCase();
  
  // Determine size multiplier based on name
  let sizeMultiplier = 1;
  if (sizeLower.includes("junior")) {
    sizeMultiplier = 0.6; // Smallest
  } else if (sizeLower.includes("small") || sizeLower.includes("med")) {
    sizeMultiplier = 0.75;
  } else if (sizeLower.includes("large") && !sizeLower.includes("extra") && !sizeLower.includes("xl")) {
    sizeMultiplier = 1;
  } else if (sizeLower.includes("extra") || sizeLower.includes("xl")) {
    sizeMultiplier = 1.3; // Largest
  }
  
  const baseSize = 60;
  const diameter = baseSize * sizeMultiplier;
  const radius = diameter / 2;
  const strokeWidth = isSelected ? 3 : 2;
  const color = isSelected ? "#10b981" : "#525252"; // emerald-500 : neutral-600
  
  return (
    <svg 
      width={diameter + 20} 
      height={diameter + 20} 
      viewBox={`0 0 ${diameter + 20} ${diameter + 20}`}
      className="transition-all"
    >
      {/* Outer circle (crust) */}
      <circle
        cx={(diameter + 20) / 2}
        cy={(diameter + 20) / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        className="transition-all"
      />
      
      {/* Inner circle (cheese/base) */}
      <circle
        cx={(diameter + 20) / 2}
        cy={(diameter + 20) / 2}
        r={radius * 0.85}
        fill={isSelected ? "rgba(16, 185, 129, 0.1)" : "rgba(82, 82, 82, 0.05)"}
        stroke="none"
        className="transition-all"
      />
      
      {/* Pizza slices indicator (8 slices) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const radian = (angle * Math.PI) / 180;
        const x1 = (diameter + 20) / 2 + Math.cos(radian) * (radius * 0.85);
        const y1 = (diameter + 20) / 2 + Math.sin(radian) * (radius * 0.85);
        const x2 = (diameter + 20) / 2 + Math.cos(radian) * radius;
        const y2 = (diameter + 20) / 2 + Math.sin(radian) * radius;
        
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1}
            opacity={0.3}
            className="transition-all"
          />
        );
      })}
      
      {/* Center dot */}
      <circle
        cx={(diameter + 20) / 2}
        cy={(diameter + 20) / 2}
        r={radius * 0.15}
        fill={color}
        opacity={0.5}
        className="transition-all"
      />
    </svg>
  );
};

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

interface ItemConfiguratorDrawerProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (item: MenuItem, selectedModifiers: Record<string, string[]>) => void;
}

export default function ItemConfiguratorDrawer({
  item,
  isOpen,
  onClose,
  onAddToOrder,
}: ItemConfiguratorDrawerProps) {
  // Detect if this is a pizza - check for Whole/Half modifier group
  // If item has a modifier group with "whole" and "half" modifiers, it's a pizza
  const isPizza = item.modifierGroups?.some(({ modifierGroup }) => {
    const hasWhole = modifierGroup.modifiers.some(m => 
      m.name.toLowerCase().includes("whole")
    );
    const hasHalf = modifierGroup.modifiers.some(m => 
      m.name.toLowerCase().includes("half")
    );
    return hasWhole && hasHalf;
  }) || item.name.toLowerCase().includes("pizza");
  
  // Pizza-specific state
  const [selectedPizzaSize, setSelectedPizzaSize] = useState<string | null>(null);
  const [pizzaStage, setPizzaStage] = useState<"size" | "toppings">("size");
  const [wholeToppings, setWholeToppings] = useState<Set<string>>(new Set());
  const [halfToppings, setHalfToppings] = useState<Set<string>>(new Set());
  const [halfSide, setHalfSide] = useState<"left" | "right" | null>(null);
  
  // Regular state (for non-pizza items)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(parseFloat(item.basePrice));
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [wholeHalfSelection, setWholeHalfSelection] = useState<"whole" | "half" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers({});
      setCalculatedPrice(parseFloat(item.basePrice));
      setCollapsedGroups(new Set());
      setWholeHalfSelection(null);
      setSelectedPizzaSize(null);
      setPizzaStage("size");
      setWholeToppings(new Set());
      setHalfToppings(new Set());
      setHalfSide(null);
    }
  }, [isOpen, item]);

  // Get size group and toppings group for pizza
  const sizeGroup = isPizza ? item.modifierGroups?.find(({ modifierGroup }) => 
    modifierGroup.name.toLowerCase().includes("size") || 
    modifierGroup.modifiers.some(m => 
      ["small", "medium", "large", "extra large", "xl", "junior", "small/med"].includes(m.name.toLowerCase())
    )
  )?.modifierGroup : null;

  const wholeHalfGroup = isPizza ? item.modifierGroups?.find(({ modifierGroup }) =>
    modifierGroup.modifiers.some(m => 
      m.name.toLowerCase().includes("whole") || 
      m.name.toLowerCase().includes("half")
    )
  )?.modifierGroup : null;

  const toppingsGroup = isPizza ? item.modifierGroups?.find(({ modifierGroup }) =>
    !modifierGroup.name.toLowerCase().includes("size") &&
    !modifierGroup.modifiers.some(m => 
      m.name.toLowerCase().includes("whole") || 
      m.name.toLowerCase().includes("half")
    )
  )?.modifierGroup : null;

  // Get selected size modifier name for pricing
  const selectedSizeName = selectedPizzaSize 
    ? sizeGroup?.modifiers.find(m => m.id === selectedPizzaSize)?.name || null
    : null;

  // Calculate total price
  useEffect(() => {
    let total = parseFloat(item.basePrice);
    
    if (isPizza && selectedPizzaSize && selectedSizeName) {
      // Add size price
      const sizeModifier = sizeGroup?.modifiers.find(m => m.id === selectedPizzaSize);
      if (sizeModifier) {
        const sizePriceEntry = sizeModifier.prices.find(
          (p) => p.sizeLabel === selectedSizeName
        ) || sizeModifier.prices.find((p) => p.sizeLabel === "Default") || sizeModifier.prices[0];
        if (sizePriceEntry) {
          total += parseFloat(sizePriceEntry.price);
        }
      }

      // Add whole toppings prices
      if (toppingsGroup) {
        wholeToppings.forEach((toppingId) => {
          const topping = toppingsGroup.modifiers.find((m) => m.id === toppingId);
          if (topping) {
            // Find price for whole topping at selected size
            const wholePriceEntry = topping.prices.find(
              (p) => p.sizeLabel === `${selectedSizeName} Whole` || p.sizeLabel === `${selectedSizeName}-Whole` || p.sizeLabel === `Whole ${selectedSizeName}`
            ) || topping.prices.find((p) => p.sizeLabel === selectedSizeName) || topping.prices.find((p) => p.sizeLabel === "Default") || topping.prices[0];
            if (wholePriceEntry) {
              total += parseFloat(wholePriceEntry.price);
            }
          }
        });

        // Add half toppings prices
        halfToppings.forEach((toppingId) => {
          const topping = toppingsGroup.modifiers.find((m) => m.id === toppingId);
          if (topping) {
            // Find price for half topping at selected size
            const halfPriceEntry = topping.prices.find(
              (p) => p.sizeLabel === `${selectedSizeName} Half` || p.sizeLabel === `${selectedSizeName}-Half` || p.sizeLabel === `Half ${selectedSizeName}`
            ) || topping.prices.find((p) => p.sizeLabel === selectedSizeName) || topping.prices.find((p) => p.sizeLabel === "Default") || topping.prices[0];
            if (halfPriceEntry) {
              total += parseFloat(halfPriceEntry.price);
            }
          }
        });
      }
    } else {
      // Regular pricing for non-pizza items
      item.modifierGroups?.forEach(({ modifierGroup }) => {
        const selected = selectedModifiers[modifierGroup.id] || [];
        selected.forEach((modifierId) => {
          const modifier = modifierGroup.modifiers.find((m) => m.id === modifierId);
          if (modifier) {
            const priceEntry = modifier.prices.find(
              (p) => p.sizeLabel === (item.size || "Default")
            ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
            
            if (priceEntry) {
              total += parseFloat(priceEntry.price);
            }
          }
        });
      });
    }

    setCalculatedPrice(total);
  }, [selectedModifiers, selectedPizzaSize, wholeToppings, halfToppings, item, isPizza, selectedSizeName, sizeGroup, toppingsGroup]);

  // Handle pizza size selection
  const handlePizzaSizeSelect = (sizeId: string) => {
    setSelectedPizzaSize(sizeId);
    setPizzaStage("toppings");
  };

  // Handle whole/half toggle for pizza - toggle between views, but keep both selections
  const handleWholeHalfToggle = (value: "whole" | "half") => {
    if (wholeHalfSelection === value) {
      // If clicking the same one, deselect the view (but keep toppings)
      setWholeHalfSelection(null);
    } else {
      // Switch to the other view (keep all toppings)
      setWholeHalfSelection(value);
    }
  };

  // Handle topping toggle for pizza
  const handlePizzaToppingToggle = (toppingId: string, type: "whole" | "half") => {
    if (type === "whole") {
      setWholeToppings(prev => {
        const newSet = new Set(prev);
        if (newSet.has(toppingId)) {
          newSet.delete(toppingId);
        } else {
          newSet.add(toppingId);
        }
        return newSet;
      });
    } else {
      setHalfToppings(prev => {
        const newSet = new Set(prev);
        if (newSet.has(toppingId)) {
          newSet.delete(toppingId);
        } else {
          newSet.add(toppingId);
        }
        return newSet;
      });
    }
  };

  // Get price for a topping based on size and type (whole/half)
  const getToppingPrice = (topping: Modifier, type: "whole" | "half"): number => {
    if (!selectedSizeName) return 0;
    
    const typeLabel = type === "whole" ? "Whole" : "Half";
    
    // Try to find specific price for this size and type
    const specificPrice = topping.prices.find(
      (p) => p.sizeLabel === `${selectedSizeName} ${typeLabel}` ||
            p.sizeLabel === `${selectedSizeName}-${typeLabel}` ||
            p.sizeLabel === `${typeLabel} ${selectedSizeName}`
    );
    
    if (specificPrice) return parseFloat(specificPrice.price);
    
    // Fallback to size-specific price
    const sizePrice = topping.prices.find((p) => p.sizeLabel === selectedSizeName);
    if (sizePrice) return parseFloat(sizePrice.price);
    
    // Fallback to default
    const defaultPrice = topping.prices.find((p) => p.sizeLabel === "Default");
    if (defaultPrice) return parseFloat(defaultPrice.price);
    
    return topping.prices[0] ? parseFloat(topping.prices[0].price) : 0;
  };

  // Check if this is a Size group (for non-pizza items)
  const isSizeGroup = (group: ModifierGroup) => {
    return group.name.toLowerCase().includes("size") || 
           group.modifiers.some(m => 
             ["small", "medium", "large", "extra large", "xl"].includes(m.name.toLowerCase())
           );
  };

  // Check if this is a Whole/Half group (for non-pizza items)
  const isWholeHalfGroup = (group: ModifierGroup) => {
    return group.modifiers.some(m => 
      m.name.toLowerCase().includes("whole") || 
      m.name.toLowerCase().includes("half")
    );
  };

  // Check if whole/half is selected in any group (for non-pizza items)
  const getWholeHalfSelection = () => {
    for (const { modifierGroup } of item.modifierGroups || []) {
      if (isWholeHalfGroup(modifierGroup)) {
        const selected = selectedModifiers[modifierGroup.id] || [];
        if (selected.length > 0) {
          const selectedMod = modifierGroup.modifiers.find(m => selected.includes(m.id));
          if (selectedMod) {
            if (selectedMod.name.toLowerCase().includes("whole")) {
              return "whole";
            } else if (selectedMod.name.toLowerCase().includes("half")) {
              return "half";
            }
          }
        }
      }
    }
    return null;
  };

  // Auto-collapse logic for non-pizza items
  useEffect(() => {
    if (isPizza) return;
    
    item.modifierGroups?.forEach(({ modifierGroup }) => {
      const selected = selectedModifiers[modifierGroup.id] || [];
      const isComplete = 
        selected.length >= modifierGroup.minSelect && 
        (modifierGroup.maxSelect === 1 || selected.length === modifierGroup.maxSelect);
      
      if (isComplete && !collapsedGroups.has(modifierGroup.id)) {
        setCollapsedGroups(prev => new Set(prev).add(modifierGroup.id));
      }
    });
  }, [selectedModifiers, item.modifierGroups, collapsedGroups, isPizza]);

  // Detect whole/half selection for non-pizza items
  useEffect(() => {
    if (isPizza) return;
    const selection = getWholeHalfSelection();
    setWholeHalfSelection(selection);
    if (selection === "whole") {
      setHalfSide(null);
    }
  }, [selectedModifiers, item.modifierGroups, isPizza]);

  const handleModifierToggle = (groupId: string, modifierId: string, side?: "whole" | "half") => {
    const group = item.modifierGroups?.find((mg) => mg.modifierGroup.id === groupId)?.modifierGroup;
    if (!group) return;

    const current = selectedModifiers[groupId] || [];
    const isSelected = current.includes(modifierId);

    let newSelection: string[];

    if (group.maxSelect === 1) {
      newSelection = isSelected ? [] : [modifierId];
    } else {
      if (isSelected) {
        newSelection = current.filter((id) => id !== modifierId);
      } else {
        if (current.length >= group.maxSelect) {
          return;
        }
        newSelection = [...current, modifierId];
      }
    }

    setSelectedModifiers({
      ...selectedModifiers,
      [groupId]: newSelection,
    });
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleAddToOrder = () => {
    if (isPizza && selectedPizzaSize) {
      // Build modifier selections for pizza
      const pizzaModifiers: Record<string, string[]> = {};
      
      // Add size selection
      if (sizeGroup) {
        pizzaModifiers[sizeGroup.id] = [selectedPizzaSize];
      }
      
      // Add whole/half selection - include both if both have toppings
      if (wholeHalfGroup) {
        const selections: string[] = [];
        if (wholeToppings.size > 0) {
          const wholeMod = wholeHalfGroup.modifiers.find(m => m.name.toLowerCase().includes("whole"));
          if (wholeMod) selections.push(wholeMod.id);
        }
        if (halfToppings.size > 0) {
          const halfMod = wholeHalfGroup.modifiers.find(m => m.name.toLowerCase().includes("half"));
          if (halfMod) selections.push(halfMod.id);
        }
        if (selections.length > 0) {
          pizzaModifiers[wholeHalfGroup.id] = selections;
        }
      }
      
      // Add toppings - combine whole and half toppings
      if (toppingsGroup) {
        pizzaModifiers[toppingsGroup.id] = Array.from(new Set([...wholeToppings, ...halfToppings]));
      }
      
      onAddToOrder(item, pizzaModifiers);
    } else {
      onAddToOrder(item, selectedModifiers);
    }
    onClose();
  };

  // Validation for pizza - need size and at least one topping (whole or half)
  const canAddPizza = isPizza 
    ? selectedPizzaSize !== null && 
      (wholeToppings.size > 0 || (halfToppings.size > 0 && (wholeToppings.size === 0 || halfSide !== null)))
    : true;

  // Validation for non-pizza items
  const canAdd = !isPizza && (item.modifierGroups?.every(({ modifierGroup }) => {
    const selected = selectedModifiers[modifierGroup.id] || [];
    return selected.length >= modifierGroup.minSelect && selected.length <= modifierGroup.maxSelect;
  }) ?? true);

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-auto ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      {/* Drawer - Slides in from left, takes up 85% width (or 80% for size stage, 85% for toppings) */}
      <div className={`absolute left-0 top-0 bottom-0 ${isPizza && pizzaStage === "toppings" ? "w-[85%]" : "w-[80%]"} max-w-3xl bg-neutral-900 border-r border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out pointer-events-auto ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{item.name}</h3>
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

        {/* Content - Pizza Mode */}
        {isPizza ? (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {pizzaStage === "size" ? (
              /* Stage 1: Size Selection */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Pizza Size</h4>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sizeGroup?.modifiers
                    .slice()
                    .sort((a, b) => {
                      // Order: Junior → Small/Med → Large → Extra Large
                      const getSizeOrder = (name: string): number => {
                        const lower = name.toLowerCase();
                        if (lower.includes("junior")) return 1;
                        if (lower.includes("small") || lower.includes("med")) return 2;
                        if (lower.includes("large") && !lower.includes("extra") && !lower.includes("xl")) return 3;
                        if (lower.includes("extra") || lower.includes("xl")) return 4;
                        return 5; // Unknown sizes go last
                      };
                      return getSizeOrder(a.name) - getSizeOrder(b.name);
                    })
                    .map((size) => {
                    const isSelected = selectedPizzaSize === size.id;
                    const sizePriceEntry = size.prices.find(
                      (p) => p.sizeLabel === size.name
                    ) || size.prices.find((p) => p.sizeLabel === "Default") || size.prices[0];
                    const sizePrice = sizePriceEntry ? parseFloat(sizePriceEntry.price) : 0;

                    return (
                      <button
                        key={size.id}
                        onClick={() => handlePizzaSizeSelect(size.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                        }`}
                      >
                        {/* Pizza pie visual - SVG with size-based scaling */}
                        <div className={`flex items-center justify-center ${
                          isSelected ? "text-emerald-500" : "text-neutral-600"
                        }`}>
                          <PizzaSizeSVG sizeName={size.name} isSelected={isSelected} />
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-neutral-300"}`}>
                          {size.name}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                          {sizePrice > 0 ? `+$${sizePrice.toFixed(2)}` : "$0.00"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Stage 2: Toppings Selection */
              <div className="space-y-4">
                {/* Whole/Half Selection */}
                {wholeHalfGroup && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Whole/Half</h4>
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleWholeHalfToggle("whole")}
                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          wholeHalfSelection === "whole"
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                        }`}
                      >
                        Whole {wholeHalfSelection === "whole" && "✓"} {wholeToppings.size > 0 && `(${wholeToppings.size})`}
                      </button>
                      <button
                        onClick={() => handleWholeHalfToggle("half")}
                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          wholeHalfSelection === "half"
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                        }`}
                      >
                        Half {wholeHalfSelection === "half" && "✓"} {halfToppings.size > 0 && `(${halfToppings.size})`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Toppings - Show based on Whole/Half selection (single selection) */}
                {toppingsGroup && wholeHalfSelection && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white">Pizza Toppings</h4>
                    
                    {/* Left/Right Selection for Half - ONLY if Whole has toppings */}
                    {wholeHalfSelection === "half" && !halfSide && wholeToppings.size > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                          Select Side for Half
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setHalfSide("left")}
                            className="px-4 py-3 rounded-lg border-2 border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                          >
                            Left
                          </button>
                          <button
                            onClick={() => setHalfSide("right")}
                            className="px-4 py-3 rounded-lg border-2 border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show toppings based on selected type */}
                    {((wholeHalfSelection === "whole") || (wholeHalfSelection === "half" && (halfSide || wholeToppings.size === 0))) && (
                      <div className="grid grid-cols-4 gap-2">
                        {toppingsGroup.modifiers.map((topping) => {
                          const type = wholeHalfSelection;
                          const isSelected = type === "whole" 
                            ? wholeToppings.has(topping.id)
                            : halfToppings.has(topping.id);
                          const toppingPrice = getToppingPrice(topping, type);
                          // Only disable half toppings if Whole has toppings and side is not selected
                          const isDisabled = type === "half" && wholeToppings.size > 0 && !halfSide;

                          return (
                            <button
                              key={`${type}-${topping.id}`}
                              onClick={() => handlePizzaToppingToggle(topping.id, type)}
                              disabled={isDisabled}
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 text-center ${
                                isSelected
                                  ? "bg-emerald-500/20 border-emerald-500 text-white"
                                  : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span className={`text-[11px] font-medium leading-tight ${isSelected ? "text-white" : "text-neutral-300"}`}>
                                {topping.name}
                              </span>
                              <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                {toppingPrice > 0 ? `+$${toppingPrice.toFixed(2)}` : "$0.00"}
                              </span>
                              {isSelected && (
                                <span className="text-emerald-400 text-xs">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Regular Modifier Groups - Scrollable (for non-pizza items) */
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {item.modifierGroups
              ?.slice()
              .sort((a, b) => {
                const aIsSize = isSizeGroup(a.modifierGroup);
                const bIsSize = isSizeGroup(b.modifierGroup);
                if (aIsSize && !bIsSize) return -1;
                if (!aIsSize && bIsSize) return 1;
                
                const aIsWholeHalf = isWholeHalfGroup(a.modifierGroup);
                const bIsWholeHalf = isWholeHalfGroup(b.modifierGroup);
                if (aIsWholeHalf && !bIsWholeHalf) return -1;
                if (!aIsWholeHalf && bIsWholeHalf) return 1;
                
                return 0;
              })
              .map(({ modifierGroup }) => {
              const selected = selectedModifiers[modifierGroup.id] || [];
              const isRadio = modifierGroup.maxSelect === 1;
              const isRequired = modifierGroup.minSelect > 0;
              const isCollapsed = collapsedGroups.has(modifierGroup.id);
              const isComplete = selected.length >= modifierGroup.minSelect && 
                                (modifierGroup.maxSelect === 1 || selected.length === modifierGroup.maxSelect);
              const isWholeHalf = isWholeHalfGroup(modifierGroup);
              const isSize = isSizeGroup(modifierGroup);
              const showTwoColumn = wholeHalfSelection && !isWholeHalf && !isSize;

              return (
                <div key={modifierGroup.id} className="border border-neutral-800 rounded-lg overflow-hidden">
                  {/* Group Header - Collapsible */}
                  <button
                    onClick={() => toggleGroupCollapse(modifierGroup.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white">{modifierGroup.name}</h4>
                      {isRequired && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      {isComplete && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {selected.length > 0 && (
                        <span className="text-[10px] text-neutral-500">
                          {selected.length}/{modifierGroup.maxSelect < 99 ? modifierGroup.maxSelect : '∞'}
                        </span>
                      )}
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Modifiers - Collapsible Content */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-2">
                      {showTwoColumn && wholeHalfSelection === "half" ? (
                        <div className="space-y-3">
                          {!halfSide && (
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                                Select Side
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setHalfSide("left")}
                                  className="px-4 py-3 rounded-lg border-2 border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                                >
                                  Left
                                </button>
                                <button
                                  onClick={() => setHalfSide("right")}
                                  className="px-4 py-3 rounded-lg border-2 border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                                >
                                  Right
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {halfSide && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                                  Left
                                </div>
                                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                  {modifierGroup.modifiers.map((modifier) => {
                                    const isSelected = selected.includes(modifier.id);
                                    const priceEntry = modifier.prices.find(
                                      (p) => p.sizeLabel === (item.size || "Default")
                                    ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                                    const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                                    return (
                                      <button
                                        key={`left-${modifier.id}`}
                                        onClick={() => handleModifierToggle(modifierGroup.id, modifier.id, "whole")}
                                        className={`w-full px-2 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between text-[11px] font-medium ${
                                          isSelected
                                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                                        }`}
                                      >
                                        <span className="truncate text-[10px]">{modifier.name}</span>
                                        {modifierPrice > 0 && (
                                          <span className={`text-[9px] font-bold shrink-0 ml-1 ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                            +${modifierPrice.toFixed(2)}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                                  Right
                                </div>
                                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                  {modifierGroup.modifiers.map((modifier) => {
                                    const isSelected = selected.includes(modifier.id);
                                    const priceEntry = modifier.prices.find(
                                      (p) => p.sizeLabel === (item.size || "Default")
                                    ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                                    const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                                    return (
                                      <button
                                        key={`right-${modifier.id}`}
                                        onClick={() => handleModifierToggle(modifierGroup.id, modifier.id, "half")}
                                        className={`w-full px-2 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between text-[11px] font-medium ${
                                          isSelected
                                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                                        }`}
                                      >
                                        <span className="truncate text-[10px]">{modifier.name}</span>
                                        {modifierPrice > 0 && (
                                          <span className={`text-[9px] font-bold shrink-0 ml-1 ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                            +${modifierPrice.toFixed(2)}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                                  Whole
                                </div>
                                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                  {modifierGroup.modifiers.map((modifier) => {
                                    const isSelected = selected.includes(modifier.id);
                                    const priceEntry = modifier.prices.find(
                                      (p) => p.sizeLabel === (item.size || "Default")
                                    ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                                    const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                                    return (
                                      <button
                                        key={`whole-${modifier.id}`}
                                        onClick={() => handleModifierToggle(modifierGroup.id, modifier.id, "whole")}
                                        className={`w-full px-2 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between text-[11px] font-medium ${
                                          isSelected
                                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                                            : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                                        }`}
                                      >
                                        <span className="truncate text-[10px]">{modifier.name}</span>
                                        {modifierPrice > 0 && (
                                          <span className={`text-[9px] font-bold shrink-0 ml-1 ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                            +${modifierPrice.toFixed(2)}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : showTwoColumn && wholeHalfSelection === "whole" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1 px-1">
                              Whole
                            </div>
                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                              {modifierGroup.modifiers.map((modifier) => {
                                const isSelected = selected.includes(modifier.id);
                                const priceEntry = modifier.prices.find(
                                  (p) => p.sizeLabel === (item.size || "Default")
                                ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                                const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                                return (
                                  <button
                                    key={modifier.id}
                                    onClick={() => handleModifierToggle(modifierGroup.id, modifier.id, "whole")}
                                    className={`w-full px-2 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between text-[11px] font-medium ${
                                      isSelected
                                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                                        : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                                    }`}
                                  >
                                    <span className="truncate text-[10px]">{modifier.name}</span>
                                    {modifierPrice > 0 && (
                                      <span className={`text-[9px] font-bold shrink-0 ml-1 ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                        +${modifierPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div></div>
                        </div>
                      ) : (
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
                                className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 text-xs font-medium ${
                                  isSelected
                                    ? "bg-emerald-500/20 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                    : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                                }`}
                              >
                                <span>{modifier.name}</span>
                                {modifierPrice > 0 && (
                                  <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950/50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Total</span>
            <span className="text-xl font-bold text-emerald-400">
              ${calculatedPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            {/* Sizes button - only show in toppings stage for pizza */}
            {isPizza && pizzaStage === "toppings" && (
              <button
                onClick={() => {
                  setPizzaStage("size");
                  setWholeHalfSelection(null);
                  setWholeToppings(new Set());
                  setHalfToppings(new Set());
                  setHalfSide(null);
                }}
                className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-all active:scale-[0.98] border border-neutral-700"
              >
                Sizes
              </button>
            )}
            <button
              onClick={handleAddToOrder}
              disabled={!canAdd && !canAddPizza}
              className={`py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-emerald-500/20 ${
                isPizza && pizzaStage === "toppings" ? "flex-1" : "w-full"
              }`}
            >
              {(!canAdd && !canAddPizza) ? "Select Required Options" : "Add to Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render via portal to ensure it's above everything
  if (typeof window === 'undefined') return null;
  return createPortal(drawerContent, document.body);
}
