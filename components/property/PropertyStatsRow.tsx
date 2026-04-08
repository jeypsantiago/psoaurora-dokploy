import React from "react";

interface PropertyStatsRowProps {
  stats: {
    totalAssets: number;
    totalPPE: number;
    totalSemiExpendable: number;
    totalValue: number;
  };
}

export const PropertyStatsRow: React.FC<PropertyStatsRowProps> = ({ stats }) => {
  const cards = [
    { label: "Total Assets", value: stats.totalAssets, color: "blue" },
    { label: "PPE Items", value: stats.totalPPE, color: "indigo" },
    {
      label: "Semi-Expendable",
      value: stats.totalSemiExpendable,
      color: "amber",
    },
    {
      label: "Total Value",
      value: `₱${stats.totalValue.toLocaleString()}`,
      color: "emerald",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl border border-${stat.color}-200 dark:border-${stat.color}-800`}
        >
          <p
            className={`text-[9px] font-black text-${stat.color}-500 uppercase tracking-widest`}
          >
            {stat.label}
          </p>
          <p
            className={`text-xl font-black text-${stat.color}-700 dark:text-${stat.color}-400 mt-1`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};
