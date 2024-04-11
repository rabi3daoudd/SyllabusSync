// Import necessary modules and components
import * as React from "react" // Import React for component creation
import * as AccordionPrimitive from "@radix-ui/react-accordion" // Import AccordionPrimitive from @radix-ui/react-accordion
import { ChevronDown } from "lucide-react" // Import ChevronDown from lucide-react

import { cn } from "../../lib/utils" // Import cn utility for class name manipulation

// Define the Accordion component using the Root component from AccordionPrimitive
const Accordion = AccordionPrimitive.Root

// Define the AccordionItem component using the Item component from AccordionPrimitive
// This component is forwarded a ref and accepts all props that the Item component from AccordionPrimitive accepts
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)} // Use the cn utility to combine class names
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem" // Set the display name of the AccordionItem component

// Define the AccordionTrigger component using the Trigger component from AccordionPrimitive
// This component is forwarded a ref and accepts all props that the Trigger component from AccordionPrimitive accepts
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex"> // Use the Header component from AccordionPrimitive
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children} // Render the children inside the Trigger component
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" /> // Render the ChevronDown component
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
