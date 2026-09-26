import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kaksha/page-ui";
import { ResourceCard } from "@/components/kaksha/resource-card";
import { resources } from "@/lib/mock-data";
import { pageMeta } from "@/lib/route-meta";
import { cn } from "@/lib/utils";

export const Route=createFileRoute("/my-resources")({head:()=>pageMeta("My Resources","Review saved, shared and recently viewed AKTU study resources."),component:MyResources});
function MyResources(){const [tab,setTab]=useState("Saved");const tabs=["Saved","Shared","Recently Viewed"];const list=tab==="Shared"?resources.slice(1,3):tab==="Recently Viewed"?resources.slice(2,5):resources.slice(0,4);return <><PageHeader eyebrow="Personal library" title="My Resources" description="Keep your saved material, shared contributions and recent learning in one place."/><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="flex gap-1 overflow-x-auto border-b border-border">{tabs.map(item=><button key={item} onClick={()=>setTab(item)} className={cn("cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-muted-foreground",tab===item&&"border-primary text-primary")}>{item}</button>)}</div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map(r=><ResourceCard key={r.id} resource={r}/>)}</div></div></>}