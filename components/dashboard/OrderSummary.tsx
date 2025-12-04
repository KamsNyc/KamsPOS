"use client";

import { useState } from "react";
import { NumericKeypad } from "./NumericKeypad";
import type { OrderType, PaymentMethod } from "@prisma/client";

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
  quantity: number;
  lineTotal: number;
  specialInstructions?: string;
  modifiers?: OrderItemModifier[];
}

interface OrderSummaryProps {
  items: OrderItem[];
  orderType: OrderType | null;
  tax: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateSpecialInstructions: (itemId: string, instructions: string) => void;
  onCompleteOrder: (paymentMethod: PaymentMethod) => void;
  isCompleting: boolean;
}

export function OrderSummary({
  items,
  orderType,
  tax,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateSpecialInstructions,
  onCompleteOrder,
  isCompleting,
}: OrderSummaryProps) {
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [quantityValue, setQuantityValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = 0;
  const total = subtotal + tax + deliveryFee;

  const handleQuantityClick = (itemId: string, currentQty: number) => {
    setQuantityValue(currentQty.toString());
    setEditingQuantity(itemId);
  };

  const handleQuantityDone = () => {
    if (editingQuantity && quantityValue) {
      const qty = parseInt(quantityValue, 10) || 1;
      onUpdateQuantity(editingQuantity, Math.max(1, qty));
    }
    setEditingQuantity(null);
    setQuantityValue("");
  };

  return (
    <div className="flex h-full flex-col bg-neutral-900 text-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-2">
        <h2 className="text-base font-bold text-neutral-200">Current Order</h2>
        <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-bold text-neutral-400">
          {items.length} Items
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-neutral-500">
            <div className="text-4xl mb-3 opacity-20">🛒</div>
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-3 rounded-xl bg-neutral-800/40 p-3 transition-all hover:bg-neutral-800"
              >
                <button
                  onClick={() => handleQuantityClick(item.id, item.quantity)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 font-mono text-lg font-bold text-emerald-400 transition-colors hover:bg-neutral-600"
                >
                  {item.quantity}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-neutral-200">
                    {item.name}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.modifiers.map((mod, idx) => (
                        <div key={idx} className="text-[10px] text-neutral-400 flex justify-between">
                          <span>+ {mod.name}</span>
                          {mod.price > 0 && <span>${mod.price.toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-neutral-500 mt-1">
                    ${item.unitPrice.toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-neutral-200">
                    ${item.lineTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-1 rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Payment */}
      <div className="border-t border-neutral-800 bg-neutral-900 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {/* Totals */}
        <div className="mb-4 space-y-1 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-neutral-400">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-emerald-400/80">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-neutral-800 pt-3 text-xl font-bold text-white">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["CASH", "CARD", "OTHER"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                disabled={items.length === 0}
                className={`rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 ${
                  paymentMethod === method
                    ? "bg-white text-black shadow-lg"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => paymentMethod && onCompleteOrder(paymentMethod)}
            disabled={!paymentMethod || isCompleting || items.length === 0}
            className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isCompleting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">↻</span> Processing...
              </span>
            ) : (
              "PAY & PRINT"
            )}
          </button>
        </div>
      </div>

      {editingQuantity && (
        <NumericKeypad
          value={quantityValue}
          onChange={setQuantityValue}
          onClose={handleQuantityDone}
          label="Update Quantity"
          maxLength={3}
        />
      )}
    </div>
  );
}
