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
              title: "nah bestie 😬",
              description: "that email or password ain't it. wanna try again?",
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
            title: "yess bestie, you're back! 💙",
            description: "let's see what we're working with 👀",
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
              title: "wait wait wait! 🤚",
              description: "you're already in the fam! just log in bestie",
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
            title: "period! you're in 🎉",
            description: "welcome to your financial glow-up era ✨",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <Card className="w-full max-w-md shadow-glow backdrop-blur-sm bg-card/95 relative z-10 animate-fade-in border-2">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
              💸
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {isLogin ? "hey bestie! 💙" : "let's glow up 🦋"}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {isLogin 
              ? "ready to slay those subscriptions? let's check the damage 👀✨" 
              : "track your subs, save your coins, live your best life. no cap! 🎯"}
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
                className="transition-all focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                aria-label="Email address"
                autoComplete="email"
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
                className="transition-all focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                aria-label="Password"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 shadow-glow text-lg font-semibold py-6" 
              disabled={loading}
              aria-label={isLogin ? "Sign in to your account" : "Create new account"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  manifesting...
                </>
              ) : (
                isLogin ? "let's gooo 🚀" : "start my glow-up ✨"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-all hover:scale-105 font-medium"
              disabled={loading}
              aria-label={isLogin ? "Switch to sign up mode" : "Switch to sign in mode"}
            >
              {isLogin 
                ? "new here? join the club 🎉" 
                : "wait, i already have an account 😅"}
            </button>
          </div>
          
          {!isLogin && (
            <div className="mt-4 p-3 rounded-lg bg-accent/20 border border-accent/30">
              <p className="text-xs text-center text-muted-foreground">
                no sketchy stuff, we promise 🤝 your data = your business
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;