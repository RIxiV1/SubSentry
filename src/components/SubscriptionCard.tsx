import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";
import { Subscription } from "@/pages/Dashboard";
import { format, differenceInDays } from "date-fns";

interface SubscriptionCardProps {
  subscription: Subscription;
  onDelete: (id: string) => void;
}

const SubscriptionCard = ({ subscription, onDelete }: SubscriptionCardProps) => {
  const getDaysUntilRenewal = () => {
    const today = new Date();
    const renewalDate = new Date(subscription.next_renewal_date);
    return differenceInDays(renewalDate, today);
  };

  const daysUntil = getDaysUntilRenewal();
  const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Entertainment: "bg-secondary/10 text-secondary border-secondary/20",
      Productivity: "bg-primary/10 text-primary border-primary/20",
      Health: "bg-success/10 text-success border-success/20",
      Shopping: "bg-accent/10 text-accent border-accent/20",
      Other: "bg-muted/10 text-muted-foreground border-muted/20",
    };
    return colors[category] || colors.Other;
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{subscription.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subscription.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-primary">
              ${subscription.cost.toFixed(2)}
            </span>
            <Badge variant="outline" className={getCategoryColor(subscription.category)}>
              {subscription.category}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            per {subscription.billing_cycle === "monthly" ? "month" : "year"}
          </div>

          <div className={`flex items-center gap-2 text-sm ${isUpcoming ? "text-accent font-medium" : "text-muted-foreground"}`}>
            <Calendar className="w-4 h-4" />
            <span>
              {isUpcoming ? (
                daysUntil === 0 ? "Renews today!" : `Renews in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}`
              ) : (
                `Next: ${format(new Date(subscription.next_renewal_date), "MMM d, yyyy")}`
              )}
            </span>
          </div>

          {subscription.billing_cycle === "yearly" && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              ${(subscription.cost / 12).toFixed(2)}/month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;