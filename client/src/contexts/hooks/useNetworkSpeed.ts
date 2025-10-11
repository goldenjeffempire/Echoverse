/**
 * MEDIUM PRIORITY FIX #68: Network speed detection
 * Detect connection quality
 */

import { useState, useEffect } from 'react';

export type NetworkSpeed = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
export type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g';

export interface NetworkInfo {
  downlink?: number;
  effectiveType?: EffectiveType;
  rtt?: number;
  saveData?: boolean;
  speed: NetworkSpeed;
}

export function useNetworkSpeed(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    speed: 'unknown',
  });

  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
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
