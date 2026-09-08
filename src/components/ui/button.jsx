"use client";;
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-medium text-base outline-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 data-loading:select-none data-loading:text-transparent sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-7 rounded-md sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95 *:data-[slot=button-loading-indicator]:text-primary-foreground",
        destructive:
          "border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90 active:bg-destructive/95 *:data-[slot=button-loading-indicator]:text-white",
        "destructive-outline":
          "border-border/80 bg-card text-destructive-foreground shadow-xs hover:border-destructive/40 hover:bg-destructive/10 active:bg-destructive/15 *:data-[slot=button-loading-indicator]:text-foreground",
        ghost:
          "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 *:data-[slot=button-loading-indicator]:text-foreground",
        link: "border-transparent text-foreground underline-offset-4 hover:underline *:data-[slot=button-loading-indicator]:text-foreground",
        outline:
          "border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 *:data-[slot=button-loading-indicator]:text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 *:data-[slot=button-loading-indicator]:text-secondary-foreground",
      },
    },
  }
);


export function Button(
  {
    className,
    variant,
    size,
    render,
    children,
    loading = false,
    disabled: disabledProp,
    ...props
  }
) {
  const isDisabled = Boolean(loading || disabledProp);
  const typeValue =
    render ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner
            className="pointer-events-none absolute"
            data-slot="button-loading-indicator" />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps(defaultProps, props),
    render,
  });
}
