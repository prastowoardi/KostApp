import * as React from 'react';
import { Text, type TextProps } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<React.ElementRef<typeof Text>, TextProps & { asChild?: boolean }>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot.Text : Text;
    return (
      <Comp
        ref={ref}
        className={cn(
          'text-sm font-medium text-foreground leading-none',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };
