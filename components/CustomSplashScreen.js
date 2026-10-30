import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function CustomSplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const slideTextAnim = useRef(new Animated.Value(15)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const containerFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // 1. Entrance animation (Logo & Text)
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(slideTextAnim, {
                toValue: 0,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: false,
            }),
        ]).start();

        // 2. Continuous subtle pulsing for the halo ring
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.start();

        // 3. Smooth exit transition after minimum display time
        const timer = setTimeout(() => {
            Animated.timing(containerFade, {
                toValue: 0,
                duration: 350,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start(() => {
                pulseLoop.stop();
                if (onFinish) onFinish();
            });
        }, 1300);

        return () => {
            clearTimeout(timer);
            pulseLoop.stop();
        };
    }, [fadeAnim, scaleAnim, slideTextAnim, progressAnim, pulseAnim, containerFade, onFinish]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <Animated.View style={[styles.container, { opacity: containerFade }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={["#090d16", "#0f172a", "#1e293b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Glowing Ambient Background Lights */}
            <View style={styles.ambientGlowTop} />
            <View style={styles.ambientGlowBottom} />

            {/* Center Content */}
            <View style={styles.centerWrap}>
                {/* Pulsing Halo Ring */}
                <Animated.View
                    style={[
                        styles.haloRing,
                        {
                            transform: [{ scale: pulseAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                />

                {/* Logo Glass Container */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <Image
                        source={require("../assets/serrata.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Brand Title & Tagline */}
                <Animated.View
                    style={[
                        styles.textWrap,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideTextAnim }],
                        },
                    ]}
                >
                    <Text style={styles.brandTitle}>Serrata Kost</Text>
                    <View style={styles.badgePill}>
                        <Text style={styles.badgeText}>Modern Living & Kost Management</Text>
                    </View>
                </Animated.View>

                {/* Sleek Progress Indicator */}
                <Animated.View style={[styles.progressTrack, { opacity: fadeAnim }]}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </Animated.View>
            </View>

            {/* Bottom Footer Info */}
            <Animated.View style={[styles.footerWrap, { opacity: fadeAnim }]}>
                <Text style={styles.footerTagline}>Kenyamanan Tempat Tinggal Anda</Text>
                <Text style={styles.footerVersion}>v1.0.0</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backgroundColor: "#0f172a",
    },
    ambientGlowTop: {
        position: "absolute",
        top: -80,
        left: -60,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: "rgba(37, 99, 235, 0.18)",
    },
    ambientGlowBottom: {
        position: "absolute",
        bottom: -100,
        right: -80,
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: "rgba(13, 148, 136, 0.14)",
    },
    centerWrap: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    haloRing: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(56, 189, 248, 0.12)",
        borderWidth: 1.5,
        borderColor: "rgba(56, 189, 248, 0.25)",
        top: 0,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 36,
        backgroundColor: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#38bdf8",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.9)",
        marginBottom: 24,
        overflow: "hidden",
    },
    logoImage: {
        width: "82%",
        height: "82%",
    },
    textWrap: {
        alignItems: "center",
        marginTop: 6,
    },
    brandTitle: {
        fontSize: 30,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: 1.2,
        textAlign: "center",
    },
    badgePill: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 8,
    },
    badgeText: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.4,
    },
    progressTrack: {
        width: 120,
        height: 4,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 2,
        marginTop: 36,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#38bdf8",
        borderRadius: 2,
    },
    footerWrap: {
        position: "absolute",
        bottom: 40,
        alignItems: "center",
    },
    footerTagline: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    footerVersion: {
        color: "#475569",
        fontSize: 11,
        fontWeight: "600",
        marginTop: 4,
    },
});
