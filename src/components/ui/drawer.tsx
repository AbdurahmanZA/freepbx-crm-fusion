import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// 1. Always render a persistent "tab" for opening drawer
//    - It will be visually smaller, fixed to left or bottom.
export const DrawerMiniTab = ({ onClick }: { onClick: () => void }) => (
  <button
    aria-label="Open Dialer"
    tabIndex={0}
    className="fixed z-50 bottom-6 left-4 flex items-center justify-center h-12 w-8 rounded-full bg-muted shadow-lg border border-muted-foreground/30 hover:bg-primary transition-all focus:outline-none"
    onClick={onClick}
    style={{
      // Only show when drawer is closed; must be controlled by parent!
      // (see usage below)
    }}
  >
    <div className="w-2 h-8 bg-primary rounded-full" />
  </button>
)

// --- Drawer Root, Trigger, Portal, Close ---
const Drawer = ({
  shouldScaleBackground = true,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    open={open}
    onOpenChange={onOpenChange}
    // disable default close on overlay click
    dismissible={false}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

// 2. Overlay: NEVER dismiss the drawer when overlay is clicked
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      // pointer-events-none keeps overlay from swallowing clicks
      "fixed inset-0 z-50 bg-transparent pointer-events-none",
      className
    )}
    // Remove any onClick that might dismiss; drawer only closes via close btn
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

// 3. DrawerContent (open drawer)
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        "sm:left-auto sm:right-0 sm:max-w-xl sm:w-[32rem]",
        className
      )}
      // prevent swipe-to-close, optional: remove if not needed
      // @ts-ignore
      swipeToClose={false}
      {...props}
    >
      {/* Drawer handle, thinner and smaller */}
      <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

// 4. Header, Footer, Title, Description...
const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
