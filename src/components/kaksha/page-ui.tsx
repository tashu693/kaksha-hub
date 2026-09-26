import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="border-b border-border bg-secondary/45"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">{eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}<div className="mt-2 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-3xl"><h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p></div>{actions}</div></div></header>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}<h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function StatCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail?: string }) {
  return <div className="rounded-lg border border-border bg-card p-5 shadow-card"><div className="flex items-start justify-between"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span></div><p className="mt-3 font-display text-3xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
}

export const fieldClass = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
export const panelClass = "rounded-lg border border-border bg-card p-5 shadow-card sm:p-6";