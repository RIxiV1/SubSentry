import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Search, TrendingUp, LogOut, Sparkles } from "lucide-react";

interface CommandPaletteProps {
  onAddSubscription: () => void;
  onLogout: () => void;
}

const CommandPalette = ({ onAddSubscription, onLogout }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-background/50 border border-border rounded-lg hover:bg-accent/50 transition-all"
      >
        <Search className="w-4 h-4" />
        <span>Quick actions...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(onAddSubscription)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Subscription</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => window.scrollTo({ top: 0, behavior: 'smooth' }))}>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>View Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => document.querySelector('[data-savings-tracker]')?.scrollIntoView({ behavior: 'smooth' }))}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>View Savings</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => runCommand(onLogout)}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandPalette;
