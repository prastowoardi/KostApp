import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, responsiveFont } from '../styles/theme';

export default function LoadingSpinner({
    size = 36,
    color = colors.bluePrimary,
    label = '',
    style,
}) {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const spinLoop = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        spinLoop.start();
        return () => spinLoop.stop();
    }, [spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const borderWidth = Math.max(2.5, Math.round(size * 0.08));

    return (
        <View style={[styles.container, style]}>
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <View
                    style={[
                        styles.track,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth,
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.spinner,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth,
                            borderTopColor: color,
                            borderRightColor: color,
                            transform: [{ rotate: spin }],
                        },
                    ]}
                />
            </View>
            {Boolean(label) && <Text style={styles.label}>{label}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    track: {
        position: 'absolute',
        borderColor: '#e2e8f0',
    },
    spinner: {
        position: 'absolute',
        borderColor: 'transparent',
    },
    label: {
        marginTop: 8,
        fontSize: responsiveFont(12),
        color: '#64748b',
        fontWeight: '500',
    },
});
