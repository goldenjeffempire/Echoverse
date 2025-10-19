/**
 * MEDIUM PRIORITY FIX #70: Geolocation hook
 * Get user location with permissions
 */
import { useState, useEffect } from 'react';
export function useGeolocation(options = {}) {
    const { enableHighAccuracy = false, timeout = 5000, maximumAge = 0, watch = false, } = options;
    const [state, setState] = useState({
        position: null,
        error: null,
        loading: true,
    });
    useEffect(() => {
        if (!navigator.geolocation) {
            setState({
                position: null,
                error: {
                    code: 2,
                    message: 'Geolocation is not supported',
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                },
                loading: false,
            });
            return;
        }
        const onSuccess = (position) => {
            setState({
                position: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                },
                error: null,
                loading: false,
            });
        };
        const onError = (error) => {
            setState({
                position: null,
                error,
                loading: false,
            });
        };
        const geoOptions = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        };
        let watchId;
        if (watch) {
            watchId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
        }
        else {
            navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
        }
        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [enableHighAccuracy, timeout, maximumAge, watch]);
    return state;
}
