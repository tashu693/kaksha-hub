import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, BookOpen, GitBranch, GraduationCap, Home, Linkedin, Menu, Upload, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/branches" as const, label: "Branches" },
  { to: "/resources" as const, label: "Resources" },
  { to: "/contribute" as const, label: "Contribute" },
  { to: "/my-resources" as const, label: "My Resources" },
  { to: "/profile" as const, label: "Profile" },
];

const mobileLinks = [
  { to: "/" as const, label: "Home", icon: Home },
  { to: "/branches" as const, label: "Branches", icon: GitBranch },
  { to: "/resources" as const, label: "Resources", icon: BookOpen },
  { to: "/contribute" as const, label: "Contribute", icon: Upload },
  { to: "/profile" as const, label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Kaksha Hub home">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-brand transition-transform group-hover:-rotate-3"><GraduationCap className="size-5" /></span>
            <span className="font-display text-lg font-extrabold tracking-normal">KAKSHA <span className="text-primary">HUB</span></span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {desktopLinks.map((item) => <Link key={item.to} to={item.to} className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", pathname === item.to && "bg-accent text-foreground")}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Notifications"><Link to="/notifications"><Bell /><span className="absolute mt-[-22px] ml-[18px] size-2 rounded-full bg-highlight" /></Link></Button>
            {user ? <><Button asChild className="hidden sm:inline-flex"><Link to="/dashboard">Dashboard</Link></Button><Button variant="outline" className="hidden sm:inline-flex" onClick={signOut}>Log out</Button></> : <><Button asChild variant="outline" className="hidden sm:inline-flex"><Link to="/login">Log in</Link></Button><Button asChild className="hidden sm:inline-flex"><Link to="/register">Register</Link></Button></>}
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {open && <nav className="border-t border-border bg-background px-4 py-3 lg:hidden" aria-label="Mobile menu">{desktopLinks.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent">{item.label}</Link>)}{user ? <div className="mt-2 grid grid-cols-2 gap-2"><Button asChild><Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></Button><Button variant="outline" onClick={signOut}>Log out</Button></div> : <div className="mt-2 grid grid-cols-2 gap-2"><Button asChild variant="outline"><Link to="/login">Log in</Link></Button><Button asChild><Link to="/register">Register</Link></Button></div>}</nav>}
      </header>
      <main>{children}</main>
      <CreatorSection />
      <footer className="border-t border-border bg-ink py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-center sm:px-6 md:flex-row md:items-end md:justify-between md:text-left lg:px-8">
          <div><div className="font-display text-xl font-extrabold">KAKSHA HUB</div><p className="mt-2 text-sm text-primary-foreground/65">Your AKTU study material, all in one place.</p></div>
          <div className="text-sm text-primary-foreground/65"><p>© 2026 Kaksha Hub</p><p>Academic Resource Platform for AKTU Students.</p></div>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">
        {mobileLinks.map((item) => { const Icon = item.icon; const active = pathname === item.to; return <Link key={item.to} to={item.to} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground", active && "text-primary")}><Icon className="size-5" />{item.label}</Link>; })}
      </nav>
    </div>
  );
}

function CreatorSection() {
  return (
    <section className="border-t border-border bg-secondary/60 py-20 md:py-24" aria-labelledby="creator-heading">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="mx-auto grid size-40 place-items-center rounded-full border-4 border-background bg-gradient-brand text-center shadow-xl md:size-48" aria-label="Creator photo placeholder"><span className="max-w-24 text-xs font-bold uppercase leading-relaxed text-primary-foreground">Creator photo placeholder</span></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-widest text-primary">Meet the creator</p>
        <h2 id="creator-heading" className="mt-2 font-display text-3xl font-extrabold">Tanishq Gupta</h2>
        <p className="mt-3 font-semibold text-foreground">AI Automation Developer <span className="text-muted-foreground">|</span> B.Tech CSE Student</p>
        <p className="mt-2 text-sm text-muted-foreground">AI Content Creator | Exploring Agentic AI | Building Intelligent AI Solutions</p>
        <p className="mt-5 text-sm font-medium">B.Tech Computer Science & Engineering</p>
        <p className="text-sm text-muted-foreground">Moradabad Institute of Technology, Moradabad</p>
        <Button asChild variant="outline" className="mt-6"><a href="https://www.linkedin.com/in/tanishq-gupta-b11688316" target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a></Button>
      </div>
    </section>
  );
}