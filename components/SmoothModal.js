import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * SmoothModal
 * High performance, 60fps animated modal supporting bottom sheet and center dialog modes.
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is dismissed
 * @param {'bottom' | 'center'} type - Modal presentation style
 * @param {boolean} dismissOnBackdrop - Allow closing when tapping backdrop
 * @param {object} contentStyle - Custom style for the modal card/sheet
 * @param {boolean} showHandle - Show bottom sheet drag handle pill
 */
export default function SmoothModal({
    visible = false,
    onClose,
    type = 'bottom',
    dismissOnBackdrop = true,
    contentStyle,
    showHandle = type === 'bottom',
    children,
}) {
    const [showModal, setShowModal] = useState(visible);
    const isBottom = type === 'bottom';

    const backdropAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(isBottom ? SCREEN_HEIGHT * 0.6 : 24)).current;
    const scaleAnim = useRef(new Animated.Value(isBottom ? 1 : 0.88)).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            backdropAnim.setValue(0);

            if (isBottom) {
                translateAnim.setValue(SCREEN_HEIGHT * 0.55);
                Animated.parallel([
                    Animated.timing(backdropAnim, {
                        toValue: 1,
                        duration: 260,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateAnim, {
                        toValue: 0,
                        friction: 8,
                        tension: 65,
                        useNativeDriver: true,
                    }),
                ]).start();
            } else {
                translateAnim.setValue(20);
                scaleAnim.setValue(0.88);
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
                    Animated.timing(translateAnim, {
                        toValue: 0,
                        duration: 240,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        } else if (showModal) {
            if (isBottom) {
                Animated.parallel([
                    Animated.timing(backdropAnim, {
                        toValue: 0,
                        duration: 200,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateAnim, {
                        toValue: SCREEN_HEIGHT * 0.55,
                        duration: 220,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setShowModal(false);
                });
            } else {
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
                    Animated.timing(translateAnim, {
                        toValue: 14,
                        duration: 180,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setShowModal(false);
                });
            }
        }
    }, [visible, isBottom, backdropAnim, scaleAnim, translateAnim, showModal]);

    const handleBackdropPress = () => {
        if (dismissOnBackdrop && onClose) {
            onClose();
        }
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
            <View style={[styles.wrapper, isBottom ? styles.wrapperBottom : styles.wrapperCenter]}>
                {/* Smooth Animated Backdrop */}
                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
                </TouchableWithoutFeedback>

                {/* Smooth Animated Modal Content */}
                <Animated.View
                    style={[
                        isBottom ? styles.sheetContainer : styles.dialogContainer,
                        contentStyle,
                        {
                            transform: isBottom
                                ? [{ translateY: translateAnim }]
                                : [{ translateY: translateAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    {isBottom && showHandle && <View style={styles.handlePill} />}
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    wrapperBottom: {
        justifyContent: 'flex-end',
    },
    wrapperCenter: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    sheetContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        width: '100%',
        maxWidth: 680,
        alignSelf: 'center',
        overflow: 'hidden',
        elevation: 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
    },
    dialogContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 440,
        overflow: 'hidden',
        elevation: 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    handlePill: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#cbd5e1',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
});
