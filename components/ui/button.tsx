import * as React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group flex flex-row items-center justify-center rounded-md border border-transparent web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 disabled:opacity-50 active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground web:hover:opacity-90',
        destructive: 'bg-destructive text-destructive-foreground web:hover:opacity-90',
        success: 'bg-success text-success-foreground web:hover:opacity-90',
        warning: 'bg-warning text-warning-foreground web:hover:opacity-90',
        outline: 'border-input bg-background text-foreground web:hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground web:hover:opacity-80',
        ghost: 'bg-transparent text-foreground web:hover:bg-accent',
        link: 'bg-transparent text-primary underline-offset-4 web:hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2 native:h-12 native:px-5',
        sm: 'h-9 px-3 native:h-10 native:px-4',
        lg: 'h-12 px-8 native:h-14 native:px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ asChild = false, className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Pressable : Pressable;
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' || variant === 'link' || variant === 'secondary' ? undefined : '#fff'} />
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
