import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Check } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface PopularService {
  name: string;
  defaultCost: number;
  category: string;
  icon: string;
  billingCycle: "monthly" | "yearly";
}

const popularServices: PopularService[] = [
  { name: "Netflix", defaultCost: 15.49, category: "Entertainment", icon: "🎬", billingCycle: "monthly" },
  { name: "Spotify", defaultCost: 10.99, category: "Entertainment", icon: "🎵", billingCycle: "monthly" },
  { name: "YouTube Premium", defaultCost: 13.99, category: "Entertainment", icon: "📺", billingCycle: "monthly" },
  { name: "Disney+", defaultCost: 13.99, category: "Entertainment", icon: "✨", billingCycle: "monthly" },
  { name: "Apple Music", defaultCost: 10.99, category: "Entertainment", icon: "🍎", billingCycle: "monthly" },
  { name: "HBO Max", defaultCost: 15.99, category: "Entertainment", icon: "🎭", billingCycle: "monthly" },
  { name: "Amazon Prime", defaultCost: 139.00, category: "Shopping", icon: "📦", billingCycle: "yearly" },
  { name: "Adobe Creative Cloud", defaultCost: 54.99, category: "Productivity", icon: "🎨", billingCycle: "monthly" },
  { name: "Microsoft 365", defaultCost: 99.99, category: "Productivity", icon: "📊", billingCycle: "yearly" },
  { name: "Notion", defaultCost: 10.00, category: "Productivity", icon: "📝", billingCycle: "monthly" },
  { name: "Slack", defaultCost: 8.75, category: "Productivity", icon: "💬", billingCycle: "monthly" },
  { name: "Gym Membership", defaultCost: 50.00, category: "Health", icon: "💪", billingCycle: "monthly" },
  { name: "Headspace", defaultCost: 69.99, category: "Health", icon: "🧘", billingCycle: "yearly" },
  { name: "Peloton", defaultCost: 44.00, category: "Health", icon: "🚴", billingCycle: "monthly" },
  { name: "ChatGPT Plus", defaultCost: 20.00, category: "Productivity", icon: "🤖", billingCycle: "monthly" },
  { name: "Canva Pro", defaultCost: 12.99, category: "Productivity", icon: "🖼️", billingCycle: "monthly" },
];

interface QuickAddServicesProps {
  onSelectService: (service: { 
    name: string; 
    cost: number; 
    category: string; 
    billingCycle: "monthly" | "yearly" 
  }) => void;
  existingSubscriptions: string[];
}

const QuickAddServices = ({ onSelectService, existingSubscriptions }: QuickAddServicesProps) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const availableServices = popularServices.filter(
    service => !existingSubscriptions.some(
      sub => sub.toLowerCase() === service.name.toLowerCase()
    )
  );

  const handleSelectService = (service: PopularService) => {
    setSelectedService(service.name);
    onSelectService({
      name: service.name,
      cost: service.defaultCost,
      category: service.category,
      billingCycle: service.billingCycle,
    });
    
    // Reset selection after a short delay
    setTimeout(() => setSelectedService(null), 1500);
  };

  if (availableServices.length === 0) return null;

  return (
    <Card className="border-primary/20 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          Quick Add Popular Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {availableServices.slice(0, 12).map((service) => {
            const isSelected = selectedService === service.name;
            return (
              <Button
                key={service.name}
                variant="outline"
                size="sm"
                onClick={() => handleSelectService(service)}
                className={`
                  gap-2 transition-all duration-300 hover:scale-105
                  ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/50'}
                `}
              >
                <span>{service.icon}</span>
                <span>{service.name}</span>
                {isSelected ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {formatCurrency(service.defaultCost)}/{service.billingCycle === "monthly" ? "mo" : "yr"}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Click to auto-fill subscription details • Prices in your local currency
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickAddServices;
