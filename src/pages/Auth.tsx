import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AuthComponent } from "@/components/ui/sign-up";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Bestie, that email ain't it" }).max(255),
  password: z.string().min(6, { message: "Password needs at least 6 characters. Keep it secure!" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
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

  const handleAuth = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
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
            return { success: false, error: "nah bestie 😬 that email or password ain't it" };
          }
          return { success: false, error: error.message };
        }
        
        toast({
          title: "yess bestie, you're back! 💙",
          description: "let's see what we're working with 👀",
        });
        return { success: true };
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
            return { success: false, error: "wait wait wait! 🤚 you're already in the fam!" };
          }
          return { success: false, error: error.message };
        }
        
        toast({
          title: "period! you're in 🎉",
          description: "welcome to your financial glow-up era ✨",
        });
        return { success: true };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: "Something went wrong" };
    }
  };

  const Logo = () => (
    <div className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
      💸
    </div>
  );

  return (
    <div className="relative">
      <AuthComponent 
        logo={<Logo />}
        brandName="SubTracker"
        onSubmit={handleAuth}
        isLogin={isLogin}
      />
      
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-foreground/70 hover:text-foreground transition-all hover:scale-105 font-medium backdrop-blur-sm bg-background/30 px-4 py-2 rounded-full border border-border/50"
        >
          {isLogin 
            ? "new here? join the club 🎉" 
            : "wait, i already have an account 😅"}
        </button>
      </div>
    </div>
  );
};

export default Auth;