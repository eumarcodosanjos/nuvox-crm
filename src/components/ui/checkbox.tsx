import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Checkbox quadrado (raio 0), borda 2px tatame; marcado = limão. */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-5 shrink-0 rounded-none border-2 border-tatame bg-transparent transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao focus-visible:ring-offset-2 focus-visible:ring-offset-superficie",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-limao data-[state=checked]:bg-limao data-[state=checked]:text-podio",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-3.5" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
