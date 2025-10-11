/**
 * MEDIUM PRIORITY FIX #69: Battery status hook
 * Monitor device battery level
 */

import { useState, useEffect } from 'react';

export interface BatteryStatus {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
  supported: boolean;
}

export function useBatteryStatus(): BatteryStatus {
  const [battery, setBattery] = useState<BatteryStatus>({
    charging: false,
    level: 1,
    chargingTime: 0,
    dischargingTime: Infinity,
    supported: false,
  });

  useEffect(() => {
    const navigatorWithBattery = navigator as any;
    
    if (!navigatorWithBattery.getBattery) {
      return;
    }

    navigatorWithBattery.getBattery().then((batteryManager: any) => {
      const updateBatteryStatus = () => {
        setBattery({
          charging: batteryManager.charging,
          level: batteryManager.level,
          chargingTime: batteryManager.chargingTime,
          dischargingTime: batteryManager.dischargingTime,
          supported: true,
        });
      };

      updateBatteryStatus();

      batteryManager.addEventListener('chargingchange', updateBatteryStatus);
      batteryManager.addEventListener('levelchange', updateBatteryStatus);
      batteryManager.addEventListener('chargingtimechange', updateBatteryStatus);
      batteryManager.addEventListener('dischargingtimechange', updateBatteryStatus);

      return () => {
        batteryManager.removeEventListener('chargingchange', updateBatteryStatus);
        batteryManager.removeEventListener('levelchange', updateBatteryStatus);
        batteryManager.removeEventListener('chargingtimechange', updateBatteryStatus);
        batteryManager.removeEventListener('dischargingtimechange', updateBatteryStatus);
      };
    });
  }, []);

  return battery;
}
