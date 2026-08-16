import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as SelectPrimitive from '@rn-primitives/select';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>, 'children'> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 flex-row items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
      className
    )}
    {...props}
  >
    {children}
    <Ionicons name="chevron-down" size={16} className="ml-2 text-muted-foreground" color="hsl(var(--muted-foreground))" />
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Overlay className="absolute inset-0 z-50 bg-black/40" />
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 w-full min-w-[220px] rounded-lg border border-border bg-popover p-1 shadow-md',
        position === 'popper' && 'max-h-64',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'flex h-10 flex-row items-center justify-between rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="text-sm text-popover-foreground" />
    <SelectPrimitive.ItemIndicator>
      <Ionicons name="checkmark" size={16} color="hsl(var(--foreground))" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue };
