import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, Trash2, History } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const SavingsTracker = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savingsHistory = [] } = useQuery({
    queryKey: ['savings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_history")
        .select("*")
        .order("saved_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const totalMonthlySavings = savingsHistory.reduce(
    (sum, entry) => sum + Number(entry.monthly_savings),
    0
  );

  const totalYearlySavings = totalMonthlySavings * 12;

  const handleDeleteEntry = (id: string) => {
    setSelectedEntryId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (!selectedEntryId) return;
    
    try {
      const { error } = await supabase
        .from("savings_history")
        .delete()
        .eq("id", selectedEntryId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({
        title: "Entry deleted",
        description: "Savings history entry removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setSelectedEntryId(null);
  };

  const confirmDeleteAllHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("savings_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({
        title: "History cleared",
        description: "All savings history has been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (savingsHistory.length === 0) return null;

  return (
    <>
      <Card className="bg-gradient-celebration border-accent/20 shadow-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-accent" />
              Your Savings Era 💰
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteAllDialogOpen(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <History className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-accent/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Monthly Savings
              </div>
              <div className="text-3xl font-bold text-accent">
                {formatCurrency(totalMonthlySavings)}
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-accent/20">
              <div className="text-sm text-muted-foreground mb-1">
                Yearly Savings
              </div>
              <div className="text-3xl font-bold text-accent">
                {formatCurrency(totalYearlySavings)}
              </div>
            </div>
          </div>
          
          {savingsHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Wins:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {savingsHistory.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex justify-between items-center text-sm bg-card/30 backdrop-blur-sm rounded p-2 group"
                  >
                    <span className="text-foreground">{entry.subscription_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-accent">
                        +{formatCurrency(Number(entry.monthly_savings))}/mo
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteEntry}
        title="Delete Savings Entry?"
        description="This will remove this entry from your savings history. This action cannot be undone."
      />

      <DeleteConfirmDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={confirmDeleteAllHistory}
        title="Clear All Savings History?"
        description="This will permanently delete all your savings history entries. This action cannot be undone."
      />
    </>
  );
};

export default SavingsTracker;
