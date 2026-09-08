"use client";;
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "@/lib/utils";

export function Textarea(
  {
    className,
    size = "default",
    unstyled = false,
    ref,
    ...props
  }
) {
  return (
    <span
      className={
        cn(!unstyled &&
          "relative inline-flex w-full rounded-xl border border-border/80 bg-background text-sm text-foreground transition-colors duration-150 has-focus-visible:border-primary has-disabled:opacity-50 dark:bg-black/30 dark:border-white/10", className) || undefined
      }
      data-size={size}
      data-slot="textarea-control">
      <FieldPrimitive.Control
        ref={ref}
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        id={props.id}
        name={props.name}
        render={(defaultProps) => (
          <textarea
            className={cn(
              "min-h-18 w-full rounded-[inherit] px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none bg-transparent resize-y",
              size === "sm" && "min-h-14 px-2.5 py-1.5 text-xs",
              size === "lg" && "min-h-24 px-3.5 py-2.5"
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, props)} />
        )} />
    </span>
  );
}

export { FieldPrimitive };
