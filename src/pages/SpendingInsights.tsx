import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Subscription } from "./Dashboard";
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

type ChartView = "trends" | "categories" | "comparison";

const SpendingInsights = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ChartView>("trends");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { formatCurrency, currency } = useCurrency();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("next_renewal_date", { ascending: true });

      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!session?.user?.id,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      const views: ChartView[] = ["trends", "categories", "comparison"];
      const currentIndex = views.indexOf(currentView);
      setCurrentView(views[(currentIndex + 1) % views.length]);
    }

    if (touchStart - touchEnd < -75) {
      const views: ChartView[] = ["trends", "categories", "comparison"];
      const currentIndex = views.indexOf(currentView);
      setCurrentView(views[(currentIndex - 1 + views.length) % views.length]);
    }
  };

  const getTrendsData = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map(month => {
      const monthlyTotal = subscriptions.reduce((total, sub) => {
        const monthlyCost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
        return total + monthlyCost;
      }, 0);

      return {
        month: format(month, "MMM"),
        spending: parseFloat(monthlyTotal.toFixed(2)),
      };
    });
  };

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

  const getComparisonData = () => {
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    const twoMonthsAgo = subMonths(currentMonth, 2);

    const calculateMonthTotal = () => {
      return subscriptions.reduce((total, sub) => {
        const monthlyCost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
        return total + monthlyCost;
      }, 0);
    };

    return [
      { month: format(twoMonthsAgo, "MMM"), spending: parseFloat(calculateMonthTotal().toFixed(2)) },
      { month: format(lastMonth, "MMM"), spending: parseFloat(calculateMonthTotal().toFixed(2)) },
      { month: format(currentMonth, "MMM"), spending: parseFloat(calculateMonthTotal().toFixed(2)) },
    ];
  };

  const trendsData = getTrendsData();
  const categoryData = getCategoryData();
  const comparisonData = getComparisonData();

  const COLORS = {
    Entertainment: "hsl(var(--chart-1))",
    Productivity: "hsl(var(--chart-2))",
    Health: "hsl(var(--chart-3))",
    Shopping: "hsl(var(--chart-4))",
    Other: "hsl(var(--chart-5))",
  };

  const viewIcons = {
    trends: TrendingUp,
    categories: PieChart,
    comparison: BarChart3,
  };

  const viewTitles = {
    trends: "Spending Trends",
    categories: "Category Breakdown",
    comparison: "Month Comparison",
  };

  const CurrentIcon = viewIcons[currentView];

  if (!session) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-8 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 hover:scale-105 transition-transform"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
          Spending Insights
        </h1>
        <p className="text-muted-foreground">Track your subscription spending patterns and trends</p>
      </div>

      <div className="max-w-6xl mx-auto mb-6 flex gap-2 justify-center md:justify-start">
        <Button
          variant={currentView === "trends" ? "default" : "outline"}
          onClick={() => setCurrentView("trends")}
          className="transition-all hover:scale-105"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Trends
        </Button>
        <Button
          variant={currentView === "categories" ? "default" : "outline"}
          onClick={() => setCurrentView("categories")}
          className="transition-all hover:scale-105"
        >
          <PieChart className="mr-2 h-4 w-4" />
          Categories
        </Button>
        <Button
          variant={currentView === "comparison" ? "default" : "outline"}
          onClick={() => setCurrentView("comparison")}
          className="transition-all hover:scale-105"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Compare
        </Button>
      </div>

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="max-w-6xl mx-auto"
      >
        <Card className="shadow-soft hover:shadow-medium transition-all animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrentIcon className="h-5 w-5 text-primary" />
              {viewTitles[currentView]}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Swipe left/right to switch views on mobile
            </p>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No subscription data yet</p>
                <Button onClick={() => navigate("/")}>Add Your First Subscription</Button>
              </div>
            ) : (
              <>
                {currentView === "trends" && (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={trendsData}>
                      <defs>
                        <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Spending"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="spending"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorSpending)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {currentView === "categories" && (
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsPie>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} />
                        ))}
                      </Pie>
                    </RechartsPie>
                  </ResponsiveContainer>
                )}

                {currentView === "comparison" && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Spending"]}
                      />
                      <Bar dataKey="spending" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {subscriptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="shadow-soft hover:shadow-medium transition-all hover:scale-105">
              <CardHeader>
                <CardTitle className="text-lg">Average Monthly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {formatCurrency(trendsData.reduce((sum, d) => sum + d.spending, 0) / trendsData.length)}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all hover:scale-105">
              <CardHeader>
                <CardTitle className="text-lg">Highest Category</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {categoryData.length > 0 ? categoryData.reduce((max, cat) => cat.value > max.value ? cat : max).name : "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all hover:scale-105">
              <CardHeader>
                <CardTitle className="text-lg">Month Change</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  comparisonData[2]?.spending > comparisonData[1]?.spending ? "text-destructive" : "text-success"
                }`}>
                  {comparisonData[2] && comparisonData[1]
                    ? `${comparisonData[2].spending > comparisonData[1].spending ? "+" : ""}${((comparisonData[2].spending - comparisonData[1].spending) / comparisonData[1].spending * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingInsights;
