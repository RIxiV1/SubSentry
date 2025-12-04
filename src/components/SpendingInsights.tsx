import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Subscription } from "@/pages/Dashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";

interface SpendingInsightsProps {
  subscriptions: Subscription[];
}

const SpendingInsights = ({ subscriptions }: SpendingInsightsProps) => {
  const { formatCurrency } = useCurrency();

  const getCategoryData = () => {
    const categoryTotals: { [key: string]: number } = {};

    subscriptions.forEach((sub) => {
      const monthlyCost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
      categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthlyCost;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  };

  const data = getCategoryData();

  const COLORS = {
    Entertainment: "hsl(var(--secondary))",
    Productivity: "hsl(var(--primary))",
    Health: "hsl(var(--success))",
    Shopping: "hsl(var(--accent))",
    Other: "hsl(var(--muted))",
  };

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SpendingInsights;
