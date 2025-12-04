"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { OrderType, OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderNumber: number;
  dailySequence: number;
  type: OrderType;
  status: OrderStatus;
  total: string;
  paymentStatus: string;
  createdAt: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    from: "",
    to: "",
  });

  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters]);

  // Fetch orders when page or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-neutral-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Link
            href="/dashboard"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-black transition-all active:scale-95"
          >
            Back to POS
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl bg-neutral-900 p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-neutral-50"
              >
                <option value="">All</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-neutral-50"
              >
                <option value="">All</option>
                <option value="PICKUP">Pickup</option>
                <option value="DELIVERY">Delivery</option>
                <option value="DINE_IN">Dine-In</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                From
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
                className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-neutral-50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                To
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters({ ...filters, to: e.target.value })
                }
                className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-neutral-50"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() =>
                setFilters({ ...filters, from: today, to: today })
              }
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95"
            >
              Today
            </button>
            <button
              onClick={() =>
                setFilters({ ...filters, from: yesterday, to: yesterday })
              }
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95"
            >
              Yesterday
            </button>
            <button
              onClick={() =>
                setFilters({ ...filters, from: lastWeek, to: today })
              }
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95"
            >
              Last 7 Days
            </button>
            <button
              onClick={() =>
                setFilters({ status: "", type: "", from: "", to: "" })
              }
              className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="text-center text-neutral-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-neutral-400">No orders found</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl bg-neutral-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Order #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-800 transition-colors hover:bg-neutral-800"
                    >
                      <td className="px-4 py-3 font-semibold text-neutral-50">
                        #{String(order.dailySequence || order.orderNumber).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-300">
                        {order.customer
                          ? `${order.customer.fullName} (${order.customer.phone})`
                          : "Walk-in"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-300">
                        {order.type.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        ${parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            order.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : order.status === "CANCELLED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}/receipt`}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-black transition-all active:scale-95"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} orders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

