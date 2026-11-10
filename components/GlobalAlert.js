import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
    Animated,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const GlobalAlert = ({ 
    visible, 
    title, 
    message, 
    type = 'success', 
    onClose, 
    onConfirm, 
    confirmText = "OK", 
    cancelText = "Batal",
    isConfirmation = false
}) => {
    const isConfirmMode = isConfirmation || type === 'confirmation';

    const config = {
        success: { 
            icon: 'checkmark-circle', 
            color: '#10b981', 
            bg: '#ecfdf5',
            btn: '#10b981',
            haptic: Haptics.NotificationFeedbackType.Success
        },
        error: { 
            icon: 'close-circle', 
            color: '#ef4444', 
            bg: '#fef2f2',
            btn: '#ef4444',
            haptic: Haptics.NotificationFeedbackType.Error
        },
        warning: { 
            icon: 'warning', 
            color: '#f59e0b', 
            bg: '#fffbeb',
            btn: '#f59e0b',
            haptic: Haptics.NotificationFeedbackType.Warning
        },
        info: { 
            icon: 'information-circle', 
            color: '#2563eb', 
            bg: '#eff6ff',
            btn: '#2563eb',
            haptic: Haptics.ImpactFeedbackStyle.Light
        },
        confirmation: { 
            icon: 'help-circle-outline', 
            color: '#1e3a8a', 
            bg: '#eff6ff',
            btn: '#1e3a8a',
            haptic: Haptics.ImpactFeedbackStyle.Medium
        },
    };

    const theme = config[type] || config.success;

    const [showModal, setShowModal] = useState(visible);
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.86)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const iconScaleAnim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            backdropAnim.setValue(0);
            scaleAnim.setValue(0.86);
            translateYAnim.setValue(20);
            iconScaleAnim.setValue(0.6);

            // Trigger gentle haptic feedback
            try {
                if (theme.haptic) {
                    if (type === 'confirmation' || type === 'info') {
                        Haptics.impactAsync(theme.haptic).catch(() => {});
                    } else {
                        Haptics.notificationAsync(theme.haptic).catch(() => {});
                    }
                }
            } catch {
                // Ignore fallback
            }

            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 240,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 70,
                    useNativeDriver: true,
                }),
                Animated.timing(translateYAnim, {
                    toValue: 0,
                    duration: 240,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(80),
                    Animated.spring(iconScaleAnim, {
                        toValue: 1,
                        friction: 4.5,
                        tension: 85,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        } else if (showModal) {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 180,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(translateYAnim, {
                    toValue: 12,
                    duration: 180,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowModal(false);
            });
        }
    }, [visible, backdropAnim, iconScaleAnim, scaleAnim, showModal, theme.haptic, translateYAnim, type]);

    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*.*?\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return (
                    <Text key={index} style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {part.replace(/\*/g, '')}
                    </Text>
                );
            }
            return part;
        });
    };

    if (!showModal && !visible) {
        return null;
    }

    return (
        <Modal
            transparent
            visible={showModal}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={!isConfirmMode ? onClose : null}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.alertBox,
                        {
                            transform: [
                                { translateY: translateYAnim },
                                { scale: scaleAnim },
                            ],
                        },
                    ]}
                >
                    {/* Icon Section with pop animation */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor: theme.bg,
                                transform: [{ scale: iconScaleAnim }],
                            },
                        ]}
                    >
                        <Ionicons name={theme.icon} size={46} color={theme.color} />
                    </Animated.View>
                    
                    {/* Text Section */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{renderMessage(message)}</Text>

                    {/* Button Section */}
                    {isConfirmMode ? (
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelBtn]} 
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: theme.btn, flex: 1.5 }]} 
                                onPress={onConfirm}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.buttonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: theme.btn }]} 
                            onPress={onConfirm || onClose}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.buttonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    alertBox: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#ffffff',
        borderRadius: 26,
        paddingHorizontal: 26,
        paddingTop: 28,
        paddingBottom: 24,
        alignItems: 'center',
        elevation: 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
    },
    iconContainer: {
        width: 82,
        height: 82,
        borderRadius: 41,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    buttonGroup: { 
        flexDirection: 'row', 
        width: '100%', 
        gap: 12,
    },
    cancelBtn: { 
        flex: 1, 
        backgroundColor: '#f1f5f9',
    },
    cancelText: { 
        color: '#64748b', 
        fontWeight: '600', 
        fontSize: 15,
    },
});

export default GlobalAlert;
