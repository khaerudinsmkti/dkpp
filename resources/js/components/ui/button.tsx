import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[color,background-color,border-color,box-shadow] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[#7C3AED]/25 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#7C3AED] text-white border-0 shadow-xs hover:bg-[#5B21B6] active:bg-[#4C1D95]",
        primary:
          "bg-[#7C3AED] text-white border-0 shadow-xs hover:bg-[#5B21B6] active:bg-[#4C1D95]",
        secondary:
          "bg-transparent text-[#7C3AED] border border-[#7C3AED] hover:bg-[#F5F3FF] dark:hover:bg-[#7C3AED]/10",
        outline:
          "border border-[#E5E7EB] bg-white text-[#374151] shadow-xs hover:bg-[#F3F4F6] hover:text-[#111827] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700",
        ghost:
          "bg-transparent text-[#6B7280] border-0 hover:bg-[#F3F4F6] hover:text-[#111827] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        destructive:
          "bg-[#EF4444] text-white border-0 shadow-xs hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[#EF4444]/25",
        teal:
          "bg-[#0D9488] text-white border-0 shadow-xs hover:bg-[#0F766E] active:bg-[#115E59] focus-visible:ring-[#0D9488]/25",
        link: "text-[#7C3AED] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-md has-[>svg]:px-3",
        md: "h-10 px-4 py-2 text-sm rounded-md has-[>svg]:px-3",
        sm: "h-8 px-3 py-1.5 text-xs rounded-md has-[>svg]:px-2.5",
        lg: "h-12 px-6 py-2.5 text-base rounded-md has-[>svg]:px-4",
        icon: "size-10 rounded-md",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
