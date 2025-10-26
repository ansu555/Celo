import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      {
        variants: {
          variant: {
            default: "bg-[#DAD7CD] text-black hover:bg-[#DAD7CD]/90 dark:bg-[#DAD7CD] dark:text-black dark:hover:bg-[#DAD7CD]/90",
        destructive:
          "bg-[#DAD7CD] text-black hover:bg-[#DAD7CD]/90 dark:bg-[#DAD7CD] dark:text-black dark:hover:bg-[#DAD7CD]/90",
        outline:
          "border border-[#DAD7CD]/40 bg-white text-[#DAD7CD] hover:bg-[#DAD7CD]/10 hover:text-[#DAD7CD] dark:border-[#DAD7CD]/20 dark:bg-transparent dark:text-[#DAD7CD] dark:hover:border-[#DAD7CD]/40 dark:hover:bg-[#DAD7CD]/10 dark:hover:text-[#DAD7CD]",
        secondary:
          "bg-[#DAD7CD]/20 text-[#DAD7CD] hover:bg-[#DAD7CD]/30 dark:bg-[#DAD7CD]/20 dark:text-[#DAD7CD] dark:hover:bg-[#DAD7CD]/30",
  ghost: "text-[#DAD7CD] hover:bg-[#DAD7CD]/10 hover:text-[#DAD7CD] dark:text-[#DAD7CD] dark:hover:bg-[#DAD7CD]/10 dark:hover:text-[#DAD7CD]",
  link: "text-[#DAD7CD] underline-offset-4 hover:underline dark:text-[#DAD7CD] dark:hover:text-[#DAD7CD]/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
