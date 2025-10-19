/**
 * MEDIUM PRIORITY FIX #68: Network speed detection
 * Detect connection quality
 */
import { useState, useEffect } from 'react';
export function useNetworkSpeed() {
    const [networkInfo, setNetworkInfo] = useState({
        speed: 'unknown',
    });
    useEffect(() => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) {
            return;
        }
        const updateNetworkInfo = () => {
            setNetworkInfo({
                downlink: connection.downlink,
                effectiveType: connection.effectiveType,
                rtt: connection.rtt,
                saveData: connection.saveData,
                speed: connection.effectiveType || 'unknown',
            });
        };
        updateNetworkInfo();
        connection.addEventListener('change', updateNetworkInfo);
        return () => {
            connection.removeEventListener('change', updateNetworkInfo);
        };
    }, []);
    return networkInfo;
}
