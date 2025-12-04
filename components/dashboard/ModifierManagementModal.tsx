"use client";

import { useState, useEffect } from "react";
import { Edit03, Plus, Trash01, Save01, XClose } from "@untitledui/icons";
import OnScreenKeyboard from "@/components/dashboard/OnScreenKeyboard";
import { ConfirmationDialog } from "@/components/dashboard/ConfirmationDialog";

interface ModifierPrice {
  id?: string;
  sizeLabel: string;
  price: string;
}

interface Modifier {
  id?: string;
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
  sizeBasedPricing?: boolean;
  isOptional?: boolean;
  modifiers: Modifier[];
}

interface ModifierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModifierManagementModal({
  isOpen,
  onClose,
}: ModifierManagementModalProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  
  // Keyboard
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keyboardValue, setKeyboardValue] = useState("");
  const [keyboardCallback, setKeyboardCallback] = useState<((val: string) => void) | null>(null);
  const [inputLabel, setInputLabel] = useState("");
  
  // Confirmation
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Editing states
  const [editingGroupData, setEditingGroupData] = useState<{
    id?: string;
    name: string;
    minSelect: string;
    maxSelect: string;
    hideOrderSection: boolean;
    requiresSizeFirst: boolean;
    sizeBasedPricing: boolean;
    isOptional: boolean;
  } | null>(null);

  const [editingModifierData, setEditingModifierData] = useState<{
    id?: string;
    name: string;
    prices: {
      small: string;
      medium: string;
      large: string;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/menu/modifier-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching modifier groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openKeyboard = (initialValue: string, label: string, callback: (val: string) => void, inputName: string) => {
    setKeyboardValue(initialValue);
    setInputLabel(label);
    setKeyboardCallback(() => callback);
    setActiveInput(inputName);
  };

  const handleSaveGroup = async () => {
    if (!editingGroupData || !editingGroupData.name) return;

    try {
      const url = editingGroupData.id 
        ? `/api/menu/modifier-groups/${editingGroupData.id}` 
        : "/api/menu/modifier-groups";
      
      const method = editingGroupData.id ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingGroupData.name,
          minSelect: parseInt(editingGroupData.minSelect) || 0,
          maxSelect: parseInt(editingGroupData.maxSelect) || 1,
          hideOrderSection: editingGroupData.hideOrderSection || false,
          requiresSizeFirst: editingGroupData.requiresSizeFirst || false,
          sizeBasedPricing: editingGroupData.sizeBasedPricing || false,
          isOptional: editingGroupData.isOptional || false,
        }),
      });

      if (res.ok) {
        await fetchGroups();
        setEditingGroupData(null);
        setIsEditingGroup(false);
      }
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setConfirmationDialog({
      isOpen: true,
      title: "Delete Modifier Group?",
      message: `Are you sure you want to delete "${group?.name}"? This will also delete all modifiers in this group.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/menu/modifier-groups/${groupId}`, {
            method: "DELETE",
          });
          
          if (res.ok) {
            await fetchGroups();
            if (selectedGroup?.id === groupId) setSelectedGroup(null);
          }
        } catch (error) {
          console.error("Error deleting group:", error);
        }
      },
    });
  };

  const handleSaveModifier = async () => {
    if (!editingModifierData || !selectedGroup) return;

    try {
      const url = editingModifierData.id 
        ? `/api/menu/modifiers/${editingModifierData.id}` 
        : "/api/menu/modifiers";
      
      const method = editingModifierData.id ? "PATCH" : "POST";
      
      // Create prices array with Small, Medium, Large
      const prices = [
        { sizeLabel: "Small", price: editingModifierData.prices.small || "0" },
        { sizeLabel: "Medium", price: editingModifierData.prices.medium || "0" },
        { sizeLabel: "Large", price: editingModifierData.prices.large || "0" },
      ];

      const body = editingModifierData.id 
        ? { name: editingModifierData.name, prices }
        : { name: editingModifierData.name, groupId: selectedGroup.id, prices };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchGroups();
        // Refresh selected group
        const updatedGroupRes = await fetch("/api/menu/modifier-groups");
        const updatedGroups = await updatedGroupRes.json();
        const updatedSelected = updatedGroups.find((g: ModifierGroup) => g.id === selectedGroup.id);
        setSelectedGroup(updatedSelected);
        
        setEditingModifierData(null);
      }
    } catch (error) {
      console.error("Error saving modifier:", error);
    }
  };

  const handleDeleteModifier = async (modifierId: string) => {
     const modifier = selectedGroup?.modifiers.find(m => m.id === modifierId);
     setConfirmationDialog({
       isOpen: true,
       title: "Delete Modifier?",
       message: `Are you sure you want to delete "${modifier?.name}"?`,
       onConfirm: async () => {
         try {
           const res = await fetch(`/api/menu/modifiers/${modifierId}`, {
             method: "DELETE",
           });
           
           if (res.ok) {
             // Refresh
             const updatedGroupRes = await fetch("/api/menu/modifier-groups");
             const updatedGroups = await updatedGroupRes.json();
             setGroups(updatedGroups);
             const updatedSelected = updatedGroups.find((g: ModifierGroup) => g.id === selectedGroup?.id);
             setSelectedGroup(updatedSelected);
           }
         } catch (error) {
           console.error("Error deleting modifier:", error);
         }
       },
     });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl h-[80vh] flex overflow-hidden">
        {/* Left Sidebar: Groups */}
        <div className="w-1/3 border-r border-neutral-800 flex flex-col bg-neutral-900/50">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Modifier Groups</h3>
            <button 
              onClick={() => {
                setEditingGroupData({ name: "", minSelect: "0", maxSelect: "1", hideOrderSection: false, requiresSizeFirst: false, sizeBasedPricing: false, isOptional: false });
                setIsEditingGroup(true);
              }}
              className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="p-4 text-neutral-500 text-center">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-neutral-500 text-center text-sm">No groups yet</div>
            ) : (
              groups.map(group => (
                <div 
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    selectedGroup?.id === group.id 
                      ? "bg-emerald-500/10 border-emerald-500/50" 
                      : "bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white">{group.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Select: {group.minSelect} - {group.maxSelect}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroupData({
                          id: group.id,
                          name: group.name,
                          minSelect: group.minSelect.toString(),
                          maxSelect: group.maxSelect.toString(),
                          hideOrderSection: group.hideOrderSection || false,
                          requiresSizeFirst: group.requiresSizeFirst || false,
                          sizeBasedPricing: group.sizeBasedPricing || false,
                          isOptional: group.isOptional || false
                        });
                        setIsEditingGroup(true);
                      }}
                      className="text-neutral-500 hover:text-white p-1"
                    >
                      <Edit03 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Modifiers in selected group */}
        <div className="flex-1 flex flex-col bg-neutral-900">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              {selectedGroup ? selectedGroup.name : "Select a Group"}
            </h3>
            <button onClick={onClose} className="text-neutral-500 hover:text-white">
              <XClose className="w-6 h-6" />
            </button>
          </div>

          {selectedGroup ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-neutral-500 uppercase">Modifiers</h4>
                <button 
                  onClick={() => setEditingModifierData({ 
                    name: "", 
                    prices: { small: "0", medium: "0", large: "0" }
                  })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-sm font-bold"
                >
                  <Plus className="w-4 h-4" /> Add Modifier
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedGroup.modifiers.map(modifier => {
                  // Get prices for Small, Medium, Large
                  const smallPrice = modifier.prices.find(p => p.sizeLabel === "Small")?.price || "0";
                  const mediumPrice = modifier.prices.find(p => p.sizeLabel === "Medium")?.price || "0";
                  const largePrice = modifier.prices.find(p => p.sizeLabel === "Large")?.price || "0";
                  
                  return (
                    <div key={modifier.id} className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-white">{modifier.name}</div>
                          <div className="text-xs text-emerald-400 font-bold mt-1 space-y-0.5">
                            <div>S: ${parseFloat(smallPrice).toFixed(2)}</div>
                            <div>M: ${parseFloat(mediumPrice).toFixed(2)}</div>
                            <div>L: ${parseFloat(largePrice).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingModifierData({
                              id: modifier.id,
                              name: modifier.name,
                              prices: {
                                small: smallPrice,
                                medium: mediumPrice,
                                large: largePrice,
                              }
                            })}
                            className="p-1.5 bg-neutral-700 rounded hover:bg-neutral-600 text-neutral-300"
                          >
                            <Edit03 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteModifier(modifier.id!)}
                            className="p-1.5 bg-red-500/10 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <Trash01 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              Select a group to manage modifiers
            </div>
          )}
        </div>
      </div>

      {/* Edit Group Modal Overlay */}
      {isEditingGroup && editingGroupData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
           <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">{editingGroupData.id ? "Edit Group" : "New Group"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Name</label>
                  <button 
                    onClick={() => openKeyboard(editingGroupData.name, "Group Name", (val) => setEditingGroupData({...editingGroupData, name: val}), "groupName")}
                    className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white"
                  >
                    {editingGroupData.name || "Enter name..."}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Min Select</label>
                      <button 
                        onClick={() => openKeyboard(editingGroupData.minSelect, "Min Selection", (val) => setEditingGroupData({...editingGroupData, minSelect: val}), "minSelect")}
                        className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white font-mono"
                      >
                        {editingGroupData.minSelect}
                      </button>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Max Select</label>
                      <button 
                        onClick={() => openKeyboard(editingGroupData.maxSelect, "Max Selection", (val) => setEditingGroupData({...editingGroupData, maxSelect: val}), "maxSelect")}
                        className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white font-mono"
                      >
                        {editingGroupData.maxSelect}
                      </button>
                   </div>
                </div>
                
                {/* Hide Order Section Toggle */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Hide Order Section</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingGroupData({...editingGroupData, hideOrderSection: !editingGroupData.hideOrderSection})}
                      className={`flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-medium ${
                        editingGroupData.hideOrderSection
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {editingGroupData.hideOrderSection ? "Yes - Hide Order Section" : "No - Show Order Section"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    When enabled, the current order section will be hidden when configuring items with this modifier group
                  </p>
                </div>
                
                {/* Requires Size First Toggle */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Requires Size First</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingGroupData({...editingGroupData, requiresSizeFirst: !editingGroupData.requiresSizeFirst})}
                      className={`flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-medium ${
                        editingGroupData.requiresSizeFirst
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {editingGroupData.requiresSizeFirst ? "Yes - Show Size Selection First" : "No - Show Immediately"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    When enabled, users must select a size before this modifier group is shown (for two-stage flow: Size → Modifiers)
                  </p>
                </div>
                
                {/* Size-Based Pricing Toggle */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Size-Based Pricing</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingGroupData({...editingGroupData, sizeBasedPricing: !editingGroupData.sizeBasedPricing})}
                      className={`flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-medium ${
                        editingGroupData.sizeBasedPricing
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {editingGroupData.sizeBasedPricing ? "Yes - Prices Vary by Size" : "No - Fixed Prices"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    When enabled, modifier prices will change based on the selected size (e.g., Junior vs Large pricing)
                  </p>
                </div>
                
                {/* Is Optional Toggle */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Is Optional</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingGroupData({...editingGroupData, isOptional: !editingGroupData.isOptional})}
                      className={`flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-medium ${
                        editingGroupData.isOptional
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {editingGroupData.isOptional ? "Yes - Optional (Can Skip)" : "No - Required"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    When enabled, this modifier group is optional and can be skipped when adding items to the order
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                   <button 
                     onClick={() => setIsEditingGroup(false)} 
                     className="flex-1 h-12 bg-neutral-800 text-white rounded-xl font-bold"
                   >
                     Cancel
                   </button>
                   {editingGroupData.id && (
                     <button 
                       onClick={() => handleDeleteGroup(editingGroupData.id!)}
                       className="h-12 w-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center"
                     >
                       <Trash01 className="w-5 h-5" />
                     </button>
                   )}
                   <button 
                     onClick={handleSaveGroup} 
                     className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-bold"
                   >
                     Save
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Edit Modifier Modal Overlay */}
      {editingModifierData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
           <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4">{editingModifierData.id ? "Edit Modifier" : "New Modifier"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Name</label>
                  <button 
                    onClick={() => openKeyboard(editingModifierData.name, "Modifier Name", (val) => setEditingModifierData({...editingModifierData, name: val}), "modName")}
                    className="w-full h-12 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white"
                  >
                    {editingModifierData.name || "Enter name..."}
                  </button>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Prices by Size</label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-neutral-500 mb-1 block">Small</label>
                      <button 
                        onClick={() => openKeyboard(editingModifierData.prices.small, "Small Price", (val) => setEditingModifierData({...editingModifierData, prices: {...editingModifierData.prices, small: val}}), "modPriceSmall")}
                        className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white font-mono"
                      >
                        ${editingModifierData.prices.small || "0.00"}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-neutral-500 mb-1 block">Medium</label>
                      <button 
                        onClick={() => openKeyboard(editingModifierData.prices.medium, "Medium Price", (val) => setEditingModifierData({...editingModifierData, prices: {...editingModifierData.prices, medium: val}}), "modPriceMedium")}
                        className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white font-mono"
                      >
                        ${editingModifierData.prices.medium || "0.00"}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-neutral-500 mb-1 block">Large</label>
                      <button 
                        onClick={() => openKeyboard(editingModifierData.prices.large, "Large Price", (val) => setEditingModifierData({...editingModifierData, prices: {...editingModifierData.prices, large: val}}), "modPriceLarge")}
                        className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-left text-white font-mono"
                      >
                        ${editingModifierData.prices.large || "0.00"}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                   <button 
                     onClick={() => setEditingModifierData(null)} 
                     className="flex-1 h-12 bg-neutral-800 text-white rounded-xl font-bold"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleSaveModifier} 
                     className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-bold"
                   >
                     Save
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
            onChange={(val) => {
                setKeyboardValue(val);
                if (keyboardCallback) keyboardCallback(val);
            }}
            onClose={() => {
                setActiveInput(null);
                setKeyboardCallback(null);
            }}
            inputName={inputLabel}
            layout={activeInput?.startsWith("modPrice") || activeInput === "minSelect" || activeInput === "maxSelect" ? "number" : "default"}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        variant="danger"
      />
    </div>
  );
}

