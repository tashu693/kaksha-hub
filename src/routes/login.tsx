import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth";
import { pageMeta } from "@/lib/route-meta";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route=createFileRoute("/login")({validateSearch:(s)=>searchSchema.parse(s),head:()=>pageMeta("Log In","Log in to your Kaksha Hub student account."),component:Login});

function safePath(p: string | undefined) { return p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard"; }

function Login(){
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [info,setInfo]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent){e.preventDefault();setError("");setInfo("");
    const parsed = z.object({email:z.string().trim().email("Please enter a valid email address."),password:z.string().min(1,"Please enter your password.")}).safeParse({email,password});
    if(!parsed.success){setError(parsed.error.issues[0]?.message??"Invalid input");return;}
    setBusy(true);
    try{const {error}=await supabase.auth.signInWithPassword(parsed.data); if(error){setError(friendlyAuthError(error.message));return;} navigate({to:safePath(search.redirect) as "/dashboard",replace:true});}
    catch{setError(friendlyAuthError("network"));}finally{setBusy(false);}
  }
  async function forgot(){setError("");setInfo("");
    if(!z.string().email().safeParse(email.trim()).success){setError("Enter your email above, then click “Forgot password?”.");return;}
    setBusy(true);
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});
    setBusy(false);
    if(error)setError(friendlyAuthError(error.message)); else setInfo("If an account exists for this email, a reset link is on its way.");
  }
  return <AuthFrame title="Welcome back" subtitle="Continue to your academic resource workspace."><form noValidate onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Email address</span><span className="relative block"><Mail className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 pl-9" placeholder="you@college.edu"/></span></label><label className="block"><span className="mb-2 block text-sm font-semibold">Password</span><span className="relative block"><LockKeyhole className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 pl-9" placeholder="Enter your password"/></span></label><div className="flex justify-end"><button type="button" onClick={forgot} disabled={busy} className="text-xs font-semibold text-primary">Forgot password?</button></div><Button type="submit" size="lg" className="w-full" disabled={busy}>{busy?"Please wait…":"Log in"}</Button>{error&&<p role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive">{error}</p>}{info&&<p role="status" className="rounded-md bg-primary/10 p-3 text-center text-sm font-semibold text-primary">{info}</p>}<p className="text-center text-sm text-muted-foreground">New to Kaksha Hub? <Link to="/register" className="font-bold text-primary">Create an account</Link></p></form></AuthFrame>}

export function AuthFrame({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <div className="mx-auto grid min-h-[680px] max-w-6xl items-center px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8"><div className="hidden h-full min-h-[560px] rounded-l-lg bg-ink p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3 font-display text-xl font-extrabold"><span className="grid size-10 place-items-center rounded-md bg-gradient-brand"><GraduationCap/></span>KAKSHA HUB</div><div><p className="font-display text-4xl font-extrabold leading-tight">Every semester.<br/>Every subject.<br/><span className="text-highlight">One study space.</span></p><p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/65">Organized AKTU material, contributed by students who understand the syllabus.</p></div><p className="text-xs text-primary-foreground/45">Secure student accounts</p></div><div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-10 lg:rounded-l-none"><p className="text-xs font-bold uppercase tracking-widest text-primary">KAKSHA HUB</p><h1 className="mt-3 font-display text-3xl font-extrabold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p><div className="mt-8">{children}</div></div></div>}
