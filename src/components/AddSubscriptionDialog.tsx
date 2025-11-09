import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Loader2 } from "lucide-react";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const subscriptionSchema = z.object({
  name: z.string().trim().min(1, { message: "Name can't be empty, bestie" }).max(100),
  cost: z.number().positive({ message: "Cost gotta be positive" }),
  billing_cycle: z.string().min(1),
  next_renewal_date: z.string().min(1, { message: "When's it renewing?" }),
  category: z.string().min(1, { message: "Pick a category" }),
});

const categories = [
  "Entertainment",
  "Productivity",
  "Health",
  "Shopping",
  "Other",
];

const AddSubscriptionDialog = ({ open, onOpenChange, onSuccess }: AddSubscriptionDialogProps) => {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setCost("");
    setBillingCycle("monthly");
    setRenewalDate("");
    setCategory("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = subscriptionSchema.parse({
        name,
        cost: parseFloat(cost),
        billing_cycle: billingCycle,
        next_renewal_date: renewalDate,
        category,
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.from("subscriptions").insert([
        {
          user_id: session.user.id,
          name: validatedData.name,
          cost: validatedData.cost,
          billing_cycle: validatedData.billing_cycle,
          next_renewal_date: validatedData.next_renewal_date,
          category: validatedData.category,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Got it! 🎯",
        description: `Added ${name} to the watchlist`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Hold up",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: "Couldn't add that subscription. Try again?",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add to the Hit List</DialogTitle>
          <DialogDescription>
            What are we tracking today? Just the essentials, no stress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subscription Name</Label>
            <Input
              id="name"
              placeholder="Netflix, Spotify, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="14.99"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing">Billing</Label>
              <Select value={billingCycle} onValueChange={(value: "monthly" | "yearly") => setBillingCycle(value)} disabled={loading}>
                <SelectTrigger id="billing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal">Next Renewal Date</Label>
            <Input
              id="renewal"
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Nah, cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add it!"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscriptionDialog;