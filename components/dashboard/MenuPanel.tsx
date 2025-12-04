"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useEmployee } from "@/app/context/AuthContext";
import { Edit03, Plus, Trash01, Save01, XClose, Settings02, Link01 } from "@untitledui/icons";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import ItemConfiguratorDrawer from "@/components/dashboard/ItemConfiguratorDrawer";
import ItemConfiguratorInline from "@/components/dashboard/ItemConfiguratorInline";
import ModifierManagementModal from "@/components/dashboard/ModifierManagementModal";

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
  hideOrderSection?: boolean;
  requiresSizeFirst?: boolean;
  modifiers: Modifier[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: string;
  taxRate: string;
  categoryId?: string;
  isAvailable?: boolean;
  size?: string | null;
  modifierGroups?: {
    modifierGroup: ModifierGroup;
  }[];
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

interface MenuPanelProps {
  onAddItem?: (item: MenuItem, selectedModifiers?: Record<string, string[]>, quantity?: number) => void;
  scrollToCategory?: string | null;
  mode?: "pos" | "manage";
  selectedCategoryId?: string | null;
  showImages?: boolean;
  onConfiguratorStateChange?: (isOpen: boolean, needsFullWidth?: boolean) => void;
  autoOpenItemId?: string | null; // Auto-open this item's configurator when provided
}

export function MenuPanel({ onAddItem, scrollToCategory, mode = "pos", selectedCategoryId: propSelectedCategoryId, showImages = true, onConfiguratorStateChange, autoOpenItemId }: MenuPanelProps) {
  const { user: employee } = useEmployee();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(mode === "manage");
  
  // Modals State
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [configuratorItem, setConfiguratorItem] = useState<MenuItem | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [inlineConfiguratorItem, setInlineConfiguratorItem] = useState<MenuItem | null>(null);

  // Notify parent when configurator state changes
  useEffect(() => {
    if (onConfiguratorStateChange) {
      const isOpen = inlineConfiguratorItem !== null;
      if (!isOpen) {
        onConfiguratorStateChange(false, false);
        return;
      }
      
      // Check if any modifier group has hideOrderSection flag set
      // This will hide the order section when configuring items with these modifier groups
      const needsFullWidth = inlineConfiguratorItem?.modifierGroups?.some(({ modifierGroup }) => {
        return modifierGroup.hideOrderSection === true;
      }) ?? false;
      
      onConfiguratorStateChange(isOpen, needsFullWidth);
    }
  }, [inlineConfiguratorItem, onConfiguratorStateChange]);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [allModifierGroups, setAllModifierGroups] = useState<ModifierGroup[]>([]);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);

  // Keyboard State
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");
  const [keyboardCallback, setKeyboardCallback] = useState<((val: string) => void) | null>(null);

  const fetchMenu = async () => {
    try {
      const response = await fetch("/api/menu");
      const data = await response.json() as MenuCategory[];
      // Transform the data to include modifier groups properly
      const transformedData = data.map((cat: MenuCategory) => ({
        ...cat,
        items: cat.items.map((item: Omit<MenuItem, 'taxRate'> & { taxRate?: string | number | null }) => ({
          ...item,
          taxRate: item.taxRate?.toString() || "0",
          imageUrl: item.imageUrl || undefined,
          modifierGroups: item.modifierGroups || [],
        })) as MenuItem[],
      }));
      setCategories(transformedData);
      
      // Select first category if none selected or selected one was deleted (only if prop is not provided)
      if (!propSelectedCategoryId) {
        if (transformedData.length > 0 && (!selectedCategory || !transformedData.find((c: MenuCategory) => c.id === selectedCategory))) {
          setSelectedCategory(transformedData[0].id);
        } else if (transformedData.length === 0) {
          setSelectedCategory(null);
        }
      }
    } catch (error) {
      console.error("Menu fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-open item when autoOpenItemId is provided
  useEffect(() => {
    if (autoOpenItemId && categories.length > 0 && !inlineConfiguratorItem) {
      // Find the item across all categories
      for (const category of categories) {
        const item = category.items.find((item: MenuItem) => item.id === autoOpenItemId);
        if (item && item.modifierGroups && item.modifierGroups.length > 0) {
          setInlineConfiguratorItem(item);
          break;
        }
      }
    }
  }, [autoOpenItemId, categories, inlineConfiguratorItem]);

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync prop selectedCategoryId with internal state
  useEffect(() => {
    if (propSelectedCategoryId !== undefined) {
      setSelectedCategory(propSelectedCategoryId);
    }
  }, [propSelectedCategoryId]);

  // Scroll to category when scrollToCategory changes
  useEffect(() => {
    if (scrollToCategory) {
      const categoryElement = document.getElementById(`category-${scrollToCategory}`);
      if (categoryElement) {
        categoryElement.scrollIntoView({ behavior: "smooth", block: "start" });
        setSelectedCategory(scrollToCategory);
      }
    }
  }, [scrollToCategory]);

  const handleCategorySave = async () => {
    if (!editingCategory) return;
    
    try {
      const url = isNewCategory ? "/api/menu/categories" : `/api/menu/categories/${editingCategory.id}`;
      const method = isNewCategory ? "POST" : "PATCH";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name,
          sortOrder: editingCategory.sortOrder
        }),
      });
      
      if (res.ok) {
        await fetchMenu();
        setIsCategoryModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleCategoryDelete = async () => {
    if (!editingCategory || isNewCategory) return;
    if (!confirm("Are you sure you want to delete this category? It must be empty first.")) return;

    try {
      const res = await fetch(`/api/menu/categories/${editingCategory.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        await fetchMenu();
        setIsCategoryModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleItemSave = async () => {
    if (!editingItem) return;
    
    try {
      const url = isNewItem ? "/api/menu/items" : `/api/menu/items/${editingItem.id}`;
      const method = isNewItem ? "POST" : "PATCH";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingItem,
          categoryId: selectedCategory
        }),
      });
      
      if (res.ok) {
        await fetchMenu();
        setIsItemModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleItemDelete = async () => {
    if (!editingItem || isNewItem) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        await fetchMenu();
        setIsItemModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const fetchModifierGroups = async () => {
    try {
      const res = await fetch("/api/menu/modifier-groups");
      if (res.ok) {
        const data = await res.json();
        setAllModifierGroups(data);
      }
    } catch (error) {
      console.error("Error fetching modifier groups:", error);
    }
  };

  const handleAttachModifierGroup = async (groupId: string) => {
    if (!editingItem || isNewItem) return; // Can only attach to existing items for now (simpler)
    
    try {
      const res = await fetch(`/api/menu/items/${editingItem.id}/modifier-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modifierGroupId: groupId }),
      });
      
      if (res.ok) {
        await fetchMenu(); // Refresh to see new groups
        // Update local editingItem state to reflect change immediately (optional, but good)
        // For now fetchMenu refreshes categories, need to re-find item or just close modal?
        // Better to refresh editingItem from the updated categories list
        // Actually, fetchMenu updates `categories`. We need to update `editingItem` from `categories`.
        // Let's simpler: just re-fetch menu and update editing item from it.
        const updatedData = await (await fetch("/api/menu")).json() as MenuCategory[];
        const transformedData = updatedData.map((cat: MenuCategory) => ({
            ...cat,
            items: cat.items.map((item: Omit<MenuItem, 'modifierGroups'> & { modifierGroups?: unknown[] }) => ({
              ...item,
              modifierGroups: item.modifierGroups || [],
            })) as MenuItem[],
        }));
        setCategories(transformedData);
        
        // Find the item
        for (const cat of transformedData) {
            const found = cat.items.find((i: MenuItem) => i.id === editingItem.id);
            if (found) {
                setEditingItem(found);
                break;
            }
        }
        setIsGroupSelectorOpen(false);
      }
    } catch (error) {
      console.error("Error attaching group:", error);
    }
  };

  const handleDetachModifierGroup = async (groupId: string) => {
    if (!editingItem) return;
    
    try {
      const res = await fetch(`/api/menu/items/${editingItem.id}/modifier-groups?groupId=${groupId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Same refresh logic
        const updatedData = await (await fetch("/api/menu")).json() as MenuCategory[];
        const transformedData = updatedData.map((cat: MenuCategory) => ({
            ...cat,
            items: cat.items.map((item: Omit<MenuItem, 'modifierGroups'> & { modifierGroups?: unknown[] }) => ({
              ...item,
              modifierGroups: item.modifierGroups || [],
            })) as MenuItem[],
        }));
        setCategories(transformedData);
        
        for (const cat of transformedData) {
            const found = cat.items.find((i: MenuItem) => i.id === editingItem.id);
            if (found) {
                setEditingItem(found);
                break;
            }
        }
      }
    } catch (error) {
      console.error("Error detaching group:", error);
    }
  };

  const openKeyboard = (initialValue: string, callback: (val: string) => void, fieldName: string) => {
    setKeyboardValue(initialValue);
    setKeyboardCallback(() => callback);
    setActiveInput(fieldName);
  };

  const activeCategoryId = propSelectedCategoryId !== undefined ? propSelectedCategoryId : selectedCategory;
  const currentItems =
    categories.find((c) => c.id === activeCategoryId)?.items || [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 animate-pulse">
        Loading menu...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 relative">
      {/* Edit Mode Toggle - Only show in POS mode if admin */}
      {employee?.role === "ADMIN" && mode === "pos" && (
        <div className="absolute top-[-50px] right-4 flex items-center gap-4">
            {isEditMode && (
              <button
                onClick={() => setIsModifierModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-neutral-300 transition-colors"
              >
                <Settings02 className="w-4 h-4" />
                <span>Modifiers</span>
              </button>
            )}
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-500 cursor-pointer">
                <span>Edit Mode</span>
                <div 
                    className={`w-10 h-5 rounded-full transition-colors relative ${isEditMode ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                    onClick={() => setIsEditMode(!isEditMode)}
                >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isEditMode ? 'left-6' : 'left-1'}`} />
                </div>
            </label>
        </div>
      )}

      {/* Manager Mode Header Actions */}
      {mode === "manage" && (
        <div className="flex justify-end mb-4">
            <button
                onClick={() => setIsModifierModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-bold text-white transition-colors"
            >
                <Settings02 className="w-4 h-4" />
                <span>Manage Modifiers</span>
            </button>
        </div>
      )}

      {/* Category Tabs - Only show in edit mode */}
      {isEditMode && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center min-h-[44px]">
          {categories.map((category) => (
            <button
              key={category.id}
              id={`category-${category.id}`}
              onClick={() => {
                  setEditingCategory(category);
                  setIsNewCategory(false);
                  setIsCategoryModalOpen(true);
              }}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${
                selectedCategory === category.id
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              } border border-dashed border-neutral-600 hover:border-emerald-500`}
            >
              {category.name}
              <Edit03 className="w-3 h-3 opacity-50" />
            </button>
          ))}
          
          <button
              onClick={() => {
                  setEditingCategory({ id: "", name: "", sortOrder: categories.length, items: [] });
                  setIsNewCategory(true);
                  setIsCategoryModalOpen(true);
              }}
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold bg-neutral-900 border border-dashed border-neutral-700 text-neutral-500 hover:text-white hover:border-emerald-500 transition-all"
          >
              <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Menu Items Grid or Inline Configurator */}
      {inlineConfiguratorItem ? (
        (() => {
          // Check if this is a topping item (has Whole/Half + Toppings) - no padding needed
          const hasWholeHalfGroup = inlineConfiguratorItem?.modifierGroups?.some(({ modifierGroup }) =>
            modifierGroup.name.toLowerCase().includes("whole") || 
            modifierGroup.name.toLowerCase().includes("half") ||
            modifierGroup.modifiers.some(m => 
              m.name.toLowerCase().includes("whole") || 
              m.name.toLowerCase().includes("half")
            )
          ) || false;
          
          const hasToppingsGroup = inlineConfiguratorItem?.modifierGroups?.some(({ modifierGroup }) =>
            modifierGroup.name.toLowerCase().includes("topping") &&
            !modifierGroup.name.toLowerCase().includes("size")
          ) || false;
          
          const isToppingItem = hasWholeHalfGroup && hasToppingsGroup;
          
          return (
            <div className={isToppingItem ? "h-full" : "h-full rounded-2xl overflow-hidden border border-neutral-700 shadow-xl"}>
              <ItemConfiguratorInline
                item={inlineConfiguratorItem}
                onClose={() => setInlineConfiguratorItem(null)}
                onAddToOrder={(item, selectedModifiers, quantity) => {
                  if (onAddItem && inlineConfiguratorItem) {
                    // Ensure taxRate is included from the original item
                    const itemWithTaxRate = { ...item, taxRate: inlineConfiguratorItem.taxRate || "0" };
                    onAddItem(itemWithTaxRate, selectedModifiers, quantity);
                  }
                  setInlineConfiguratorItem(null);
                }}
              />
            </div>
          );
        })()
      ) : (
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isEditMode && selectedCategory && (
             <button
                onClick={() => {
                    setEditingItem({ id: "", name: "", description: "", basePrice: "", taxRate: "0", categoryId: selectedCategory, isAvailable: true });
                    setIsNewItem(true);
                    setIsItemModalOpen(true);
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-900/50 border-2 border-dashed border-neutral-800 p-4 transition-all hover:bg-neutral-800 hover:border-emerald-500/50 group min-h-[120px]"
             >
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-neutral-500 group-hover:text-emerald-400">Add Item</span>
             </button>
          )}
          
          {currentItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                  if (isEditMode) {
                      setEditingItem(item);
                      setIsNewItem(false);
                      setIsItemModalOpen(true);
                      fetchModifierGroups(); // Fetch available groups when opening edit modal
                  } else {
                      // Check if item has modifier groups
                      if (item.modifierGroups && item.modifierGroups.length > 0) {
                          // Use inline configurator instead of drawer
                          setInlineConfiguratorItem(item);
                      } else {
                          onAddItem?.(item, {});
                      }
                  }
              }}
              className={`group relative flex items-stretch rounded-lg bg-neutral-800/50 border border-neutral-800 overflow-hidden text-left transition-all hover:bg-neutral-800 hover:border-neutral-700 active:scale-[0.98] h-24 ${
                  isEditMode ? "hover:border-emerald-500/50 border-dashed cursor-pointer" : "active:border-emerald-500/50"
              } ${!item.isAvailable ? "opacity-50 grayscale" : ""}`}
            >
              {showImages && item.imageUrl ? (
                <div className="w-20 h-full overflow-hidden bg-neutral-900 shrink-0 relative">
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    fill
                    className="object-cover"
                    sizes="80px"
                    quality={100}
                    loading="lazy"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1.5 px-1.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 
                      className={`${item.name.length > 35 ? 'text-xs' : item.imageUrl ? 'text-xs' : 'text-sm'} font-bold text-white line-clamp-2 leading-tight`}
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    <p className={`text-sm text-emerald-400 font-bold mt-1`}>
                      ${parseFloat(item.basePrice).toFixed(2)}
                    </p>
                    {!item.isAvailable && (
                      <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Sold Out
                      </span>
                    )}
                  </div>
                  {isEditMode && <Edit03 className="w-3 h-3 text-neutral-500 shrink-0" />}
                </div>
              </div>
              {/* Modifier indicator icon - bottom right */}
              {item.modifierGroups && item.modifierGroups.length > 0 && (
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Link01 className="w-3 h-3 text-emerald-400" />
                </div>
              )}
            </button>
          ))}
          
          {currentItems.length === 0 && !isEditMode && (
            <div className="flex h-full flex-col items-center justify-center text-neutral-500 col-span-full">
              <div className="text-3xl mb-2 opacity-30">📋</div>
              <p className="text-sm">No items in this category</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modifier Management Modal */}
      {isModifierModalOpen && (
        <ModifierManagementModal
          isOpen={isModifierModalOpen}
          onClose={() => setIsModifierModalOpen(false)}
        />
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{isNewCategory ? "New Category" : "Edit Category"}</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="text-neutral-500 hover:text-white"><XClose /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Name</label>
                        <button 
                            onClick={() => openKeyboard(editingCategory.name, (val) => setEditingCategory({...editingCategory, name: val}), "Category Name")}
                            className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white hover:border-emerald-500/50 transition-colors flex items-center"
                        >
                            {editingCategory.name || <span className="text-neutral-600 italic">Enter name...</span>}
                        </button>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        {!isNewCategory && (
                            <button 
                                onClick={handleCategoryDelete}
                                className="flex-1 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash01 className="w-4 h-4" /> Delete
                            </button>
                        )}
                        <button 
                            onClick={handleCategorySave}
                            disabled={!editingCategory.name}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save01 className="w-4 h-4" /> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{isNewItem ? "New Item" : "Edit Item"}</h3>
                    <button onClick={() => setIsItemModalOpen(false)} className="text-neutral-500 hover:text-white"><XClose /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Name</label>
                            <button 
                                onClick={() => openKeyboard(editingItem.name, (val) => setEditingItem({...editingItem, name: val}), "Item Name")}
                                className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white hover:border-emerald-500/50 transition-colors flex items-center"
                            >
                                {editingItem.name || <span className="text-neutral-600 italic">Enter name...</span>}
                            </button>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Price</label>
                            <button 
                                onClick={() => openKeyboard(editingItem.basePrice, (val) => setEditingItem({...editingItem, basePrice: val}), "Price")}
                                className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white hover:border-emerald-500/50 transition-colors flex items-center font-mono"
                            >
                                {editingItem.basePrice ? `$${editingItem.basePrice}` : <span className="text-neutral-600 italic">0.00</span>}
                            </button>
                        </div>

                         <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Availability</label>
                            <button 
                                onClick={() => setEditingItem({...editingItem, isAvailable: !editingItem.isAvailable})}
                                className={`w-full h-12 border rounded-xl px-4 flex items-center justify-center font-bold transition-colors ${
                                    editingItem.isAvailable 
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                                        : "bg-red-500/10 border-red-500 text-red-400"
                                }`}
                            >
                                {editingItem.isAvailable ? "Available" : "Sold Out"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Description</label>
                        <button 
                            onClick={() => openKeyboard(editingItem.description || "", (val) => setEditingItem({...editingItem, description: val}), "Description")}
                            className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-left text-white hover:border-emerald-500/50 transition-colors flex items-start"
                        >
                            {editingItem.description || <span className="text-neutral-600 italic">Enter description...</span>}
                        </button>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        {!isNewItem && (
                            <button 
                                onClick={handleItemDelete}
                                className="flex-1 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash01 className="w-4 h-4" /> Delete
                            </button>
                        )}
                        <button 
                            onClick={handleItemSave}
                            disabled={!editingItem.name || !editingItem.basePrice}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save01 className="w-4 h-4" /> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modifier Group Selector Modal */}
      {isGroupSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Select Modifier Group</h3>
                    <button onClick={() => setIsGroupSelectorOpen(false)} className="text-neutral-500 hover:text-white"><XClose /></button>
                </div>
                <div className="space-y-2">
                    {allModifierGroups.length === 0 ? (
                        <p className="text-neutral-500 text-center py-4">No modifier groups available. Create one in Modifiers settings.</p>
                    ) : (
                        allModifierGroups.map(group => {
                            const isAttached = editingItem?.modifierGroups?.some(mg => mg.modifierGroup.id === group.id);
                            if (isAttached) return null;
                            
                            return (
                                <button
                                    key={group.id}
                                    onClick={() => handleAttachModifierGroup(group.id)}
                                    className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-left hover:border-emerald-500/50 transition-all group"
                                >
                                    <div className="font-bold text-white group-hover:text-emerald-400">{group.name}</div>
                                    <div className="text-xs text-neutral-500">Select {group.minSelect}-{group.maxSelect}</div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
            value={keyboardValue}
            onChange={(val) => {
                setKeyboardValue(val);
                if (keyboardCallback) keyboardCallback(val);
            }}
            onClose={() => {
                setActiveInput(null);
                setKeyboardCallback(null);
            }}
            inputName={activeInput}
            layout={activeInput === "Price" ? "number" : "default"}
        />
      )}

      {/* Item Configurator Drawer */}
      {configuratorItem && (
        <ItemConfiguratorDrawer
          item={configuratorItem}
          isOpen={isConfiguratorOpen}
          onClose={() => {
            setIsConfiguratorOpen(false);
            setConfiguratorItem(null);
          }}
          onAddToOrder={(item, selectedModifiers) => {
            if (onAddItem && configuratorItem) {
                // Ensure taxRate is included from the original item
                const itemWithTaxRate = { ...item, taxRate: configuratorItem.taxRate || "0" };
                onAddItem(itemWithTaxRate, selectedModifiers);
            }
          }}
        />
      )}
    </div>
  );
}