"use client";

import { useState, useEffect } from "react";
import { useEmployee } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { BarChart01, CreditCard01, ShoppingBag03, TrendUp01, ArrowLeft } from "@untitledui/icons";
import Link from "next/link";

interface AnalyticsData {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  paymentMethods: Record<string, number>;
  orderTypes: Record<string, number>;
  topItems: { name: string; count: number }[];
  range: string;
}

export default function AnalyticsPage() {
  const { user: employee, loading } = useEmployee();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!employee || employee.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [employee, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics?range=${range}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (employee?.role === "ADMIN") {
        fetchData();
    }
  }, [range, employee]);

  if (loading || !employee || employee.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart01 className="w-6 h-6 text-emerald-500" />
              Analytics
            </h1>
          </div>
          
          <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
            {["today", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  range === r 
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-neutral-500 animate-pulse">Loading stats...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendUp01 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-neutral-400 font-medium">Total Sales</span>
                </div>
                <div className="text-3xl font-bold text-white">${data.totalSales.toFixed(2)}</div>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ShoppingBag03 className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-neutral-400 font-medium">Total Orders</span>
                </div>
                <div className="text-3xl font-bold text-white">{data.orderCount}</div>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <CreditCard01 className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm text-neutral-400 font-medium">Avg. Order Value</span>
                </div>
                <div className="text-3xl font-bold text-white">${data.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Items */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Top Selling Items</h3>
                <div className="space-y-3">
                  {data.topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-neutral-500">#{i + 1}</span>
                        <span className="font-medium text-neutral-200">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{item.count} sold</span>
                    </div>
                  ))}
                  {data.topItems.length === 0 && (
                    <div className="text-center text-neutral-500 py-4">No sales yet</div>
                  )}
                </div>
              </div>

              {/* Payment Methods & Order Types */}
              <div className="space-y-6">
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Payment Methods</h3>
                    <div className="flex gap-4">
                        {Object.entries(data.paymentMethods).map(([method, count]) => (
                            <div key={method} className="flex-1 bg-neutral-950/50 p-3 rounded-xl text-center">
                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{method.replace("_", " ")}</div>
                                <div className="text-xl font-bold text-white">{count}</div>
                            </div>
                        ))}
                         {Object.keys(data.paymentMethods).length === 0 && (
                            <div className="w-full text-center text-neutral-500 py-2">No data</div>
                        )}
                    </div>
                 </div>

                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Order Types</h3>
                    <div className="flex gap-4">
                        {Object.entries(data.orderTypes).map(([type, count]) => (
                            <div key={type} className="flex-1 bg-neutral-950/50 p-3 rounded-xl text-center">
                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{type.replace("_", " ")}</div>
                                <div className="text-xl font-bold text-white">{count}</div>
                            </div>
                        ))}
                        {Object.keys(data.orderTypes).length === 0 && (
                            <div className="w-full text-center text-neutral-500 py-2">No data</div>
                        )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

