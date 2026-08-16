import * as React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
      -1
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.4,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn('rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
