import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const GlobalAlert = ({
  visible,
  title,
  message,
  type = 'success',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Batal',
  isConfirmation = false,
}) => {
  const isConfirmMode = isConfirmation || type === 'confirmation';

  const config = {
    success: { icon: 'checkmark-circle', color: '#1cc88a' },
    error: { icon: 'close-circle', color: '#b91c1c' },
    warning: { icon: 'warning', color: '#f59e0b' },
    info: { icon: 'information-circle', color: '#1a2a6c' },
    confirmation: { icon: 'help-circle-outline', color: '#1a2a6c' },
  };

  const theme = config[type] || config.success;

  const handleClose = () => {
    if (onClose) onClose();
    else if (!isConfirmMode && onConfirm) onConfirm();
  };

  const renderMessage = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text
            key={index}
            className="font-bold text-foreground"
          >
            {part.replace(/\*/g, '')}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <AlertDialog open={visible} onOpenChange={(o) => !o && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <View
            className="mb-2 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.color + '22' }}
          >
            <Ionicons name={theme.icon} size={44} color={theme.color} />
          </View>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <Text className="text-center text-sm leading-6 text-muted-foreground">
            {renderMessage(message)}
          </Text>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {isConfirmMode ? (
            <>
              <AlertDialogCancel onPress={handleClose}>
                <Text className="font-semibold text-muted-foreground">{cancelText}</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={onConfirm}>
                <Text className="font-semibold text-primary-foreground">{confirmText}</Text>
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onPress={handleClose} className="w-full">
              <Text className="font-semibold text-primary-foreground">{confirmText}</Text>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GlobalAlert;
