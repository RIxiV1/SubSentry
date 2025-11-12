import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save } from "lucide-react";
import { z } from "zod";

const budgetSchema = z.object({
  monthly_budget: z.number().positive({ message: "Budget must be greater than 0" }).max(1000000, { message: "Budget must be less than $1,000,000" }),
});

const BudgetSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [budget, setBudget] = useState("");

  const { data: settings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBudget(data.monthly_budget.toString());
      }
      
      return data;
    },
  });

  const handleSaveBudget = async () => {
    try {
      const budgetValue = parseFloat(budget.trim());
      
      if (isNaN(budgetValue)) {
        toast({
          title: "Invalid budget",
          description: "Please enter a valid number",
          variant: "destructive",
        });
        return;
      }

      const validation = budgetSchema.safeParse({ monthly_budget: budgetValue });
      
      if (!validation.success) {
        toast({
          title: "Invalid budget",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (settings) {
        const { error } = await supabase
          .from("user_settings")
          .update({ monthly_budget: budgetValue })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            monthly_budget: budgetValue,
          });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['user-settings'] });

      toast({
        title: "Budget saved! 🎯",
        description: `Your monthly budget is now $${budgetValue}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to save budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Monthly Budget
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="budget" className="sr-only">Budget Amount</Label>
            <Input
              id="budget"
              type="number"
              placeholder="Enter your monthly budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="text-lg"
              min="0"
              max="1000000"
              step="0.01"
            />
          </div>
          <Button onClick={handleSaveBudget} className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Set a monthly budget to get smart recommendations
        </p>
      </CardContent>
    </Card>
  );
};

export default BudgetSettings;