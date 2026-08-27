"use client";

import { useState } from "react";
import { mockDashboardData, formatCurrency } from "@/lib/mock-data";

const ranges = ["7 days", "30 days", "3 months"];

export function RevenueOverview() {
  const [activeRange, setActiveRange] = useState("30 days");
  const { revenueChart } = mockDashboardData;

  // Generate SVG path for the chart
  const maxVal = Math.max(...revenueChart.data);
  const points = revenueChart.data.map((val, i) => {
    const x = (i / (revenueChart.data.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 100;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M 0,100 L ${points.join(" L ")} L 100,100 Z`;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Revenue Overview</h2>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(revenueChart.currentMonth)}
            <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">+12.4% this month</span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === range
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Lightweight SVG Chart */}
      <div className="h-48 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#chartGradient)" />
          <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}