"use client";;
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

export function Input(
  {
    className,
    size = "default",
    unstyled = false,
    nativeInput = false,
    autoComplete = "off",
    style,
    ...props
  }
) {
  const inputClassName = cn(
    "h-9 w-full min-w-0 rounded-[inherit] px-3 font-sans text-sm leading-normal text-foreground placeholder:text-muted-foreground/60 outline-none bg-transparent sm:h-8",
    size === "sm" && "h-8 px-2.5 sm:h-7 text-xs",
    size === "lg" && "h-10 px-3.5 sm:h-9",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
    props.type === "file" &&
      "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm"
  );

  return (
    <span
      className={
        cn(!unstyled &&
          "relative inline-flex w-full items-center rounded-xl border border-border/80 bg-background text-sm text-foreground transition-colors duration-150 has-focus-visible:border-primary has-disabled:opacity-50 dark:bg-black/30 dark:border-white/10", className) || undefined
      }
      data-size={size}
      data-slot="input-control">
      {nativeInput ? (
        <input
          className={inputClassName}
          data-slot="input"
          autoComplete={autoComplete}
          size={typeof size === "number" ? size : undefined}
          style={typeof style === "function" ? undefined : style}
          {...props} />
      ) : (
        <InputPrimitive
          className={inputClassName}
          data-slot="input"
          autoComplete={autoComplete}
          size={typeof size === "number" ? size : undefined}
          style={style}
          {...props} />
      )}
    </span>
  );
}

export { InputPrimitive };
