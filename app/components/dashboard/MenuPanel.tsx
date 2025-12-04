"use client";

import { useState, useEffect } from "react";
import { useEmployee } from "@/app/context/AuthContext";
import { Edit03, Plus, Trash01, Save01, XClose } from "@untitledui/icons";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  categoryId: string;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

interface MenuPanelProps {
  onAddItem: (item: MenuItem) => void;
}

export function MenuPanel({ onAddItem }: MenuPanelProps) {
  const { user: employee } = useEmployee();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Modals State
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  // Keyboard State
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");
  const [keyboardCallback, setKeyboardCallback] = useState<((val: string) => void) | null>(null);

  const fetchMenu = async () => {
    try {
      const response = await fetch("/api/menu");
      const data = await response.json();
      setCategories(data);
      
      // Select first category if none selected or selected one was deleted
      if (data.length > 0 && (!selectedCategory || !data.find((c: MenuCategory) => c.id === selectedCategory))) {
        setSelectedCategory(data[0].id);
      } else if (data.length === 0) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Menu fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

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

  const openKeyboard = (initialValue: string, callback: (val: string) => void, fieldName: string) => {
    setKeyboardValue(initialValue);
    setKeyboardCallback(() => callback);
    setActiveInput(fieldName);
  };

  const currentItems =
    categories.find((c) => c.id === selectedCategory)?.items || [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 animate-pulse">
        Loading menu...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 relative">
      {/* Edit Mode Toggle */}
      {employee?.role === "ADMIN" && (
        <div className="absolute top-[-50px] right-4 flex items-center gap-2">
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

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center min-h-[44px]">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
                if (isEditMode) {
                    setEditingCategory(category);
                    setIsNewCategory(false);
                    setIsCategoryModalOpen(true);
                } else {
                    setSelectedCategory(category.id);
                }
            }}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${
              selectedCategory === category.id
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
            } ${isEditMode && "border border-dashed border-neutral-600 hover:border-emerald-500"}`}
          >
            {category.name}
            {isEditMode && <Edit03 className="w-3 h-3 opacity-50" />}
          </button>
        ))}
        
        {isEditMode && (
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
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isEditMode && selectedCategory && (
             <button
                onClick={() => {
                    setEditingItem({ id: "", name: "", description: "", basePrice: "", categoryId: selectedCategory, isAvailable: true });
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
                  } else {
                      onAddItem(item);
                  }
              }}
              className={`group flex flex-col justify-between rounded-2xl bg-neutral-800/50 border border-neutral-800 p-4 text-left transition-all hover:bg-neutral-800 hover:border-neutral-700 active:scale-[0.98] ${
                  isEditMode ? "hover:border-emerald-500/50 border-dashed cursor-pointer" : "active:border-emerald-500/50"
              } ${!item.isAvailable ? "opacity-50 grayscale" : ""}`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-neutral-200 group-hover:text-white line-clamp-1">{item.name}</div>
                    {isEditMode && <Edit03 className="w-3 h-3 text-neutral-500" />}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500 line-clamp-2 leading-tight">
                  {item.description}
                </div>
              </div>
              <div className="mt-3 flex justify-between items-end">
                {!item.isAvailable && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Sold Out</span>}
                <span className="rounded-lg bg-neutral-950 px-2 py-1 text-sm font-bold text-emerald-400 ml-auto">
                  ${parseFloat(item.basePrice).toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        {currentItems.length === 0 && !isEditMode && (
          <div className="flex h-full flex-col items-center justify-center text-neutral-500">
            <div className="text-3xl mb-2 opacity-30">📋</div>
            <p className="text-sm">No items in this category</p>
          </div>
        )}
      </div>

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
                            onClick={() => openKeyboard(editingItem.description, (val) => setEditingItem({...editingItem, description: val}), "Description")}
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

      {/* Keyboard */}
      {activeInput && (
        <OnScreenKeyboard
            value={keyboardValue}
            onChange={(val: string) => {
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
    </div>
  );
}
