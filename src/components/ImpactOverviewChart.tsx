"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats } from "@/types";

export default function ImpactOverviewChart({ stats }: { stats: DashboardStats }) {
  const sent = stats.funnel.sent ?? 0;
  const other = stats.funnel.click_outbound ?? 0;
  const data = [
    { name: "Sent", value: sent, sub: "Messages delivered" },
    { name: "Opened", value: stats.funnel.view ?? 0, sub: "Routing page views" },
    { name: "Google", value: stats.funnel.click_google ?? 0, sub: "Taps to Google" },
    { name: "Other sites", value: other, sub: "Taps to Yelp, Facebook, etc." },
    { name: "Notes", value: stats.funnel.submit_feedback ?? 0, sub: "Private feedback" },
  ];

  return (
    <div className="h-64 w-full min-w-0 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            allowDecimals={false}
            width={36}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [Number(value ?? 0), "Count"]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as (typeof data)[0] | undefined;
              return p ? `${p.name} — ${p.sub}` : "";
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" fillOpacity={0.9} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
