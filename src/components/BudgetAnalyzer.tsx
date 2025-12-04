import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Subscription } from "@/pages/Dashboard";
import { AlertTriangle, TrendingDown, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";

interface BudgetAnalyzerProps {
  subscriptions: Subscription[];
  monthlyBudget: number;
  onCancelRecommendation: (id: string) => void;
}

interface Recommendation {
  subscription: Subscription;
  reason: string;
  priority: "high" | "medium" | "low";
  savings: number;
}

const BudgetAnalyzer = ({ subscriptions, monthlyBudget, onCancelRecommendation }: BudgetAnalyzerProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { formatCurrency } = useCurrency();

  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const monthlyCost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
      return total + monthlyCost;
    }, 0);
  };

  const monthlyTotal = calculateMonthlyTotal();
  const budgetUsed = (monthlyTotal / monthlyBudget) * 100;
  const overBudget = monthlyTotal > monthlyBudget;
  const amountOver = monthlyTotal - monthlyBudget;

  const getRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    subscriptions.forEach((sub) => {
      const monthlyCost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
      let priority: "high" | "medium" | "low" = "low";
      let reason = "";

      if (sub.usage_frequency === "never" || sub.usage_frequency === "rarely") {
        priority = "high";
        reason = `${sub.usage_frequency === "never" ? "Never used" : "Rarely used"} - easy savings!`;
      }
      else if (monthlyCost > 15 && (sub.usage_frequency === "monthly" || !sub.usage_frequency)) {
        priority = "medium";
        reason = "Expensive with limited use - consider alternatives";
      }
      else {
        const sameCategoryCount = subscriptions.filter(s => s.category === sub.category).length;
        if (sameCategoryCount > 2) {
          priority = "low";
          reason = `Multiple ${sub.category} subscriptions - consolidate?`;
        }
      }

      if (reason) {
        recommendations.push({
          subscription: sub,
          reason,
          priority,
          savings: monthlyCost,
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.savings - a.savings;
    });
  };

  const recommendations = getRecommendations();
  const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getBudgetColor = () => {
    if (budgetUsed >= 100) return "hsl(var(--destructive))";
    if (budgetUsed >= 80) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  };

  return (
    <Card className="shadow-soft border-2 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Budget Analysis
          </CardTitle>
          {overBudget && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Over Budget
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Spending</span>
            <span className="font-bold" style={{ color: getBudgetColor() }}>
              {formatCurrency(monthlyTotal)} / {formatCurrency(monthlyBudget)}
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUsed, 100)} 
            className="h-3 transition-all duration-500"
            style={{
              backgroundColor: "hsl(var(--muted))",
            }}
          />
          {overBudget && (
            <p className="text-sm text-destructive font-medium animate-fade-in">
              You're {formatCurrency(amountOver)} over budget this month
            </p>
          )}
        </div>

        {/* Recommendations Summary */}
        {recommendations.length > 0 && (
          <div className="bg-accent/50 rounded-lg p-4 space-y-3 animate-scale-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Smart Recommendations</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {recommendations.length} subscription{recommendations.length > 1 ? 's' : ''} to review
                </p>
                <p className="text-lg font-bold text-success flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Save up to {formatCurrency(potentialSavings)}/mo
                </p>
              </div>
              <Button
                onClick={() => setShowRecommendations(!showRecommendations)}
                variant={showRecommendations ? "outline" : "default"}
                className="gap-2"
              >
                {showRecommendations ? "Hide" : "Show"} Details
              </Button>
            </div>
          </div>
        )}

        {/* Detailed Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {recommendations.map((rec) => (
              <div
                key={rec.subscription.id}
                className="border rounded-lg p-4 hover:border-primary transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rec.subscription.name}</h4>
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-success">
                      +{formatCurrency(rec.savings)}/mo
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onCancelRecommendation(rec.subscription.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2 mt-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  Cancel & Save
                </Button>
              </div>
            ))}
          </div>
        )}

        {recommendations.length === 0 && (
          <div className="text-center py-6 animate-fade-in">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-success" />
            <p className="font-semibold text-success">You're doing great!</p>
            <p className="text-sm text-muted-foreground">
              No obvious subscriptions to cut right now
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetAnalyzer;
