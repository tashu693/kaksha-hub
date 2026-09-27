import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fieldClass } from "@/components/kaksha/page-ui";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, registerSchema } from "@/lib/auth";
import { branches } from "@/lib/mock-data";
import { pageMeta } from "@/lib/route-meta";
import { AuthFrame } from "./login";

export const Route=createFileRoute("/register")({head:()=>pageMeta("Register","Create your Kaksha Hub student account."),component:Register});
function Register(){
  const [form,setForm]=useState({fullName:"",email:"",password:"",confirm:"",branch:"",semester:""});
  const [error,setError]=useState(""); const [done,setDone]=useState(false); const [busy,setBusy]=useState(false);
  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(f=>({...f,[k]:e.target.value}));
  async function submit(e:React.FormEvent){e.preventDefault();setError("");
    const parsed=registerSchema.safeParse(form); if(!parsed.success){setError(parsed.error.issues[0]?.message??"Invalid input");return;}
    setBusy(true);
    try{const {fullName,email,password,branch,semester}=parsed.data;
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin,data:{full_name:fullName,branch,semester}}});
      if(error){setError(friendlyAuthError(error.message));return;}
      if(data.user && data.user.identities?.length===0){setError(friendlyAuthError("already registered"));return;}
      setDone(true);
    }catch{setError(friendlyAuthError("network"));}finally{setBusy(false);}
  }
  if(done) return <AuthFrame title="Check your email" subtitle="We sent a confirmation link to finish creating your account."><p role="status" className="rounded-md bg-primary/10 p-4 text-sm font-semibold text-primary">Open the link in your inbox, then log in to your study space.</p><Button asChild size="lg" className="mt-6 w-full"><Link to="/login">Go to log in</Link></Button></AuthFrame>;
  return <AuthFrame title="Create your study space" subtitle="Set up your academic profile in a few details."><form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Label label="Full name" wide><Input required autoComplete="name" value={form.fullName} onChange={set("fullName")} className="h-11" placeholder="Your name"/></Label><Label label="Email address" wide><Input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className="h-11" placeholder="you@college.edu"/></Label><Label label="Branch"><select required value={form.branch} onChange={set("branch")} className={fieldClass}><option value="">Select</option>{branches.map(b=><option key={b.code} value={b.code}>{b.code}</option>)}</select></Label><Label label="Current semester"><select required value={form.semester} onChange={set("semester")} className={fieldClass}><option value="">Select</option>{Array.from({length:8},(_,i)=><option key={i} value={i+1}>{String(i+1).padStart(2,"0")}</option>)}</select></Label><Label label="Password"><Input required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} className="h-11" placeholder="8+ chars, letter & number"/></Label><Label label="Confirm password"><Input required type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className="h-11" placeholder="Repeat password"/></Label><Button size="lg" type="submit" disabled={busy} className="sm:col-span-2">{busy?"Creating account…":"Create account"}</Button>{error&&<p role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive sm:col-span-2">{error}</p>}<p className="text-center text-sm text-muted-foreground sm:col-span-2">Already have an account? <Link to="/login" className="font-bold text-primary">Log in</Link></p></form></AuthFrame>}
function Label({label,wide=false,children}:{label:string;wide?:boolean;children:React.ReactNode}){return <label className={wide?"sm:col-span-2":""}><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>}
