import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, moderateScale, responsiveFont } from '../styles/theme';

export default function LoadingScreen({
    title = '',
    message = 'Memuat data...',
    icon = 'sync-outline',
    fullscreen = true,
    transparent = false,
}) {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in entrance
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start();

        // 1. Continuous smooth rotation
        const spinLoop = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // 2. Continuous pulse on the halo glow
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.18,
                    duration: 800,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        spinLoop.start();
        pulseLoop.start();

        return () => {
            spinLoop.stop();
            pulseLoop.stop();
        };
    }, [spinAnim, pulseAnim, fadeAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const haloOpacity = pulseAnim.interpolate({
        inputRange: [1, 1.18],
        outputRange: [0.6, 0.15],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                fullscreen && styles.fullscreen,
                transparent && styles.transparentBg,
                { opacity: fadeAnim },
            ]}
        >
            <View style={styles.card}>
                <View style={styles.animationWrap}>
                    {/* Pulsing Outer Halo Ring */}
                    <Animated.View
                        style={[
                            styles.haloRing,
                            {
                                transform: [{ scale: pulseAnim }],
                                opacity: haloOpacity,
                            },
                        ]}
                    />

                    {/* Rotating Dashed Spinner Ring */}
                    <Animated.View
                        style={[
                            styles.spinnerRing,
                            {
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    />

                    {/* Static Center Circle Icon */}
                    <View style={styles.centerCircle}>
                        <LinearGradient
                            colors={['#1e3a8a', '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.innerGradient}
                        >
                            <Ionicons name={icon} size={28} color="#ffffff" />
                        </LinearGradient>
                    </View>
                </View>

                {/* Typography */}
                {Boolean(title) && <Text style={styles.title}>{title}</Text>}
                <Text style={styles.message}>{message}</Text>

                {/* Subtle Progress Track */}
                <View style={styles.track}>
                    <Animated.View
                        style={[
                            styles.trackBar,
                            {
                                transform: [{ scaleX: pulseAnim }],
                            },
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20),
        backgroundColor: '#f8fafc',
    },
    fullscreen: {
        flex: 1,
        width: '100%',
        minHeight: 300,
    },
    transparentBg: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        paddingVertical: moderateScale(28),
        paddingHorizontal: moderateScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 360,
        width: '88%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
    },
    animationWrap: {
        width: 88,
        height: 88,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 16,
    },
    haloRing: {
        position: 'absolute',
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#dbeafe',
    },
    spinnerRing: {
        position: 'absolute',
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 3.5,
        borderColor: 'transparent',
        borderTopColor: colors.bluePrimary,
        borderRightColor: '#60a5fa',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    centerCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#2563eb',
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    innerGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: responsiveFont(16),
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 4,
    },
    message: {
        fontSize: responsiveFont(13),
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500',
    },
    track: {
        width: 64,
        height: 3,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 14,
    },
    trackBar: {
        flex: 1,
        backgroundColor: colors.bluePrimary,
        borderRadius: 2,
    },
});
