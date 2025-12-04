"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployee } from "@/app/context/AuthContext";
import { ArrowLeft, ShoppingBag03 } from "@untitledui/icons";
import Link from "next/link";
import { MenuManagement } from "@/components/dashboard/MenuManagement";

export default function MenuManagementPage() {
  const { user: employee, loading } = useEmployee();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!employee || employee.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [employee, loading, router]);

  if (loading || !employee || employee.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
                href="/dashboard" 
                className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              Menu Management
            </h1>
          </div>
        </div>

        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden p-4">
                <MenuManagement />
            </div>
        </div>
      </div>
    </div>
  );
}

