import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botões da marca: cantos retos, altura mínima 44px.
 * - primario: limão, texto preto, Archivo 800 caixa-alta
 * - secundario: borda 2px tatame, fundo transparente
 * - fantasma: só texto (ex.: "Cancelar")
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao focus-visible:ring-offset-2 focus-visible:ring-offset-podio disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primario: "bg-limao text-podio font-titulo text-[13px] tracking-[0.04em] hover:bg-[#c4ef2d]",
        secundario:
          "border-2 border-tatame bg-transparent text-tatame font-titulo text-[13px] tracking-[0.04em] hover:bg-tatame hover:text-podio",
        fantasma: "bg-transparent text-apoio font-medium hover:text-tatame",
      },
      size: {
        default: "min-h-11 h-11 px-5",
        sm: "min-h-11 h-11 px-3",
        icone: "size-11",
      },
    },
    defaultVariants: { variant: "primario", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
