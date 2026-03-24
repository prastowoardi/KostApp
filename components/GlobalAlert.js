import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GlobalAlert = ({ visible, title, message, type, onClose }) => {
    const config = {
        success: { icon: 'checkmark-circle', color: '#2ecc71', btn: '#2ecc71' },
        error: { icon: 'close-circle', color: '#e74c3c', btn: '#e74c3c' },
        warning: { icon: 'warning', color: '#f1c40f', btn: '#f1c40f' },
    };

    const theme = config[type] || config.success;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.color + '20' }]}>
                        <Ionicons name={theme.icon} size={50} color={theme.color} />
                    </View>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: theme.btn }]} 
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Oke, Mengerti</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default GlobalAlert;