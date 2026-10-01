import { cn } from "@/lib/utils";

const styles = {
  pending: "bg-highlight/15 text-highlight-strong",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
} as const;

export function StatusBadge({ status }: { status: keyof typeof styles }) {
  return <span className={cn("inline-block rounded-md px-2 py-1 text-xs font-bold capitalize", styles[status])}>{status}</span>;
}
