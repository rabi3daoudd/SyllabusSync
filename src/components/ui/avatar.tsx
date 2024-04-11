// Import necessary modules and components
import * as React from "react" // Import React for component creation
import * as AvatarPrimitive from "@radix-ui/react-avatar" // Import AvatarPrimitive from @radix-ui/react-avatar

import { cn } from "src/lib/utils" // Import cn utility for class name manipulation

// Define the Avatar component using the Root component from AvatarPrimitive
// This component is forwarded a ref and accepts all props that the Root component from AvatarPrimitive accepts
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName // Set the display name of the Avatar component

// Define the AvatarImage component using the Image component from AvatarPrimitive
// This component is forwarded a ref and accepts all props that the Image component from AvatarPrimitive accepts
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName // Set the display name of the AvatarImage component

// Define the AvatarFallback component using the Fallback component from AvatarPrimitive

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
