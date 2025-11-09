import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Bestie, that email ain't it" }).max(255),
  password: z.string().min(6, { message: "Password needs at least 6 characters. Keep it secure!" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = authSchema.parse({ email, password });
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Oops!",
              description: "Email or password isn't right. Try again?",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Something went wrong",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back! 💙",
            description: "Let's check on those subscriptions",
          });
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Hold up!",
              description: "You're already registered. Try logging in instead?",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Something went wrong",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Bet! You're in 🎉",
            description: "Welcome to your financial glow-up journey",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Quick check",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {isLogin ? "Welcome Back!" : "Let's Get Started"}
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin 
              ? "Time to check on your subscriptions 👀" 
              : "Your data stays yours. No bank linking. We're not about that life."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hold up...
                </>
              ) : (
                isLogin ? "Let's Go" : "Start Tracking"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {isLogin 
                ? "New here? Sign up instead" 
                : "Already have an account? Log in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;