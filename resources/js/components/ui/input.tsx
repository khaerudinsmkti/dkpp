import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1E1B4B] placeholder:text-[#9CA3AF] transition-[border-color,box-shadow,background-color] outline-none",
        "hover:border-[#A78BFA]",
        "focus-visible:border-[#7C3AED] focus-visible:ring-[3px] focus-visible:ring-[#7C3AED]/25",
        "disabled:border-[#E5E7EB] disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-75",
        "aria-invalid:border-[#EF4444] aria-invalid:bg-[#FEF2F2] aria-invalid:ring-[3px] aria-invalid:ring-[#EF4444]/20",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-purple-400 dark:focus-visible:border-purple-400 dark:disabled:bg-slate-800 dark:aria-invalid:bg-rose-950/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
