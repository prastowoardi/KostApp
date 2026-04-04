import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GlobalAlert = ({ 
    visible, 
    title, 
    message, 
    type = 'success', 
    onClose, 
    onConfirm, 
    confirmText = "Oke", 
    cancelText = "Batal",
    isConfirmation = false
}) => {
    
    const config = {
        success: { icon: 'checkmark-circle', color: '#2ecc71', btn: '#2ecc71' },
        error: { icon: 'close-circle', color: '#e74c3c', btn: '#e74c3c' },
        warning: { icon: 'warning', color: '#f39c12', btn: '#f39c12' },
        info: { icon: 'information-circle', color: '#3498db', btn: '#3498db' },
        confirmation: { icon: 'help-circle-outline', color: '#3498db', btn: '#3498db' },
    };

    const theme = config[type] || config.success;

    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*.*?\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return (
                    <Text key={index} style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {part.replace(/\*/g, '')}
                    </Text>
                );
            }
            return part;
        });
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    {/* Icon Section */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.color + '20' }]}>
                        <Ionicons name={theme.icon} size={50} color={theme.color} />
                    </View>
                    
                    {/* Text Section */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{renderMessage(message)}</Text>

                    {/* Button Section */}
                    {isConfirmation ? (
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelBtn]} 
                                onPress={onClose}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: theme.btn, flex: 1.5 }]} 
                                onPress={onConfirm}
                            >
                                <Text style={styles.buttonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: theme.btn }]} 
                            onPress={onConfirm || onClose}
                        >
                            <Text style={styles.buttonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30
    },
    alertBox: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10
    },
    message: {
        fontSize: 15,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    buttonGroup: { 
        flexDirection: 'row', 
        width: '100%', 
        gap: 12 
    },
    cancelBtn: { 
        flex: 1, 
        backgroundColor: '#f1f2f6' 
    },
    cancelText: { 
        color: '#7f8c8d', 
        fontWeight: 'bold', 
        fontSize: 16 
    }
});

export default GlobalAlert;