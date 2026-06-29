import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

type SearchInputProps = React.ComponentProps<"input"> & {
  /** "lg" (default) for prominent search bars, "sm" for inline/header search. */
  inputSize?: "sm" | "lg"
  /** Class for the wrapper (use for width / margin). */
  wrapperClassName?: string
}

export function SearchInput({
  inputSize = "lg",
  wrapperClassName,
  className,
  ...props
}: SearchInputProps) {
  const sm = inputSize === "sm"
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          sm ? "left-3 size-4" : "left-4 size-5"
        )}
      />
      <input
        className={cn(
          "font-inter w-full border border-hairline bg-surface text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/20 dark:bg-surface-subtle",
          sm
            ? "h-10 rounded-lg pl-9 pr-3 text-[14px]"
            : "h-14 rounded-xl pl-12 pr-4 text-[16px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
          className
        )}
        {...props}
      />
    </div>
  )
}
