import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Subscription } from "@/pages/Dashboard";

interface DashboardStatsProps {
  subscriptions: Subscription[];
}

const DashboardStats = ({ subscriptions }: DashboardStatsProps) => {
  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const cost = sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost;
      return total + cost;
    }, 0);
  };

  const calculateAnnualTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const cost = sub.billing_cycle === "yearly" ? sub.cost : sub.cost * 12;
      return total + cost;
    }, 0);
  };

  const getUpcomingRenewals = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return subscriptions.filter(sub => {
      const renewalDate = new Date(sub.next_renewal_date);
      return renewalDate >= today && renewalDate <= nextWeek;
    }).length;
  };

  const monthlyTotal = calculateMonthlyTotal();
  const annualTotal = calculateAnnualTotal();
  const upcomingRenewals = getUpcomingRenewals();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Monthly Spend</p>
              <p className="text-3xl font-bold">${monthlyTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Annual Total</p>
              <p className="text-3xl font-bold">${annualTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-accent/10">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Renewals (7 days)</p>
              <p className="text-3xl font-bold">{upcomingRenewals}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;