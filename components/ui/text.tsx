import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: 'text-base',
      title: 'text-2xl font-bold',
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-semibold',
      h3: 'text-lg font-semibold',
      subtitle: 'text-lg font-medium',
      muted: 'text-sm text-muted-foreground',
      label: 'text-sm font-medium',
      small: 'text-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type TextProps = RNTextProps &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ asChild = false, className, variant, ...props }, ref) => {
    const Comp = asChild ? Slot.Text : RNText;
    return <Comp ref={ref} className={cn(textVariants({ variant }), className)} {...props} />;
  }
);
Text.displayName = 'Text';

export { Text, textVariants };
export type { TextProps };
