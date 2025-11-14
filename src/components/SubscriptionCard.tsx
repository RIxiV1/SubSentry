import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Edit } from "lucide-react";
import { Subscription } from "@/pages/Dashboard";
import { format, differenceInDays } from "date-fns";
import { useState, useRef, useEffect } from "react";

interface SubscriptionCardProps {
  subscription: Subscription;
  onDelete: (id: string) => void;
  onEdit: (subscription: Subscription) => void;
}

const SubscriptionCard = ({ subscription, onDelete, onEdit }: SubscriptionCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe to -120px (left) or 0px (right)
    const clampedDiff = Math.max(-120, Math.min(0, diff));
    setTranslateX(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Snap to open (-120px) if swiped more than 60px, otherwise snap back to 0
    if (translateX < -60) {
      setTranslateX(-120);
    } else {
      setTranslateX(0);
    }
  };

  const handleEdit = () => {
    setTranslateX(0);
    onEdit(subscription);
  };

  const handleDelete = () => {
    setTranslateX(0);
    onDelete(subscription.id);
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setTranslateX(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Action Buttons (Mobile) */}
      <div className="absolute right-0 top-0 bottom-0 w-[120px] flex items-center justify-end gap-2 pr-4 bg-gradient-to-l from-destructive/20 to-primary/20 z-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/20 transition-all"
          aria-label={`Edit ${subscription.name} subscription`}
        >
          <Edit className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/20 transition-all"
          aria-label={`Delete ${subscription.name} subscription`}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Card Content */}
      <Card 
        className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1 duration-300 group relative z-10"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {subscription.name}
            </CardTitle>
            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                aria-label={`Edit ${subscription.name} subscription`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                aria-label={`Delete ${subscription.name} subscription`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
    </div>
  );
};

export default SubscriptionCard;