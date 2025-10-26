import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#DAD7CD] text-black hover:bg-[#DAD7CD]/90 dark:bg-[#DAD7CD] dark:text-black dark:hover:bg-[#DAD7CD]/90",
        secondary:
          "border-transparent bg-[#DAD7CD]/70 text-black hover:bg-[#DAD7CD]/60 dark:bg-[#DAD7CD]/70 dark:text-black dark:hover:bg-[#DAD7CD]/60",
        destructive:
          "border-transparent bg-[#DAD7CD] text-black hover:bg-[#DAD7CD]/90",
  outline: "text-[#DAD7CD] border-[#DAD7CD]/40 hover:bg-[#DAD7CD]/10 dark:text-[#DAD7CD] dark:border-[#DAD7CD]/40 dark:hover:bg-[#DAD7CD]/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
