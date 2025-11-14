import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import EditSubscriptionDialog from "@/components/EditSubscriptionDialog";
import SpendingInsights from "@/components/SpendingInsights";
import ThemeToggle from "@/components/ThemeToggle";
import SavingsTracker from "@/components/SavingsTracker";
import BudgetAnalyzer from "@/components/BudgetAnalyzer";
import BudgetSettings from "@/components/BudgetSettings";
import SkeletonCard from "@/components/SkeletonCard";
import SkeletonStats from "@/components/SkeletonStats";
import CommandPalette from "@/components/CommandPalette";
import SearchFilter from "@/components/SearchFilter";
import confetti from "canvas-confetti";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: string;
  next_renewal_date: string;
  category: string;
  usage_frequency?: string;
  last_used_date?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("next_renewal_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
  });

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "See you later! 👋",
      description: "Come back anytime to check your subs",
    });
    navigate("/auth");
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const deletedSub = subscriptions.find(sub => sub.id === id);
      
      if (!deletedSub) return;

      const monthlySavings = deletedSub.billing_cycle === "yearly" 
        ? deletedSub.cost / 12
        : deletedSub.cost;

      // Save to savings history
      const { error: savingsError } = await supabase
        .from("savings_history")
        .insert({
          subscription_name: deletedSub.name,
          monthly_savings: monthlySavings,
          user_id: user?.id,
        });

      if (savingsError) throw savingsError;

      // Delete subscription
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF6B9D", "#C084FC", "#60A5FA"],
      });

      toast({
        title: "Period. You just saved money! 💸",
        description: `That's $${monthlySavings.toFixed(2)}/mo back in your pocket. Slay!`,
      });
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsEditDialogOpen(true);
  };

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = (() => {
    let filtered = subscriptions || [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(sub => sub.category === selectedCategory);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost-high":
          const aCost = a.billing_cycle === "yearly" ? a.cost / 12 : a.cost;
          const bCost = b.billing_cycle === "yearly" ? b.cost / 12 : b.cost;
          return bCost - aCost;
        case "cost-low":
          const aCostLow = a.billing_cycle === "yearly" ? a.cost / 12 : a.cost;
          const bCostLow = b.billing_cycle === "yearly" ? b.cost / 12 : b.cost;
          return aCostLow - bCostLow;
        case "renewal":
          return new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">SubSentry 💸</h1>
              <p className="text-muted-foreground">Loading your fin-bestie...</p>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" disabled className="gap-2">
                <LogOut className="w-4 h-4" />
                Peace out
              </Button>
            </div>
          </div>

          {/* Stats Skeleton */}
          <SkeletonStats />

          {/* Subscriptions Skeleton */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Subscriptions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SubSentry 💸
            </h1>
            <p className="text-muted-foreground">Your fin-bestie keeping track</p>
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette onAddSubscription={() => setIsAddDialogOpen(true)} onLogout={handleLogout} />
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
              aria-label="Log out of your account"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Peace out</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <DashboardStats subscriptions={subscriptions} />
        </div>

        {/* Budget Settings */}
        <div className="mt-8">
          <BudgetSettings />
        </div>

        {/* Budget Analyzer */}
        {userSettings && subscriptions.length > 0 && (
          <div className="mt-8">
            <BudgetAnalyzer 
              subscriptions={subscriptions}
              monthlyBudget={parseFloat(userSettings.monthly_budget.toString())}
              onCancelRecommendation={handleDeleteSubscription}
            />
          </div>
        )}

        {/* Savings Tracker */}
        <div className="mt-8">
          <SavingsTracker />
        </div>

        {/* Spending Insights */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <SpendingInsights subscriptions={subscriptions} />
          </div>
        )}

        {/* Subscriptions List */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Your Subscriptions</h2>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 shadow-sm hover:shadow-md"
              aria-label="Add new subscription"
            >
              <Plus className="w-4 h-4" />
              Add to Hit List
            </Button>
          </div>

          {subscriptions.length > 0 && (
            <div className="mb-6">
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          )}

          {subscriptions.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-lg shadow-soft animate-fade-in">
              <div className="mb-6 text-6xl animate-bounce">📱</div>
              <p className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Nothing here yet!
              </p>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Let's add your first subscription and start tracking your spending.
                It's giving organized energy ✨
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Add Your First Sub
              </Button>
            </div>
          ) : filteredAndSortedSubscriptions.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all" 
                  ? "No subscriptions match your filters 🔍" 
                  : "No subscriptions found"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onDelete={handleDeleteSubscription}
                  onEdit={handleEditSubscription}
                />
              ))}
            </div>
          )}
        </div>

        <AddSubscriptionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}
        />

        <EditSubscriptionDialog
          subscription={editingSubscription}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}
        />

        {/* Floating Action Button for mobile */}
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl md:hidden z-50 hover:scale-110 transition-transform bg-gradient-primary"
          aria-label="Quick add subscription"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;