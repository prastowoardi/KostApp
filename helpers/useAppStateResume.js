import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Custom hook to execute a callback when the app returns from background/inactive to active.
 * Useful for refreshing screens when reopened after being closed or minimized for a long time.
 * 
 * @param {Function} onActive - Callback triggered on active state transition
 */
export function useAppStateResume(onActive) {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                if (typeof onActive === 'function') {
                    onActive();
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [onActive]);
}

export default useAppStateResume;
