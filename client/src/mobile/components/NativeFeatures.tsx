import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Button } from '@/components/ui/button';

export function useNativeFeatures() {
  const [isNative, setIsNative] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<any>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());

    if (Capacitor.isNativePlatform()) {
      loadDeviceInfo();
      loadNetworkStatus();
      setupNetworkListener();
    }
  }, []);

  const loadDeviceInfo = async () => {
    const info = await Device.getInfo();
    setDeviceInfo(info);
  };

  const loadNetworkStatus = async () => {
    const status = await Network.getStatus();
    setNetworkStatus(status);
  };

  const setupNetworkListener = () => {
    Network.addListener('networkStatusChange', (status) => {
      setNetworkStatus(status);
    });
  };

  const takePicture = async () => {
    if (!isNative) {
      console.log('Camera only available on native platforms');
      return null;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      return image.webPath;
    } catch (e) {
      console.error('Camera error:', e);
      return null;
    }
  };

  const pickImage = async () => {
    if (!isNative) {
      console.log('Photo library only available on native platforms');
      return null;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      return image.webPath;
    } catch (e) {
      console.error('Photo picker error:', e);
      return null;
    }
  };

  const shareContent = async (title: string, text: string, url?: string) => {
    if (!isNative) {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        console.log('Share not available');
      }
      return;
    }

    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with'
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const vibrate = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) {
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (e) {
      console.error('Haptics error:', e);
    }
  };

  return {
    isNative,
    deviceInfo,
    networkStatus,
    takePicture,
    pickImage,
    shareContent,
    vibrate
  };
}

export function NativeFeaturesDemo() {
  const { 
    isNative, 
    deviceInfo, 
    networkStatus, 
    takePicture, 
    pickImage, 
    shareContent, 
    vibrate 
  } = useNativeFeatures();

  const [imagePath, setImagePath] = useState<string | null>(null);

  const handleTakePicture = async () => {
    const path = await takePicture();
    if (path) setImagePath(path);
  };

  const handlePickImage = async () => {
    const path = await pickImage();
    if (path) setImagePath(path);
  };

  const handleShare = async () => {
    await shareContent(
      'EchoVerse',
      'Check out EchoVerse - AI-powered website builder!',
      'https://echoverse.com'
    );
  };

  const handleVibrate = async () => {
    await vibrate(ImpactStyle.Medium);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Platform Info</h3>
        <p>Running on: {isNative ? 'Native App' : 'Web Browser'}</p>
        {deviceInfo && (
          <div className="text-sm space-y-1">
            <p>Platform: {deviceInfo.platform}</p>
            <p>OS: {deviceInfo.operatingSystem} {deviceInfo.osVersion}</p>
            <p>Model: {deviceInfo.model}</p>
          </div>
        )}
      </div>

      {networkStatus && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Network Status</h3>
          <p>Connected: {networkStatus.connected ? 'Yes' : 'No'}</p>
          <p>Type: {networkStatus.connectionType}</p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Native Features</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleTakePicture} disabled={!isNative}>
            Take Picture
          </Button>
          <Button onClick={handlePickImage} disabled={!isNative}>
            Pick Image
          </Button>
          <Button onClick={handleShare}>
            Share
          </Button>
          <Button onClick={handleVibrate}>
            Vibrate
          </Button>
        </div>
      </div>

      {imagePath && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Selected Image</h3>
          <img src={imagePath} alt="Selected" className="w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
