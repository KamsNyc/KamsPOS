"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { QuickMenuSidebar } from "@/components/dashboard/QuickMenuSidebar";
import { OrderTypeSelector } from "@/components/dashboard/OrderTypeSelector";
import { CustomerSearch } from "@/components/dashboard/CustomerSearch";
import { MenuPanel } from "@/components/dashboard/MenuPanel";
import { OrderSummary } from "@/components/dashboard/OrderSummary";
import CustomerEditModal from "@/components/dashboard/CustomerEditModal";
import CustomerCreateSheet from "@/components/dashboard/CustomerCreateSheet";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { ConfirmationDialog } from "@/components/dashboard/ConfirmationDialog";
import { CustomerSelectionOverlay } from "@/components/dashboard/CustomerSelectionOverlay";
import { useEmployee, useAuth } from "@/app/context/AuthContext";
import { Settings02, LogOut01, User01, BarChart01, Edit03 } from "@untitledui/icons";
import type {
  OrderType,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

interface OrderItemModifier {
  modifierId: string;
  name: string;
  price: number;
  groupName: string;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  lineTotal: number;
  specialInstructions?: string;
  modifiers?: OrderItemModifier[];
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  notes?: string;
  defaultAddress?: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  addresses?: Array<{
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    extraDirections?: string;
    isDefault: boolean;
  }>;
  createdAt?: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [customerStats, setCustomerStats] = useState<{
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string | null;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullCustomerData, setFullCustomerData] = useState<Customer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalPhone, setCreateModalPhone] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [store, setStore] = useState<{ name: string; logoUrl?: string | null } | null>(null);
  const [isLogoDropdownOpen, setIsLogoDropdownOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<Array<{ id: string; name: string; icon?: string | null; imageUrl?: string | null }>>([]);
  const [scrollToCategory, setScrollToCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [hasToppingsModifier, setHasToppingsModifier] = useState(false);
  const [autoOpenItemId, setAutoOpenItemId] = useState<string | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const { user: employee, logout: logoutEmployee } = useEmployee();
  const { logoutStore } = useAuth();

  // Fetch menu categories for Quick Menu sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/menu");
        if (response.ok) {
          const data = await response.json();
          const categories = data.map((cat: { id: string; name: string; icon?: string; imageUrl?: string }) => ({ 
            id: cat.id, 
            name: cat.name,
            icon: cat.icon,
            imageUrl: cat.imageUrl
          }));
          setMenuCategories(categories);
          // Select first category by default
          if (categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch store data (with sessionStorage cache)
  useEffect(() => {
    const fetchStore = async () => {
      // Check sessionStorage first
      const cachedStore = sessionStorage.getItem("kams_pos_store");
      if (cachedStore) {
        try {
          const parsed = JSON.parse(cachedStore);
          setStore(parsed);
          return; // Use cached data
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch from API if no cache
      try {
        const response = await fetch("/api/store");
        if (response.ok) {
          const storeData = await response.json();
          setStore(storeData);
          // Cache in sessionStorage
          if (storeData) {
            sessionStorage.setItem("kams_pos_store", JSON.stringify(storeData));
          }
        }
      } catch (error) {
        console.error("Failed to fetch store:", error);
      }
    };
    fetchStore();
  }, []);

  // Redirect if no employee is logged in (handled by middleware too, but safe to double check or for client-side transitions)
  useEffect(() => {
    if (!employee) {
        // We could redirect to select-profile here
        // router.push("/select-profile");
    }
  }, [employee, router]);

  // Fetch customer stats when customer is selected
  useEffect(() => {
    const fetchCustomerStats = async () => {
      if (!selectedCustomer?.id) {
        setCustomerStats(null);
        return;
      }

      try {
        const response = await fetch(`/api/customers/${selectedCustomer.id}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerStats({
            orderCount: data.orderCount || 0,
            totalSpent: data.totalSpent || 0,
            lastOrderDate: data.lastOrderDate || null,
          });
          // Update selectedCustomer with latest data
          setSelectedCustomer((prev) => ({
            ...prev!,
            defaultAddress: data.defaultAddress,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch customer stats:", error);
      }
    };

    fetchCustomerStats();
  }, [selectedCustomer?.id]);

  // Fetch full customer data when opening edit modal
  const handleOpenEditModal = async () => {
    if (!selectedCustomer?.id) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`);
      if (response.ok) {
        const data = await response.json();
        // Convert null defaultAddress to undefined and ensure it has isDefault if present
        const customerData: Customer = {
          ...data,
          defaultAddress: data.defaultAddress 
            ? { ...data.defaultAddress, isDefault: true }
            : undefined,
        };
        setFullCustomerData(customerData);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    }
  };

  const handleCustomerUpdate = async (updatedCustomer: Customer) => {
    // Update the selected customer with new data
    setSelectedCustomer({
      ...selectedCustomer!,
      fullName: updatedCustomer.fullName,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      notes: updatedCustomer.notes,
      defaultAddress: updatedCustomer.defaultAddress,
    });

    // Refresh stats
    if (updatedCustomer.orderCount !== undefined) {
      setCustomerStats({
        orderCount: updatedCustomer.orderCount,
        totalSpent: updatedCustomer.totalSpent || 0,
        lastOrderDate: updatedCustomer.lastOrderDate || null,
      });
    }
  };

  const handleCreateCustomer = (phone: string) => {
    setCreateModalPhone(phone);
    setIsCreateModalOpen(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    // Convert null defaultAddress to undefined
    setSelectedCustomer({
      ...newCustomer,
      defaultAddress: newCustomer.defaultAddress || undefined,
    });
    setPhone(newCustomer.phone);
    setIsCreateModalOpen(false);
    setCreateModalPhone("");
  };

  const handleNewOrder = () => {
    // Check if there's an active order
    const hasActiveOrder = orderType || orderItems.length > 0 || selectedCustomer;
    
    if (hasActiveOrder) {
      setConfirmationDialog({
        isOpen: true,
        title: "Start New Order?",
        message: "You have an active order. Starting a new order will clear the current order. Continue?",
        onConfirm: () => {
          setOrderType("DELIVERY");
          setPhone("");
          setSelectedCustomer(null);
          setOrderItems([]);
          setIsKeypadOpen(false);
          setCustomerStats(null);
        },
        confirmText: "Start New",
        cancelText: "Cancel",
      });
      return;
    }
    
    setOrderType("DELIVERY");
    setPhone("");
    setSelectedCustomer(null);
    setOrderItems([]);
    setIsKeypadOpen(false);
    setCustomerStats(null);
  };

  // Check if there's an active order
  const hasActiveOrder = !!(orderType || orderItems.length > 0 || selectedCustomer);

  // Handler for navigation with confirmation
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (hasActiveOrder) {
      e.preventDefault();
      setConfirmationDialog({
        isOpen: true,
        title: "Navigate Away?",
        message: "You have an active order. Navigating away will clear the current order. Continue?",
        onConfirm: () => {
          // Clear the order first
          setOrderType(null);
          setPhone("");
          setSelectedCustomer(null);
          setOrderItems([]);
          setIsKeypadOpen(false);
          setCustomerStats(null);
          // Navigate using router
          router.push(path);
        },
        confirmText: "Navigate",
        cancelText: "Cancel",
      });
    }
    // If no active order, let the Link handle navigation normally
  };

  const handleAddItem = (
    item: {
      id: string;
      name: string;
      basePrice: string;
      modifierGroups?: Array<{
        modifierGroup: {
          id: string;
          name: string;
          modifiers: Array<{
            id: string;
            name: string;
            prices: Array<{ sizeLabel: string; price: string }>;
          }>;
        };
      }>;
      size?: string | null;
      taxRate?: string | number | null;
    },
    selectedModifiers?: Record<string, string[]>,
    quantity: number = 1,
  ) => {
    // Calculate price including modifiers
    let unitPrice = parseFloat(item.basePrice);
    const taxRate = item.taxRate ? parseFloat(item.taxRate.toString()) : 0;
    const activeModifiers: OrderItemModifier[] = [];
    
    // Add modifier prices
    if (selectedModifiers && item.modifierGroups) {
      item.modifierGroups.forEach(({ modifierGroup }) => {
        const selectedIds = selectedModifiers[modifierGroup.id] || [];
        if (selectedIds.length > 0) {
          selectedIds.forEach((modifierId) => {
            const modifier = modifierGroup.modifiers.find((m) => m.id === modifierId);
            if (modifier) {
              // Find price for this item's size, or use "Default"
              const priceEntry = modifier.prices.find(
                (p) => p.sizeLabel === (item.size || "Default")
              ) || modifier.prices.find((p) => p.sizeLabel === "Default") || modifier.prices[0];
              
              const price = priceEntry ? parseFloat(priceEntry.price) : 0;
              unitPrice += price;
              
              activeModifiers.push({
                modifierId: modifier.id,
                name: modifier.name,
                price: price,
                groupName: modifierGroup.name
              });
            }
          });
        }
      });
    }
    
    // Generate a unique key for grouping identical items (including modifiers)
    const modifierKey = activeModifiers.map(m => m.modifierId).sort().join(',');
    
    const existingItem = orderItems.find(
      (i) => i.menuItemId === item.id && 
             (i.modifiers?.map(m => m.modifierId).sort().join(',') || '') === modifierKey
    );

    if (existingItem) {
      setOrderItems(
        orderItems.map((i) =>
          i.id === existingItem.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                lineTotal: (i.quantity + quantity) * i.unitPrice,
              }
            : i,
        ),
      );
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        unitPrice,
        taxRate,
        quantity: quantity,
        lineTotal: unitPrice * quantity,
        modifiers: activeModifiers.length > 0 ? activeModifiers : undefined,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            }
          : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const handleUpdateSpecialInstructions = (
    itemId: string,
    instructions: string,
  ) => {
    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId ? { ...item, specialInstructions: instructions } : item,
      ),
    );
  };

  const subtotal = orderItems.reduce((sum: number, item: OrderItem) => sum + item.lineTotal, 0);
  // Calculate tax per item
  const tax = orderItems.reduce((sum: number, item: OrderItem) => sum + (item.lineTotal * (item.taxRate / 100)), 0);

  const handleCompleteOrder = async (paymentMethod: PaymentMethod) => {
    if (!orderType) {
      alert("Please select an order type");
      return;
    }

    if (
      (orderType === "PICKUP" || orderType === "DELIVERY") &&
      !selectedCustomer
    ) {
      alert("Customer is required for pickup and delivery orders");
      return;
    }

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    setIsCompleting(true);

    try {
      // Ensure customer exists (create if needed for pickup/delivery)
      let customerId = selectedCustomer?.id;
      if (
        (orderType === "PICKUP" || orderType === "DELIVERY") &&
        !customerId &&
        phone
      ) {
        const createResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "New Customer",
            phone,
          }),
        });
        const newCustomer = await createResponse.json();
        customerId = newCustomer.id;
      }

      const deliveryFee = 0;
      const total = subtotal + tax + deliveryFee;

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          type: orderType,
          status: "NEW" as OrderStatus,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          discountTotal: "0.00",
          total: total.toFixed(2),
          paymentMethod,
          paymentStatus: "PAID" as PaymentStatus,
          deliveryAddressId:
            orderType === "DELIVERY" && selectedCustomer?.defaultAddress?.id
              ? selectedCustomer.defaultAddress.id
              : undefined,
          placedByUserId: employee?.id || "", // Pass the active employee ID
          items: orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.name,
            unitPriceSnapshot: item.unitPrice.toFixed(2),
            quantity: item.quantity,
            lineTotal: item.lineTotal.toFixed(2),
            specialInstructions: item.specialInstructions,
            modifiers: item.modifiers?.map(m => ({
                modifierId: m.modifierId,
                nameSnapshot: m.name,
                priceSnapshot: m.price.toFixed(2)
            }))
          })),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderResponse.json();

      // Reset and redirect to receipt
      handleNewOrder();
      router.push(`/orders/${order.id}/receipt`);
    } catch (error) {
      console.error("Order completion error:", error);
      alert("Failed to complete order. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  // Check if order is confirmed (customer selected or dine-in)
  const isOrderConfirmed = !!(
    (orderType === "DINE_IN") || 
    ((orderType === "PICKUP" || orderType === "DELIVERY") && selectedCustomer)
  );

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setScrollToCategory(categoryId);
    // Reset after a moment to allow re-triggering
    setTimeout(() => setScrollToCategory(null), 100);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-50 font-sans flex-col">
      {/* Main Content Area - Flex row for sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Navigation Sidebar (Compact) */}
        <aside className="flex w-[64px] flex-col items-center border-r border-neutral-800 bg-neutral-900 py-3 z-20 relative">
          <div className="relative mb-4">
            <button
              onClick={() => setIsLogoDropdownOpen(!isLogoDropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-lg font-bold text-black shadow-lg shadow-emerald-900/20 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer relative z-[10000]"
              title="Account Menu"
            >
              {store?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={store.logoUrl} 
                  alt={store.name || "Store"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{store?.name?.substring(0, 1).toUpperCase() || "K"}</span>
              )}
            </button>
            
            {/* Dropdown Menu - Rendered via Portal to ensure it's above everything */}
            {isLogoDropdownOpen && typeof window !== 'undefined' && createPortal(
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 99998 }}
                  onClick={() => setIsLogoDropdownOpen(false)}
                />
                {/* Dropdown */}
                <div className="fixed left-2 top-16 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden" style={{ zIndex: 99999 }}>
                  <div className="p-3 border-b border-neutral-700">
                    <div className="text-xs font-semibold text-neutral-300 mb-1">{store?.name || "Store"}</div>
                    <div className="text-[10px] text-neutral-500">{employee?.name || "Employee"}</div>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsLogoDropdownOpen(false);
                        logoutEmployee();
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <User01 className="w-4 h-4" />
                      <span>Switch User</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsLogoDropdownOpen(false);
                        logoutStore();
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <LogOut01 className="w-4 h-4" />
                      <span>Logout Store</span>
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
          
          
          <nav className="flex flex-1 flex-col gap-2.5 w-full px-2">
            <button 
              onClick={handleNewOrder}
              className="group flex flex-col items-center justify-center gap-1 rounded-lg bg-neutral-800 p-2 text-emerald-400 transition-all hover:bg-neutral-700 active:scale-95"
              title="New Order"
            >
              <span className="text-xl">➕</span>
              <span className="text-[9px] font-bold">New</span>
            </button>

            <Link 
              href="/dashboard/orders"
              onClick={(e) => handleNavigation(e, "/dashboard/orders")}
              className="group flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800 hover:text-neutral-200 active:scale-95"
              title="Order History"
            >
              <span className="text-xl">📋</span>
              <span className="text-[9px] font-medium">Orders</span>
            </Link>

            {employee?.role === 'ADMIN' && (
                <>
                    <Link 
                      href="/dashboard/analytics"
                      onClick={(e) => handleNavigation(e, "/dashboard/analytics")}
                      className="group flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800 hover:text-neutral-200 active:scale-95"
                      title="Analytics"
                    >
                      <BarChart01 className="w-5 h-5" />
                      <span className="text-[9px] font-medium">Reports</span>
                    </Link>
                    
                    {/* Menu Management Tab */}
                    <Link 
                      href="/dashboard/menu"
                      onClick={(e) => handleNavigation(e, "/dashboard/menu")}
                      className="group flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800 hover:text-neutral-200 active:scale-95"
                      title="Menu"
                    >
                      <span className="text-xl">🍽️</span>
                      <span className="text-[9px] font-medium">Menu</span>
                    </Link>
                </>
            )}

            <div className="mt-auto mb-3 flex justify-center w-full">
               {employee?.role === 'ADMIN' && (
                  <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                      title="Settings"
                  >
                      <Settings02 className="w-5 h-5" />
                  </button>
               )}
            </div>
          </nav>
        </aside>

      {/* 2. Order Setup OR Quick Menu - Hide when configurator is open */}
      {isOrderConfirmed ? (
              <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                isConfiguratorOpen 
                  ? "opacity-0 -translate-x-6 scale-95 pointer-events-none max-w-0 blur-sm" 
                  : "opacity-100 translate-x-0 scale-100 max-w-[68px] blur-0"
              }`}>
                <QuickMenuSidebar
                  orderType={orderType}
                  onOrderTypeChange={(type) => {
                     setOrderType(type);
                     if (type === "PICKUP" || type === "DELIVERY") {
                         setSelectedCustomer(null); // Re-trigger setup
                     }
                  }}
                  categories={menuCategories}
                  onCategoryClick={handleCategoryClick}
                  selectedCategoryId={selectedCategoryId}
                />
              </div>
      ) : (
        <section 
          className={`flex flex-col border-r border-neutral-800 bg-neutral-900/30 z-20 transition-all duration-300 ${
            isKeypadOpen ? "w-[380px]" : "w-[280px]"
          }`}
        >
          <div className="flex-1 overflow-y-auto overflow-x-visible p-3">
            {/* Order Type Section */}
            <div className="mb-4">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                Order Type
                {!orderType && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </h2>
              <OrderTypeSelector 
                value={orderType} 
                onChange={(type) => {
                    setOrderType(type);
                    if (type !== "DINE_IN") setSelectedCustomer(null);
                }}
              />
            </div>

            {/* Customer Section */}
            {orderType && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-200">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Customer</h2>
                  {selectedCustomer && (
                    <button 
                      onClick={() => {
                        setSelectedCustomer(null);
                        setPhone("");
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {(orderType === "PICKUP" || orderType === "DELIVERY") ? (
                  <div className="rounded-lg bg-neutral-800/50 p-1">
                    <CustomerSearch
                      key={orderType} // Force remount when order type changes
                      phone={phone}
                      onPhoneChange={setPhone}
                      onCustomerSelect={(customer) => {
                        if (!customer) return;
                        // Convert null defaultAddress to undefined
                        setSelectedCustomer({
                          ...customer,
                          defaultAddress: customer.defaultAddress || undefined,
                        });
                      }}
                      required={true}
                      onKeypadToggle={setIsKeypadOpen}
                      onCreateCustomer={handleCreateCustomer}
                      defaultKeypadOpen={!phone && !selectedCustomer}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-neutral-700 bg-neutral-800/30 p-3 text-center">
                    <div className="text-xl mb-1">🍽️</div>
                    <div className="text-xs font-medium text-neutral-300">Dine-In</div>
                    <div className="text-[10px] text-neutral-500">No customer info needed</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Right side container - Top bar + Menu + Current Order */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar - Only visible when order is confirmed and configurator is closed */}
        {isOrderConfirmed && (
          <div className={`flex items-center gap-3 border-b border-neutral-700/50 bg-linear-to-r from-emerald-500/5 via-neutral-900/90 to-neutral-900/90 backdrop-blur-md px-4 py-1 z-30 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
            isConfiguratorOpen 
              ? "opacity-0 -translate-y-4 max-h-0 pointer-events-none scale-y-0 blur-sm" 
              : "opacity-100 translate-y-0 max-h-20 scale-y-100 blur-0"
          }`}>
              {/* Order Type Badge + Customer Info Container */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Order Type Badge - Clickable to reset */}
                <button
                  onClick={() => {
                    // Check if there are items in the order
                    if (orderItems.length > 0) {
                      setConfirmationDialog({
                        isOpen: true,
                        title: "Change Order Type?",
                        message: "You have items in your order. Changing the order type will clear the current order. Continue?",
                        onConfirm: () => {
                          if (orderType === "DINE_IN") {
                            setOrderType(null);
                          } else {
                            setSelectedCustomer(null);
                            setPhone("");
                          }
                          setOrderItems([]);
                          setCustomerStats(null);
                        },
                        confirmText: "Change Type",
                        cancelText: "Cancel",
                      });
                      return;
                    }
                    
                    // No items, proceed without confirmation
                    if (orderType === "DINE_IN") {
                      setOrderType(null);
                    } else {
                      setSelectedCustomer(null);
                      setPhone("");
                    }
                    setCustomerStats(null);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 shadow-sm shrink-0 hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer h-[34px]"
                >
                  <span className="text-base">
                    {orderType === "PICKUP" ? "📦" : orderType === "DELIVERY" ? "🚗" : "🍽️"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                    {orderType === "PICKUP" ? "Pickup" : orderType === "DELIVERY" ? "Delivery" : "Dine-In"}
                  </span>
                  <Edit03 className="w-3 h-3 text-emerald-300/70" />
                </button>

                {/* Customer Info - Better readable layout */}
                {selectedCustomer ? (
                  <button
                    onClick={handleOpenEditModal}
                    className="flex items-center gap-3 rounded-lg bg-neutral-800/70 border border-neutral-700/60 px-3 py-1.5 w-fit shadow-sm hover:bg-neutral-700/70 hover:border-neutral-600 transition-all cursor-pointer text-left h-[34px]"
                  >
                    {/* Avatar - Only for Pickup and Delivery */}
                    {(orderType === "PICKUP" || orderType === "DELIVERY") && (
                      <div className="w-8 h-8 rounded-full border-2 border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden bg-neutral-800 relative">
                        <Image 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedCustomer.fullName || selectedCustomer.phone || "customer")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt={selectedCustomer.fullName}
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    {/* Name */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-white">{selectedCustomer.fullName}</span>
                      {customerStats && customerStats.orderCount > 0 && (
                        <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/15 px-1 py-0.5 rounded">
                          {customerStats.orderCount} orders
                        </span>
                      )}
                    </div>
                    
                    {/* Divider */}
                    <div className="w-px h-4 bg-neutral-700 shrink-0" />
                    
                    {/* Phone */}
                    <span className="text-xs text-neutral-300 font-medium shrink-0">{selectedCustomer.phone}</span>
                    
                    {/* Address */}
                    {selectedCustomer.defaultAddress && (
                      <>
                        <div className="w-px h-4 bg-neutral-700 shrink-0" />
                        <span className="text-xs text-neutral-400 truncate flex items-center gap-1">
                          <span className="text-red-400">📍</span>
                          {selectedCustomer.defaultAddress.street}, {selectedCustomer.defaultAddress.city}
                        </span>
                      </>
                    )}
                    
                    {/* Total Spent */}
                    {customerStats && customerStats.totalSpent > 0 && (
                      <span className="text-[10px] text-neutral-500 ml-auto shrink-0">
                        ${customerStats.totalSpent.toFixed(2)} total
                      </span>
                    )}
                  </button>
                ) : orderType === "DINE_IN" ? (
                  <div className="flex items-center gap-2 rounded-lg bg-neutral-800/70 border border-neutral-700/60 px-4 py-2 shadow-sm flex-1">
                    <span className="text-sm font-medium text-neutral-200">Dine-In Order</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Menu and Order Summary side by side */}
          <div className="flex flex-1 overflow-hidden">
            {/* 3. Menu Grid (Primary Workspace - Expanded, takes over when compact bar is shown) */}
            <section className="flex flex-1 flex-col bg-neutral-950 relative z-10">
              {/* Overlay - Shows when no order type is selected */}
              {!orderType && (
                <CustomerSelectionOverlay
                  onDineInClick={() => setOrderType("DINE_IN")}
                  onPickupClick={() => setOrderType("PICKUP")}
                  onDeliveryClick={() => setOrderType("DELIVERY")}
                />
              )}
              <div className="absolute inset-0 overflow-hidden flex flex-col z-0">
                <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-2 bg-neutral-900/80 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-200">Menu</h2>
                    {selectedCategoryId && menuCategories.find(c => c.id === selectedCategoryId) && (
                      <>
                        <span className="text-neutral-600">/</span>
                        <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                          {menuCategories.find(c => c.id === selectedCategoryId)?.icon && (
                            <span>{menuCategories.find(c => c.id === selectedCategoryId)?.icon}</span>
                          )}
                          {menuCategories.find(c => c.id === selectedCategoryId)?.name}
                        </span>
                      </>
                    )}
                  </div>
                </header>
                
                <div className="flex-1 overflow-hidden p-3">
                  {!orderType ? (
                    <div className="flex h-full flex-col items-center justify-center text-neutral-500">
                      <div className="text-4xl mb-4 opacity-20">🍕</div>
                      <p className="text-sm font-medium">Select an order type to start</p>
                    </div>
                  ) : isOrderConfirmed ? (
                    <MenuPanel 
                      onAddItem={handleAddItem} 
                      scrollToCategory={scrollToCategory} 
                      selectedCategoryId={selectedCategoryId} 
                      showImages={true}
                      autoOpenItemId={autoOpenItemId}
                      onConfiguratorStateChange={(isOpen, needsFullWidth) => {
                        setIsConfiguratorOpen(isOpen);
                        setHasToppingsModifier(needsFullWidth || false);
                      }}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-neutral-500">
                      <div className="text-4xl mb-4 opacity-20">👤</div>
                      <p className="text-sm font-medium">Select a customer to view menu</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Order Summary & Cart (Right Sidebar - Compact Width) - Collapsed when configurator is open */}
            <aside className={`flex flex-col border-l border-neutral-800 bg-neutral-900 shadow-2xl z-20 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
              (isConfiguratorOpen && hasToppingsModifier) 
                ? "w-0 opacity-0 translate-x-6 pointer-events-none scale-95 blur-sm" 
                : "w-[300px] opacity-100 translate-x-0 scale-100 blur-0"
            }`}>
              <div className="flex-1 overflow-hidden flex flex-col">
                <OrderSummary
                  items={orderItems}
                  orderType={orderType}
                  tax={tax}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onUpdateSpecialInstructions={handleUpdateSpecialInstructions}
                  onCompleteOrder={handleCompleteOrder}
                  isCompleting={isCompleting}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Customer Edit Modal */}
      {fullCustomerData && (
        <CustomerEditModal
          customer={{
            ...fullCustomerData,
            createdAt: fullCustomerData.createdAt || new Date().toISOString(),
            defaultAddress: fullCustomerData.defaultAddress
              ? {
                  ...fullCustomerData.defaultAddress,
                  isDefault: true,
                }
              : undefined,
          }}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setFullCustomerData(null);
          }}
          onUpdate={handleCustomerUpdate}
        />
      )}

      {/* Customer Create Sheet */}
      {isCreateModalOpen && (
        <CustomerCreateSheet
          phone={createModalPhone}
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateModalPhone("");
          }}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        variant={confirmationDialog.variant}
      />
    </div>
  );
}
