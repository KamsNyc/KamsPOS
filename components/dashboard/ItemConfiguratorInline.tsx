"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { XClose, ChevronDown, ChevronUp } from "@untitledui/icons";

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
  requiresSizeFirst?: boolean;
  hideOrderSection?: boolean;
  sizeBasedPricing?: boolean;
  isOptional?: boolean;
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
  imageUrl?: string;
  modifierGroups?: {
    modifierGroup: ModifierGroup;
  }[];
}

interface ItemConfiguratorInlineProps {
  item: MenuItem;
  onClose: () => void;
  onAddToOrder: (item: MenuItem, selectedModifiers: Record<string, string[]>, quantity?: number) => void;
}

// Pizza Size SVG Component
const PizzaSizeSVG = ({ sizeName, isSelected }: { sizeName: string; isSelected: boolean }) => {
  const sizeLower = sizeName.toLowerCase();
  
  let sizeMultiplier = 1;
  if (sizeLower.includes("junior")) {
    sizeMultiplier = 0.6;
  } else if (sizeLower.includes("small") || sizeLower.includes("med")) {
    sizeMultiplier = 0.75;
  } else if (sizeLower.includes("large") && !sizeLower.includes("extra") && !sizeLower.includes("xl")) {
    sizeMultiplier = 1;
  } else if (sizeLower.includes("extra") || sizeLower.includes("xl")) {
    sizeMultiplier = 1.3;
  }
  
  const baseSize = 60;
  const diameter = baseSize * sizeMultiplier;
  const radius = diameter / 2;
  const strokeWidth = isSelected ? 3 : 2;
  const color = isSelected ? "#10b981" : "#525252";
  
  return (
    <svg 
      width={diameter + 20} 
      height={diameter + 20} 
      viewBox={`0 0 ${diameter + 20} ${diameter + 20}`}
      className="transition-all"
    >
      <circle
        cx={(diameter + 20) / 2}
        cy={(diameter + 20) / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        className="transition-all"
      />
      <circle
        cx={(diameter + 20) / 2}
        cy={(diameter + 20) / 2}
        r={radius * 0.85}
        fill={isSelected ? "rgba(16, 185, 129, 0.1)" : "rgba(82, 82, 82, 0.05)"}
        stroke="none"
        className="transition-all"
      />
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

// Helper: Check if a modifier group supports Whole/Half selection
// This is data-driven: groups with "topping" in the name support Whole/Half
const supportsWholeHalf = (group: ModifierGroup): boolean => {
  return group.name.toLowerCase().includes("topping");
};

// Helper: Check if a modifier group is a size group
const isSizeGroup = (group: ModifierGroup): boolean => {
  const nameLower = group.name.toLowerCase();
  // Exclude groups that are clearly not size groups (like "Pizza Toppings Size Based")
  if (nameLower.includes("topping")) {
    return false;
  }
  // Check if name contains "size" or "amount" (but not "topping")
  if (nameLower.includes("size") || nameLower.includes("amount")) {
    return true;
  }
  // Check if modifiers match size names
  return group.modifiers.some(m => 
    ["small", "medium", "large", "extra large", "xl", "junior", "small/med", "small/medium", "x-large"].includes(m.name.toLowerCase())
  );
};

export default function ItemConfiguratorInline({
  item,
  onClose,
  onAddToOrder,
}: ItemConfiguratorInlineProps) {
  // Find size group if it exists
  const sizeGroup = item.modifierGroups?.find(({ modifierGroup }) => 
    isSizeGroup(modifierGroup)
  )?.modifierGroup;

  // State: Regular modifier selections (for groups without Whole/Half)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  
  // State: Per-group Whole/Half selection and toppings
  // Key: modifierGroup.id, Value: "whole" | "leftHalf" | "rightHalf" | null
  const [groupWholeHalfSelection, setGroupWholeHalfSelection] = useState<Record<string, "whole" | "leftHalf" | "rightHalf" | null>>({});
  
  // State: Per-group toppings for Whole, Left Half, Right Half
  // Key: modifierGroup.id, Value: Set of modifier IDs
  const [groupWholeToppings, setGroupWholeToppings] = useState<Record<string, Set<string>>>({});
  const [groupLeftHalfToppings, setGroupLeftHalfToppings] = useState<Record<string, Set<string>>>({});
  const [groupRightHalfToppings, setGroupRightHalfToppings] = useState<Record<string, Set<string>>>({});
  
  // State: Size selection (for two-stage flow)
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  // Compute if we need to show size selection first
  // Check if any modifier group requires size first OR if we have both size group and Whole/Half groups
  const hasSizeGroup = !!sizeGroup && sizeGroup.modifiers.length > 0;
  const hasGroupsRequiringSize = item.modifierGroups?.some(({ modifierGroup }) => 
    modifierGroup.requiresSizeFirst === true
  ) || false;
  const hasWholeHalfGroups = item.modifierGroups?.some(({ modifierGroup }) => 
    supportsWholeHalf(modifierGroup)
  ) || false;
  // Show size selection if: (1) we have a size group with modifiers AND (2) some group requires size first OR has Whole/Half, AND (3) no size selected yet
  // IMPORTANT: If requiresSizeFirst is true, we MUST show size selection first - this is a step-based flow
  const showSizeSelection = hasSizeGroup && (hasGroupsRequiringSize || hasWholeHalfGroups) && !selectedSize;
  
  // State: UI
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [showQuantityPopover, setShowQuantityPopover] = useState(false);
  const quantityButtonRef = useRef<HTMLDivElement>(null);

  // Initialize: Reset state when item changes
  useEffect(() => {
    // Auto-select "Can" for Drink Size groups
    const initialModifiers: Record<string, string[]> = {};
    const initialWholeHalf: Record<string, "whole" | "leftHalf" | "rightHalf"> = {};
    
    item.modifierGroups?.forEach(({ modifierGroup }) => {
      const isDrinkSize = modifierGroup.name.toLowerCase().includes("drink") && 
                         modifierGroup.name.toLowerCase().includes("size");
      if (isDrinkSize) {
        const canModifier = modifierGroup.modifiers.find(m => 
          m.name.toLowerCase() === "can"
        );
        if (canModifier && modifierGroup.minSelect > 0) {
          initialModifiers[modifierGroup.id] = [canModifier.id];
        }
      }
      
      // Auto-select "whole" for groups that support whole/half
      if (supportsWholeHalf(modifierGroup)) {
        initialWholeHalf[modifierGroup.id] = "whole";
      }
    });
    
    // Reset all state when item changes
    setSelectedModifiers(initialModifiers);
    setCollapsedGroups(new Set());
    setSelectedSize(null);
    setGroupWholeHalfSelection(initialWholeHalf);
    setGroupWholeToppings({});
    setGroupLeftHalfToppings({});
    setGroupRightHalfToppings({});
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]); // Only reset when item ID changes, not on every render

  // Auto-select "whole" when size is selected and toppings group becomes visible
  useEffect(() => {
    if (selectedSize) {
      // When size is selected, auto-select "whole" for any whole/half groups that don't have a selection yet
      item.modifierGroups?.forEach(({ modifierGroup }) => {
        if (supportsWholeHalf(modifierGroup) && !groupWholeHalfSelection[modifierGroup.id]) {
          setGroupWholeHalfSelection(prev => ({
            ...prev,
            [modifierGroup.id]: "whole"
          }));
        }
      });
    }
  }, [selectedSize, item.modifierGroups, groupWholeHalfSelection]);

  // Helper: Normalize size name for price lookup (database uses different format)
  const normalizeSizeNameForPrice = useCallback((sizeName: string): string => {
    // Map display names to database price label format
    const sizeMap: Record<string, string> = {
      "junior": "Junior",
      "small": "Small",
      "small/medium": "Small/Med",
      "small/med": "Small/Med",
      "large": "Large",
      "x-large": "Xtra LG",
      "xtra lg": "Xtra LG",
      "extra large": "Xtra LG",
      "xl": "Xtra LG"
    };
    
    const normalized = sizeMap[sizeName.toLowerCase()] || sizeName;
    return normalized;
  }, []);

  // Helper: Get modifier price based on size and whole/half type
  const getModifierPrice = useCallback((
    modifier: Modifier, 
    sizeName: string | null, 
    type: "whole" | "half",
    useSizeBasedPricing: boolean = false
  ): ModifierPrice | null => {
    const typeLabel = type === "whole" ? "Whole" : "Half";
    
    // Only use size-based pricing if the flag is enabled
    if (useSizeBasedPricing && sizeName) {
      // Normalize size name for database lookup
      const normalizedSize = normalizeSizeNameForPrice(sizeName);
      
      // Try size-specific price formats (database uses "Size-Type" format)
      // Examples: "Large-Whole", "Small/Med-Half", "Junior-Whole", "Xtra LG-Half"
      const specificPrice = modifier.prices.find(
        (p) => p.sizeLabel === `${normalizedSize}-${typeLabel}` ||
              p.sizeLabel === `${normalizedSize} ${typeLabel}` ||
              p.sizeLabel === `${typeLabel} ${normalizedSize}` ||
              p.sizeLabel === `${typeLabel}-${normalizedSize}`
      );
      if (specificPrice) return specificPrice;
      
      // Fall back to size-only price
      const sizePrice = modifier.prices.find((p) => 
        p.sizeLabel === normalizedSize || p.sizeLabel === sizeName
      );
      if (sizePrice) return sizePrice;
    }
    
    // Try type-only price
    const typePrice = modifier.prices.find((p) => 
      p.sizeLabel?.toLowerCase().includes(typeLabel.toLowerCase())
    );
    if (typePrice) return typePrice;
    
    // Fall back to default
    return modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0] || null;
  }, [normalizeSizeNameForPrice]);

  // Calculate total price using useMemo
  const calculatedPrice = useMemo(() => {
    let total = parseFloat(item.basePrice);
    
    // Add size price if selected
    if (sizeGroup && selectedSize) {
      const sizeModifier = sizeGroup.modifiers.find(m => m.id === selectedSize);
      if (sizeModifier) {
        const sizePriceEntry = sizeModifier.prices.find(
          (p) => p.sizeLabel === sizeModifier.name
        ) || sizeModifier.prices.find((p) => p.sizeLabel === "Default") || sizeModifier.prices[0];
        if (sizePriceEntry) {
          total += parseFloat(sizePriceEntry.price);
        }
      }
    }
    
    // Get selected size name for price lookup
    // Always check selectedModifiers first (works for both single-stage and two-stage flows)
    // Then fall back to selectedSize state (for two-stage flow UI)
    const selectedSizeName = sizeGroup && selectedModifiers[sizeGroup.id] && selectedModifiers[sizeGroup.id].length > 0
      ? sizeGroup.modifiers.find(m => m.id === selectedModifiers[sizeGroup.id][0])?.name || null
      : selectedSize 
      ? sizeGroup?.modifiers.find(m => m.id === selectedSize)?.name || null
      : null;
    
    // Add modifier prices
    item.modifierGroups?.forEach(({ modifierGroup }) => {
      const useSizeBasedPricing = modifierGroup.sizeBasedPricing || false;
      
      if (supportsWholeHalf(modifierGroup)) {
        // Whole/Half groups: calculate based on selected whole/half and toppings
        const wholeSet = groupWholeToppings[modifierGroup.id] || new Set();
        const leftHalfSet = groupLeftHalfToppings[modifierGroup.id] || new Set();
        const rightHalfSet = groupRightHalfToppings[modifierGroup.id] || new Set();
        
        // Whole toppings
        wholeSet.forEach((modifierId) => {
          const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
          if (modifier) {
            const priceEntry = getModifierPrice(modifier, selectedSizeName, "whole", useSizeBasedPricing);
            if (priceEntry) total += parseFloat(priceEntry.price);
          }
        });
        
        // Left Half toppings
        leftHalfSet.forEach((modifierId) => {
          const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
          if (modifier) {
            const priceEntry = getModifierPrice(modifier, selectedSizeName, "half", useSizeBasedPricing);
            if (priceEntry) total += parseFloat(priceEntry.price);
          }
        });
        
        // Right Half toppings
        rightHalfSet.forEach((modifierId) => {
          const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
          if (modifier) {
            const priceEntry = getModifierPrice(modifier, selectedSizeName, "half", useSizeBasedPricing);
            if (priceEntry) total += parseFloat(priceEntry.price);
          }
        });
      } else {
        // Regular modifier groups
        const selected = selectedModifiers[modifierGroup.id] || [];
        selected.forEach((modifierId) => {
          const modifier = modifierGroup.modifiers.find((m) => m.id === modifierId);
          if (modifier) {
            let priceEntry;
            
            if (useSizeBasedPricing && selectedSizeName) {
              // Use size-based pricing if enabled
              const normalizedSize = normalizeSizeNameForPrice(selectedSizeName);
              // Try exact match first (case-sensitive), then case-insensitive
              priceEntry = modifier.prices.find((p) => 
                p.sizeLabel === normalizedSize || 
                p.sizeLabel === selectedSizeName ||
                p.sizeLabel?.toLowerCase() === normalizedSize.toLowerCase() ||
                p.sizeLabel?.toLowerCase() === selectedSizeName.toLowerCase()
              );
            }
            
            // Fall back to default pricing only if size-based pricing is not enabled or no size selected
            if (!priceEntry) {
              if (useSizeBasedPricing && !selectedSizeName) {
                // If size-based pricing is enabled but no size selected, show first available price
                priceEntry = modifier.prices[0];
              } else {
                priceEntry = modifier.prices.find(
                  (p) => p.sizeLabel === (item.size || "Default")
                ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
              }
            }
            
            if (priceEntry) {
              total += parseFloat(priceEntry.price);
            }
          }
        });
      }
    });

    return total * quantity;
  }, [
    selectedModifiers, 
    selectedSize, 
    groupWholeToppings, 
    groupLeftHalfToppings, 
    groupRightHalfToppings, 
    item, 
    sizeGroup, 
    quantity,
    getModifierPrice,
    normalizeSizeNameForPrice
  ]);

  // Handlers
  const handleSizeSelect = (sizeId: string) => {
    setSelectedSize(sizeId);
    // Also update selectedModifiers for consistency (so selectedSizeName works correctly)
    if (sizeGroup) {
      setSelectedModifiers(prev => ({
        ...prev,
        [sizeGroup.id]: [sizeId]
      }));
    }
  };

  const handleGroupWholeHalfToggle = (groupId: string, value: "whole" | "leftHalf" | "rightHalf") => {
    setGroupWholeHalfSelection(prev => {
      const current = prev[groupId];
      if (current === value) {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      } else {
        return { ...prev, [groupId]: value };
      }
    });
  };

  const handleGroupToppingToggle = (groupId: string, modifierId: string, type: "whole" | "leftHalf" | "rightHalf") => {
    if (type === "whole") {
      setGroupWholeToppings(prev => {
        const groupSet = prev[groupId] || new Set();
        const newSet = new Set(groupSet);
        if (newSet.has(modifierId)) {
          newSet.delete(modifierId);
        } else {
          newSet.add(modifierId);
        }
        return { ...prev, [groupId]: newSet };
      });
    } else if (type === "leftHalf") {
      setGroupLeftHalfToppings(prev => {
        const groupSet = prev[groupId] || new Set();
        const newSet = new Set(groupSet);
        if (newSet.has(modifierId)) {
          newSet.delete(modifierId);
        } else {
          newSet.add(modifierId);
        }
        return { ...prev, [groupId]: newSet };
      });
    } else if (type === "rightHalf") {
      setGroupRightHalfToppings(prev => {
        const groupSet = prev[groupId] || new Set();
        const newSet = new Set(groupSet);
        if (newSet.has(modifierId)) {
          newSet.delete(modifierId);
        } else {
          newSet.add(modifierId);
        }
        return { ...prev, [groupId]: newSet };
      });
    }
  };

  const handleModifierToggle = (groupId: string, modifierId: string) => {
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
    const finalModifiers: Record<string, string[]> = {};
    
    // Add size if selected
    if (sizeGroup && selectedSize) {
      finalModifiers[sizeGroup.id] = [selectedSize];
    }
    
    // Process all modifier groups
    item.modifierGroups?.forEach(({ modifierGroup }) => {
      if (supportsWholeHalf(modifierGroup)) {
        // For Whole/Half groups, combine all selected toppings
        const wholeSet = groupWholeToppings[modifierGroup.id] || new Set();
        const leftHalfSet = groupLeftHalfToppings[modifierGroup.id] || new Set();
        const rightHalfSet = groupRightHalfToppings[modifierGroup.id] || new Set();
        
        // Combine all unique toppings
        const allToppings = Array.from(new Set([...wholeSet, ...leftHalfSet, ...rightHalfSet]));
        
        // All selected modifiers are actual toppings (no need to filter Whole/Half modifiers)
        const actualToppings = allToppings;
        
        if (actualToppings.length > 0) {
          finalModifiers[modifierGroup.id] = actualToppings;
        }
      } else {
        // Regular modifier groups
        const selected = selectedModifiers[modifierGroup.id] || [];
        if (selected.length > 0) {
          finalModifiers[modifierGroup.id] = selected;
        }
      }
    });
    
    onAddToOrder(item, finalModifiers, quantity);
    onClose();
  };

  // Check if all required modifiers are filled
  const checkRequiredModifiers = (): boolean => {
    // If size selection is required and not selected
    if (showSizeSelection && !selectedSize) return false;
    
    // If any modifier group requires size first, size must be selected
    const hasGroupsRequiringSize = item.modifierGroups?.some(({ modifierGroup }) => 
      modifierGroup.requiresSizeFirst === true
    ) || false;
    if (hasGroupsRequiringSize && !selectedSize) return false;
    
    // Check all modifier groups
    return item.modifierGroups?.every(({ modifierGroup }) => {
      // Skip optional groups (they don't need to be filled)
      if (modifierGroup.isOptional === true) return true;
      
      // Skip size groups (handled separately)
      if (isSizeGroup(modifierGroup)) return true;
      
      // For Whole/Half groups, Whole/Half selection is required
      if (supportsWholeHalf(modifierGroup)) {
        const wholeHalf = groupWholeHalfSelection[modifierGroup.id];
        if (!wholeHalf) return false;
        // Toppings are optional
        return true;
      }
      
      // For regular groups, check minSelect
      const selected = selectedModifiers[modifierGroup.id] || [];
      const isRequired = modifierGroup.minSelect > 0;
      if (isRequired) {
        return selected.length >= modifierGroup.minSelect;
      }
      return true;
    }) ?? true;
  };

  const canAdd = checkRequiredModifiers();

  // Get selected size name for display
  // Always check selectedModifiers first (works for both single-stage and two-stage flows)
  // Then fall back to selectedSize state (for two-stage flow UI)
  const selectedSizeName = sizeGroup && selectedModifiers[sizeGroup.id] && selectedModifiers[sizeGroup.id].length > 0
    ? sizeGroup.modifiers.find(m => m.id === selectedModifiers[sizeGroup.id][0])?.name || null
    : selectedSize 
    ? sizeGroup?.modifiers.find(m => m.id === selectedSize)?.name || null
    : null;

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-emerald-500/20 bg-linear-to-r from-neutral-900 via-neutral-900 to-neutral-800/50 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {item.imageUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 relative ring-1 ring-emerald-500/20">
              <Image 
                src={item.imageUrl} 
                alt={item.name}
                fill
                className="object-cover"
                sizes="48px"
                quality={100}
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center gap-2 min-w-[200px] shrink-0">
            <h3 className="text-base font-bold text-white truncate">
              {item.name}
              <span className="text-sm font-normal text-neutral-400 ml-2">
                x{quantity}
              </span>
              {selectedSizeName && (
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  ({selectedSizeName})
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/30 text-red-400/80 hover:text-red-400 transition-all shrink-0"
          >
            <XClose className="w-4 h-4" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
        </div>
      </div>

      {/* Content - Step-based flow: Size first, then toppings */}
      {showSizeSelection && sizeGroup ? (
        // STEP 1: Show size selection
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thick">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-emerald-400">Select Size</h4>
            {!selectedSize && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sizeGroup.modifiers
              .slice()
              .sort((a, b) => {
                const getSizeOrder = (name: string): number => {
                  const lower = name.toLowerCase();
                  
                  // For Wings Amount, sort by number (8, 12, 18, 24)
                  if (lower.includes("wings") && lower.includes("amount")) {
                    const num = parseInt(name.match(/\d+/)?.[0] || "0");
                    return num;
                  }
                  
                  // Order: Junior (1), Small/Medium (2), Large (3), X-Large (4)
                  if (lower.includes("junior") || lower.includes("hunitor")) return 1;
                  if (lower.includes("small") || lower.includes("medium") || lower.includes("small/medium")) return 2;
                  if (lower.includes("large") && !lower.includes("x-") && !lower.includes("x large") && !lower.includes("extra")) return 3;
                  if (lower.includes("x-") || lower.includes("x large") || lower.includes("extra large") || lower.includes("xl")) return 4;
                  return 5;
                };
                return getSizeOrder(a.name) - getSizeOrder(b.name);
              })
              .map((size) => {
                const isSelected = selectedSize === size.id;
                const sizePriceEntry = size.prices.find(
                  (p) => p.sizeLabel === size.name
                ) || size.prices.find((p) => p.sizeLabel === "Default") || size.prices[0];
                const sizePrice = sizePriceEntry ? parseFloat(sizePriceEntry.price) : 0;

                return (
                  <button
                    key={size.id}
                    onClick={() => handleSizeSelect(size.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                    }`}
                  >
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
        // STEP 2: Show toppings (only after size is selected if requiresSizeFirst is true)
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thick">
          {item.modifierGroups
            ?.slice()
            .sort((a, b) => {
              // Size groups first
              const aIsSize = isSizeGroup(a.modifierGroup);
              const bIsSize = isSizeGroup(b.modifierGroup);
              if (aIsSize && !bIsSize) return -1;
              if (!aIsSize && bIsSize) return 1;
              return 0;
            })
            .map(({ modifierGroup }) => {
              // Skip size group only if we're in two-stage flow AND size is already selected
              // If showSizeSelection is false, we're in single-stage flow, so show size group
              if (isSizeGroup(modifierGroup) && showSizeSelection && selectedSize) {
                return null;
              }
              
              // Hide modifier groups that require size first until size is selected
              if (modifierGroup.requiresSizeFirst === true && !selectedSize) {
                return null;
              }
              
              const selected = selectedModifiers[modifierGroup.id] || [];
              const isRequired = modifierGroup.minSelect > 0;
              const isCollapsed = collapsedGroups.has(modifierGroup.id);
              const supportsWH = supportsWholeHalf(modifierGroup);
              const groupWholeHalf = groupWholeHalfSelection[modifierGroup.id] || null;
              const groupWhole = groupWholeToppings[modifierGroup.id] || new Set();
              const groupLeftHalf = groupLeftHalfToppings[modifierGroup.id] || new Set();
              const groupRightHalf = groupRightHalfToppings[modifierGroup.id] || new Set();

              return (
                <div key={modifierGroup.id} className="border border-neutral-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroupCollapse(modifierGroup.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className={`text-sm font-bold ${modifierGroup.isOptional ? 'text-neutral-200' : 'text-emerald-400'}`}>
                        {modifierGroup.name}
                        {modifierGroup.isOptional && (
                          <span className="text-[10px] font-normal text-neutral-400 ml-1.5">(Optional)</span>
                        )}
                      </h4>
                      {isRequired && !supportsWH && selected.length === 0 && !modifierGroup.isOptional && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      {supportsWH && !groupWholeHalf && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      {!supportsWH && selected.length > 0 && (
                        <span className="text-[10px] text-white font-semibold truncate max-w-[200px] bg-emerald-500/20 px-2 py-0.5 rounded">
                          {selected.map((modifierId) => {
                            const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
                            return modifier?.name;
                          }).filter(Boolean).join(", ")}
                        </span>
                      )}
                      {supportsWH && (groupWhole.size > 0 || groupLeftHalf.size > 0 || groupRightHalf.size > 0) && (
                        <div className="grid grid-cols-3 gap-3 max-w-full">
                          {/* Column 1: Whole section */}
                          <div className="flex items-start gap-1.5 flex-wrap max-h-[60px] overflow-y-auto">
                            {groupWhole.size > 0 && Array.from(groupWhole).map((modifierId) => {
                              const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
                              if (!modifier) return null;
                              return (
                                <button
                                  key={`whole-${modifierId}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupToppingToggle(modifierGroup.id, modifierId, "whole");
                                  }}
                                  className="text-[9px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors flex items-center gap-1 group"
                                  title={`Whole: ${modifier.name} (click to remove)`}
                                >
                                  <span className="text-[8px] text-emerald-400 font-semibold">W:</span>
                                  <span className="truncate max-w-[100px]">{modifier.name}</span>
                                  <span className="text-emerald-400/60 group-hover:text-emerald-300 shrink-0 text-xs">×</span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Column 2: Left Half section */}
                          <div className="flex items-start gap-1.5 flex-wrap max-h-[60px] overflow-y-auto">
                            {groupLeftHalf.size > 0 && Array.from(groupLeftHalf).map((modifierId) => {
                              const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
                              if (!modifier) return null;
                              return (
                                <button
                                  key={`left-${modifierId}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupToppingToggle(modifierGroup.id, modifierId, "leftHalf");
                                  }}
                                  className="text-[9px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors flex items-center gap-1 group"
                                  title={`Left: ${modifier.name} (click to remove)`}
                                >
                                  <span className="text-[8px] text-emerald-400 font-semibold">L:</span>
                                  <span className="truncate max-w-[100px]">{modifier.name}</span>
                                  <span className="text-emerald-400/60 group-hover:text-emerald-300 shrink-0 text-xs">×</span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Column 3: Right Half section */}
                          <div className="flex items-start gap-1.5 flex-wrap max-h-[60px] overflow-y-auto">
                            {groupRightHalf.size > 0 && Array.from(groupRightHalf).map((modifierId) => {
                              const modifier = modifierGroup.modifiers.find(m => m.id === modifierId);
                              if (!modifier) return null;
                              return (
                                <button
                                  key={`right-${modifierId}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupToppingToggle(modifierGroup.id, modifierId, "rightHalf");
                                  }}
                                  className="text-[9px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors flex items-center gap-1 group"
                                  title={`Right: ${modifier.name} (click to remove)`}
                                >
                                  <span className="text-[8px] text-emerald-400 font-semibold">R:</span>
                                  <span className="truncate max-w-[100px]">{modifier.name}</span>
                                  <span className="text-emerald-400/60 group-hover:text-emerald-300 shrink-0 text-xs">×</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!supportsWH && selected.length > 0 && (
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
                  
                  {!isCollapsed && (
                    <div className="p-3 space-y-2">
                      {/* Whole/Half Toggle for groups that support it */}
                      {supportsWH && (
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2">
                            {!groupWholeHalf && (
                              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 border-b border-neutral-700 pb-2 mb-3">
                            <button
                              onClick={() => handleGroupWholeHalfToggle(modifierGroup.id, "whole")}
                              className={`px-5 py-2.5 rounded-lg border-2 transition-all text-sm font-bold ${
                                groupWholeHalf === "whole"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : "bg-transparent border-neutral-600 text-white hover:border-neutral-500 hover:bg-neutral-800/30"
                              }`}
                            >
                              Whole {groupWholeHalf === "whole" && "✓"} {groupWhole.size > 0 && `(${groupWhole.size})`}
                            </button>
                            <button
                              onClick={() => handleGroupWholeHalfToggle(modifierGroup.id, "leftHalf")}
                              className={`px-5 py-2.5 rounded-lg border-2 transition-all text-sm font-bold ${
                                groupWholeHalf === "leftHalf"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : "bg-transparent border-neutral-600 text-white hover:border-neutral-500 hover:bg-neutral-800/30"
                              }`}
                            >
                              Left Half {groupWholeHalf === "leftHalf" && "✓"} {groupLeftHalf.size > 0 && `(${groupLeftHalf.size})`}
                            </button>
                            <button
                              onClick={() => handleGroupWholeHalfToggle(modifierGroup.id, "rightHalf")}
                              className={`px-5 py-2.5 rounded-lg border-2 transition-all text-sm font-bold ${
                                groupWholeHalf === "rightHalf"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : "bg-transparent border-neutral-600 text-white hover:border-neutral-500 hover:bg-neutral-800/30"
                              }`}
                            >
                              Right Half {groupWholeHalf === "rightHalf" && "✓"} {groupRightHalf.size > 0 && `(${groupRightHalf.size})`}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Modifiers */}
                      {supportsWH && groupWholeHalf ? (
                        <div className="grid grid-cols-8 gap-2.5">
                          {modifierGroup.modifiers
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((modifier) => {
                              const type = groupWholeHalf;
                              const isSelected = type === "whole"
                                ? groupWhole.has(modifier.id)
                                : type === "leftHalf"
                                ? groupLeftHalf.has(modifier.id)
                                : groupRightHalf.has(modifier.id);
                              
                              const useSizeBasedPricing = modifierGroup.sizeBasedPricing || false;
                              const priceEntry = getModifierPrice(modifier, selectedSizeName, type === "whole" ? "whole" : "half", useSizeBasedPricing);
                              const modifierPrice = priceEntry ? parseFloat(priceEntry.price) : 0;

                              return (
                                <button
                                  key={modifier.id}
                                  onClick={() => handleGroupToppingToggle(modifierGroup.id, modifier.id, type)}
                                  className={`px-2 py-3.5 rounded-lg border-2 transition-all flex flex-col items-center gap-1 text-center relative ${
                                    isSelected
                                      ? "bg-emerald-500/20 border-emerald-500 text-white"
                                      : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="absolute top-1 left-1 text-emerald-400 text-base font-bold">✓</span>
                                  )}
                                  <span className={`text-sm font-medium leading-tight line-clamp-2 ${isSelected ? "text-white" : "text-neutral-300"}`}>
                                    {modifier.name}
                                  </span>
                                  <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
                                    {modifierPrice > 0 ? `+$${modifierPrice.toFixed(2)}` : "$0.00"}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      ) : !supportsWH ? (
                        <div className="flex flex-wrap gap-2">
                          {modifierGroup.modifiers
                            .slice()
                            .sort((a, b) => {
                              // For Wings Amount groups, sort by number (8, 12, 18, 24)
                              const isWingsAmount = modifierGroup.name.toLowerCase().includes("wings") && 
                                                   modifierGroup.name.toLowerCase().includes("amount");
                              if (isWingsAmount) {
                                // Extract numbers from names like "8 WINGS", "12 WINGS", etc.
                                const aNum = parseInt(a.name.match(/\d+/)?.[0] || "0");
                                const bNum = parseInt(b.name.match(/\d+/)?.[0] || "0");
                                return aNum - bNum;
                              }
                              
                              // For Drink Size groups, put "Can" first
                              const isDrinkSize = modifierGroup.name.toLowerCase().includes("drink") && 
                                                 modifierGroup.name.toLowerCase().includes("size");
                              if (isDrinkSize) {
                                const aIsCan = a.name.toLowerCase() === "can";
                                const bIsCan = b.name.toLowerCase() === "can";
                                if (aIsCan && !bIsCan) return -1;
                                if (!aIsCan && bIsCan) return 1;
                              }
                              return a.name.localeCompare(b.name);
                            })
                            .map((modifier) => {
                            const isSelected = selected.includes(modifier.id);
                            
                            // Check if size-based pricing is enabled for this group
                            const useSizeBasedPricing = modifierGroup.sizeBasedPricing || false;
                            let priceEntry;
                            
                            if (useSizeBasedPricing && selectedSizeName) {
                              // Use size-based pricing if enabled
                              const normalizedSize = normalizeSizeNameForPrice(selectedSizeName);
                              // Try exact match first (case-sensitive)
                              priceEntry = modifier.prices.find((p) => 
                                p.sizeLabel === normalizedSize || 
                                p.sizeLabel === selectedSizeName ||
                                p.sizeLabel?.toLowerCase() === normalizedSize.toLowerCase() ||
                                p.sizeLabel?.toLowerCase() === selectedSizeName.toLowerCase()
                              );
                            }
                            
                            // Fall back to default pricing only if size-based pricing is not enabled or no size selected
                            if (!priceEntry) {
                              if (useSizeBasedPricing && !selectedSizeName) {
                                // If size-based pricing is enabled but no size selected, show first available price
                                priceEntry = modifier.prices[0];
                              } else {
                                priceEntry = modifier.prices.find(
                                  (p) => p.sizeLabel === (item.size || "Default")
                                ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
                              }
                            }
                            
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
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950/50 shrink-0">
        <div className="flex items-center justify-end mb-3">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded uppercase tracking-wide mr-2">
            TOTAL
          </span>
          <span className="text-xl font-bold text-emerald-400">
            ${calculatedPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          {/* Back to Sizes button */}
          {hasSizeGroup && selectedSize && (
            <button
              onClick={() => {
                setSelectedSize(null);
              }}
              className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 font-medium rounded-xl transition-all active:scale-[0.98] border border-neutral-700"
            >
              ← Back to Sizes
            </button>
          )}
          <button
            onClick={handleAddToOrder}
            disabled={!canAdd}
            className={`flex-1 py-3 font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg ${
              canAdd
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 cursor-pointer"
                : "bg-neutral-700 text-neutral-500 cursor-not-allowed opacity-50"
            }`}
          >
            Add to Order
          </button>
          {/* Quantity Selector */}
          <div className="relative" ref={quantityButtonRef}>
            <button
              onClick={() => setShowQuantityPopover(!showQuantityPopover)}
              className="flex items-center gap-2 bg-neutral-800 rounded-xl border border-neutral-700 px-5 py-3 hover:bg-neutral-700 transition-colors min-w-[100px]"
            >
              <span className="text-sm font-medium text-neutral-400">Qty:</span>
              <span className="text-white text-base font-bold">{quantity}</span>
            </button>
            
            {showQuantityPopover && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuantityPopover(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 z-50 w-32 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden">
                  <div className="grid grid-cols-2 gap-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setQuantity(num);
                          setShowQuantityPopover(false);
                        }}
                        className={`px-4 py-3 text-base font-bold transition-colors ${
                          quantity === num
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-800 text-white hover:bg-neutral-700"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
