import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fieldClass } from "@/components/kaksha/page-ui";
import { branches } from "@/lib/mock-data";
import { pageMeta } from "@/lib/route-meta";
import { AuthFrame } from "./login";

export const Route=createFileRoute("/register")({head:()=>pageMeta("Register","Preview Kaksha Hub student account registration."),component:Register});
function Register(){const [message,setMessage]=useState("");return <AuthFrame title="Create your study space" subtitle="Set up your academic profile in a few details."><form onSubmit={e=>{e.preventDefault();setMessage("Registration is coming in Phase 2.")}} className="grid gap-4 sm:grid-cols-2"><Label label="Full name" wide><Input required className="h-11" placeholder="Your name"/></Label><Label label="Email address" wide><Input required type="email" className="h-11" placeholder="you@college.edu"/></Label><Label label="Branch"><select required className={fieldClass}><option value="">Select</option>{branches.map(b=><option key={b.code}>{b.code}</option>)}</select></Label><Label label="Semester"><select required className={fieldClass}><option value="">Select</option>{Array.from({length:8},(_,i)=><option key={i}>{String(i+1).padStart(2,"0")}</option>)}</select></Label><Label label="Password" wide><Input required type="password" className="h-11" placeholder="Create a secure password"/></Label><Button size="lg" type="submit" className="sm:col-span-2">Create account</Button>{message&&<p role="status" className="rounded-md bg-primary/10 p-3 text-center text-sm font-semibold text-primary sm:col-span-2">{message}</p>}<p className="text-center text-sm text-muted-foreground sm:col-span-2">Already have an account? <Link to="/login" className="font-bold text-primary">Log in</Link></p></form></AuthFrame>}
function Label({label,wide=false,children}:{label:string;wide?:boolean;children:React.ReactNode}){return <label className={wide?"sm:col-span-2":""}><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>}