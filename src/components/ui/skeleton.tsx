import { cn } from "@/lib/utils";

/** Skeleton nas cores da marca: retângulo reto, pulsando entre borda e superfície. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-none bg-borda", className)} {...props} />;
}

export { Skeleton };
