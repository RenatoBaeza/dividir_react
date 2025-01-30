import * as React from "react"
import { cn } from "@/lib/utils"

const ItemCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
ItemCard.displayName = "ItemCard"

const ItemCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
))
ItemCardHeader.displayName = "ItemCardHeader"

const ItemCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
ItemCardTitle.displayName = "ItemCardTitle"

const ItemCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
ItemCardContent.displayName = "ItemCardContent"

const ItemCardPerson = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    selected?: boolean;
    onClick?: () => void;
  }
>(({ className, selected, children, onClick, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold transition-colors cursor-pointer",
      selected
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
))
ItemCardPerson.displayName = "ItemCardPerson"

export {
  ItemCard,
  ItemCardHeader,
  ItemCardTitle,
  ItemCardContent,
  ItemCardPerson,
}