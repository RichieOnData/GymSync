import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface MembershipBreakdownChartProps {
  active: number
  expiringSoon: number
  expired: number
}

export function MembershipBreakdownChart({ active, expiringSoon, expired }: MembershipBreakdownChartProps) {
  const data = [
    { name: "Active", value: active, color: "#10b981" },
    { name: "Expiring Soon", value: expiringSoon, color: "#f59e0b" },
    { name: "Expired", value: expired, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  // If no data, show a message
  if (data.length === 0 || (active === 0 && expiringSoon === 0 && expired === 0)) {
    return <div className="h-[300px] flex items-center justify-center text-gray-400">No membership data available</div>
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#222", border: "none" }}
            itemStyle={{ color: "#fff" }}
            formatter={(value) => [`${value} members`, ""]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

