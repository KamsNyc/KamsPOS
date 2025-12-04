"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  dailySequence: number;
  type: string;
  status: string;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  discountTotal: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  deliveryAddress?: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    extraDirections?: string;
  } | null;
  items: OrderItem[];
}

const PIZZERIA_NAME = "Kams Pizza";
const PIZZERIA_ADDRESS = "123 Main Street";
const PIZZERIA_CITY = "Your City, ST 12345";
const PIZZERIA_PHONE = "(555) 123-4567";

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<{
    name: string;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Order
        const orderRes = await fetch(`/api/orders/${orderId}`);
        if (!orderRes.ok) throw new Error("Order not found");
        const orderData = await orderRes.json();
        setOrder(orderData);

        // Fetch Store
        const storeRes = await fetch("/api/store");
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  useEffect(() => {
    if (order && !isLoading) {
      // Auto-print when order is loaded
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading receipt...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-500">Order not found</div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="receipt-container">
        <div className="receipt-content">
          {/* Header */}
          <div className="receipt-header">
            <h1 className="receipt-title">{store?.name || "Kams Pizza"}</h1>
            <div className="receipt-address">
              {store?.street || "123 Main Street"}
            </div>
            <div className="receipt-address">
              {store?.city && store?.state ? `${store.city}, ${store.state} ${store.zip || ""}` : "City, ST 12345"}
            </div>
            <div className="receipt-phone">{store?.phone || "(555) 123-4567"}</div>
          </div>

          <div className="receipt-divider" />

          {/* Order Info */}
          <div className="receipt-section">
            <div className="receipt-row">
              <span>Order #:</span>
              <span className="receipt-bold">#{String(order.dailySequence).padStart(4, '0')}</span>
            </div>
            <div className="receipt-row">
              <span>Date:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="receipt-row">
              <span>Time:</span>
              <span>{formattedTime}</span>
            </div>
            <div className="receipt-row">
              <span>Type:</span>
              <span className="receipt-bold">
                {order.type.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* Customer Info */}
          {order.customer && (
            <>
              <div className="receipt-section">
                <div className="receipt-row">
                  <span>Customer:</span>
                  <span className="receipt-bold">{order.customer.fullName}</span>
                </div>
                <div className="receipt-row">
                  <span>Phone:</span>
                  <span>{order.customer.phone}</span>
                </div>
              </div>
              {order.deliveryAddress && (
                <div className="receipt-section">
                  <div className="receipt-label">Delivery Address:</div>
                  <div className="receipt-address-text">
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zip}
                    {order.deliveryAddress.extraDirections && (
                      <>
                        <br />
                        {order.deliveryAddress.extraDirections}
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="receipt-divider" />
            </>
          )}

          {/* Items */}
          <div className="receipt-section">
            <div className="receipt-label">Items:</div>
            {order.items.map((item) => (
              <div key={item.id} className="receipt-item">
                <div className="receipt-item-header">
                  <span className="receipt-bold">
                    {item.quantity}x {item.nameSnapshot}
                  </span>
                  <span className="receipt-bold">
                    ${parseFloat(item.lineTotal).toFixed(2)}
                  </span>
                </div>
                {item.specialInstructions && (
                  <div className="receipt-item-note">
                    Note: {item.specialInstructions}
                  </div>
                )}
                <div className="receipt-item-price">
                  ${parseFloat(item.unitPriceSnapshot).toFixed(2)} each
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-divider" />

          {/* Totals */}
          <div className="receipt-section">
            <div className="receipt-row">
              <span>Subtotal:</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Tax:</span>
              <span>${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            {parseFloat(order.deliveryFee) > 0 && (
              <div className="receipt-row">
                <span>Delivery Fee:</span>
                <span>${parseFloat(order.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.discountTotal) > 0 && (
              <div className="receipt-row">
                <span>Discount:</span>
                <span>-${parseFloat(order.discountTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="receipt-row receipt-total">
              <span className="receipt-bold">Total:</span>
              <span className="receipt-bold">
                ${parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* Payment */}
          <div className="receipt-section">
            <div className="receipt-row">
              <span>Payment:</span>
              <span className="receipt-bold">
                {order.paymentMethod.replace("_", " ")}
              </span>
            </div>
            <div className="receipt-row">
              <span>Status:</span>
              <span className="receipt-bold">{order.paymentStatus}</span>
            </div>
          </div>

          {order.notes && (
            <>
              <div className="receipt-divider" />
              <div className="receipt-section">
                <div className="receipt-label">Notes:</div>
                <div className="receipt-notes">{order.notes}</div>
              </div>
            </>
          )}

          <div className="receipt-divider" />

          {/* Footer */}
          <div className="receipt-footer">
            <div className="receipt-thanks">Thank you for your order!</div>
            <div className="receipt-footer-text">
              Please call us with any questions
            </div>
          </div>
        </div>
      </div>

      {/* Print button for reprints */}
      <div className="no-print print-controls">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-black"
        >
          Print Receipt
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-xl bg-neutral-700 px-6 py-3 text-lg font-semibold text-neutral-50"
        >
          Close
        </button>
      </div>
    </>
  );
}

