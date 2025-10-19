/**
 * MEDIUM PRIORITY FIX #69: Battery status hook
 * Monitor device battery level
 */
import { useState, useEffect } from 'react';
export function useBatteryStatus() {
    const [battery, setBattery] = useState({
        charging: false,
        level: 1,
        chargingTime: 0,
        dischargingTime: Infinity,
        supported: false,
    });
    useEffect(() => {
        const navigatorWithBattery = navigator;
        if (!navigatorWithBattery.getBattery) {
            return;
        }
        navigatorWithBattery.getBattery().then((batteryManager) => {
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
