'use client';

import { useEffect, useState } from 'react';

// Network Information API interface (experimental)
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithExtensions extends Navigator {
  connection?: NetworkInformation;
  deviceMemory?: number;
}

interface IPInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
}

interface PerformanceInfo {
  memoryUsed?: number;
  memoryLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

declare global {
  interface Performance {
    memory?: {
      totalJSHeapSize: number;
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export default function WebStatsPage() {
  const [ipInfo, setIpInfo] = useState<IPInfo>({});
  const [loading, setLoading] = useState(true);
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo>({});

  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setIpInfo({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          org: data.org,
          timezone: data.timezone,
        });
      } catch (error) {
        console.error('Failed to fetch IP info:', error);
      } finally {
        setLoading(false);
      }
    };

    const updatePerformanceInfo = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const perfInfo: PerformanceInfo = {};

        if (performance.memory) {
          perfInfo.totalJSHeapSize = performance.memory.totalJSHeapSize;
          perfInfo.usedJSHeapSize = performance.memory.usedJSHeapSize;
          perfInfo.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
        }

        setPerformanceInfo(perfInfo);
      }
    };

    fetchIPInfo();
    updatePerformanceInfo();

    // Update performance info every 5 seconds
    const interval = setInterval(updatePerformanceInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageQuota = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch {
        return null;
      }
    }
    return null;
  };

  const [storageInfo, setStorageInfo] = useState<{
    quota?: number;
    usage?: number;
  } | null>(null);

  useEffect(() => {
    getStorageQuota().then(setStorageInfo);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Web Stats</h1>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Browser Stats</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                User Agent:{' '}
                {typeof navigator !== 'undefined'
                  ? navigator.userAgent.substring(0, 50) + '...'
                  : 'N/A'}
              </div>
              <div>
                Language:{' '}
                {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}
              </div>
              <div>
                Platform:{' '}
                {typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}
              </div>
              <div>
                Cookies:{' '}
                {typeof navigator !== 'undefined'
                  ? navigator.cookieEnabled
                    ? 'Enabled'
                    : 'Disabled'
                  : 'N/A'}
              </div>
              <div>
                Online:{' '}
                {typeof navigator !== 'undefined'
                  ? navigator.onLine
                    ? 'Yes'
                    : 'No'
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Device & Hardware</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                CPU Cores:{' '}
                {typeof navigator !== 'undefined' &&
                navigator.hardwareConcurrency
                  ? navigator.hardwareConcurrency
                  : 'N/A'}
              </div>
              <div>
                Device Memory:{' '}
                {typeof navigator !== 'undefined' &&
                (navigator as NavigatorWithExtensions).deviceMemory
                  ? `${(navigator as NavigatorWithExtensions).deviceMemory} GB`
                  : 'N/A'}
              </div>
              <div>
                Screen Resolution:{' '}
                {typeof window !== 'undefined'
                  ? `${window.screen.width}x${window.screen.height}`
                  : 'N/A'}
              </div>
              <div>
                Viewport:{' '}
                {typeof window !== 'undefined'
                  ? `${window.innerWidth}x${window.innerHeight}`
                  : 'N/A'}
              </div>
              <div>
                Color Depth:{' '}
                {typeof window !== 'undefined'
                  ? `${window.screen.colorDepth}-bit`
                  : 'N/A'}
              </div>
              <div>
                Pixel Ratio:{' '}
                {typeof window !== 'undefined'
                  ? window.devicePixelRatio
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Performance</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                JS Heap Used:{' '}
                {performanceInfo.usedJSHeapSize
                  ? formatBytes(performanceInfo.usedJSHeapSize)
                  : 'N/A'}
              </div>
              <div>
                JS Heap Total:{' '}
                {performanceInfo.totalJSHeapSize
                  ? formatBytes(performanceInfo.totalJSHeapSize)
                  : 'N/A'}
              </div>
              <div>
                JS Heap Limit:{' '}
                {performanceInfo.jsHeapSizeLimit
                  ? formatBytes(performanceInfo.jsHeapSizeLimit)
                  : 'N/A'}
              </div>
              <div>
                Page Load Time:{' '}
                {typeof window !== 'undefined' && performance.timing
                  ? `${performance.timing.loadEventEnd - performance.timing.navigationStart}ms`
                  : 'N/A'}
              </div>
              <div>
                DOM Content Loaded:{' '}
                {typeof window !== 'undefined' && performance.timing
                  ? `${performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart}ms`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Location & Time</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Current Time: {new Date().toLocaleTimeString()}</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
              <div>UTC Offset: {new Date().getTimezoneOffset() / -60}h</div>
              <div>
                Locale:{' '}
                {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Storage & Quota</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                Local Storage:{' '}
                {typeof localStorage !== 'undefined'
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Session Storage:{' '}
                {typeof sessionStorage !== 'undefined'
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                IndexedDB:{' '}
                {typeof indexedDB !== 'undefined'
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Storage Quota:{' '}
                {storageInfo?.quota ? formatBytes(storageInfo.quota) : 'N/A'}
              </div>
              <div>
                Storage Used:{' '}
                {storageInfo?.usage ? formatBytes(storageInfo.usage) : 'N/A'}
              </div>
              <div>
                Storage Available:{' '}
                {storageInfo?.quota && storageInfo?.usage
                  ? formatBytes(storageInfo.quota - storageInfo.usage)
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Network & IP Info</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                IP Address: {loading ? 'Loading...' : ipInfo.ip || 'N/A'}
              </div>
              <div>
                Location:{' '}
                {loading
                  ? 'Loading...'
                  : ipInfo.city && ipInfo.country
                    ? `${ipInfo.city}, ${ipInfo.country}`
                    : 'N/A'}
              </div>
              <div>ISP: {loading ? 'Loading...' : ipInfo.org || 'N/A'}</div>
              <div>
                Connection Type:{' '}
                {typeof navigator !== 'undefined' &&
                (navigator as NavigatorWithExtensions).connection
                  ? (navigator as NavigatorWithExtensions).connection
                      ?.effectiveType || 'Unknown'
                  : 'N/A'}
              </div>
              <div>
                Download Speed:{' '}
                {typeof navigator !== 'undefined' &&
                (navigator as NavigatorWithExtensions).connection
                  ? `${(navigator as NavigatorWithExtensions).connection?.downlink || 'Unknown'} Mbps`
                  : 'N/A'}
              </div>
              <div>
                RTT:{' '}
                {typeof navigator !== 'undefined' &&
                (navigator as NavigatorWithExtensions).connection
                  ? `${(navigator as NavigatorWithExtensions).connection?.rtt || 'Unknown'} ms`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Browser Features</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                WebGL:{' '}
                {typeof window !== 'undefined'
                  ? document.createElement('canvas').getContext('webgl')
                    ? 'Supported'
                    : 'Not Supported'
                  : 'N/A'}
              </div>
              <div>
                WebGL2:{' '}
                {typeof window !== 'undefined'
                  ? document.createElement('canvas').getContext('webgl2')
                    ? 'Supported'
                    : 'Not Supported'
                  : 'N/A'}
              </div>
              <div>
                WebAssembly:{' '}
                {typeof WebAssembly !== 'undefined'
                  ? 'Supported'
                  : 'Not Supported'}
              </div>
              <div>
                Service Worker:{' '}
                {typeof navigator !== 'undefined' &&
                'serviceWorker' in navigator
                  ? 'Supported'
                  : 'Not Supported'}
              </div>
              <div>
                Push API:{' '}
                {typeof window !== 'undefined' && 'PushManager' in window
                  ? 'Supported'
                  : 'Not Supported'}
              </div>
              <div>
                Web Share API:{' '}
                {typeof navigator !== 'undefined' && 'share' in navigator
                  ? 'Supported'
                  : 'Not Supported'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Security Context</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                HTTPS:{' '}
                {typeof window !== 'undefined'
                  ? window.location.protocol === 'https:'
                    ? 'Secure'
                    : 'Not Secure'
                  : 'N/A'}
              </div>
              <div>
                Secure Context:{' '}
                {typeof window !== 'undefined' && 'isSecureContext' in window
                  ? window.isSecureContext
                    ? 'Yes'
                    : 'No'
                  : 'N/A'}
              </div>
              <div>
                Cross-Origin Isolated:{' '}
                {typeof window !== 'undefined' &&
                'crossOriginIsolated' in window
                  ? window.crossOriginIsolated
                    ? 'Yes'
                    : 'No'
                  : 'N/A'}
              </div>
              <div>
                Do Not Track:{' '}
                {typeof navigator !== 'undefined' && navigator.doNotTrack
                  ? navigator.doNotTrack
                  : 'Not Set'}
              </div>
              <div>
                Permissions API:{' '}
                {typeof navigator !== 'undefined' && 'permissions' in navigator
                  ? 'Available'
                  : 'Not Available'}
              </div>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Media & Input</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                Geolocation:{' '}
                {typeof navigator !== 'undefined' && 'geolocation' in navigator
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Camera/Mic:{' '}
                {typeof navigator !== 'undefined' && 'mediaDevices' in navigator
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Gamepad API:{' '}
                {typeof navigator !== 'undefined' && 'getGamepads' in navigator
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Vibration API:{' '}
                {typeof navigator !== 'undefined' && 'vibrate' in navigator
                  ? 'Available'
                  : 'Not Available'}
              </div>
              <div>
                Touch Support:{' '}
                {typeof window !== 'undefined'
                  ? 'ontouchstart' in window
                    ? 'Yes'
                    : 'No'
                  : 'N/A'}
              </div>
              <div>
                Max Touch Points:{' '}
                {typeof navigator !== 'undefined' && navigator.maxTouchPoints
                  ? navigator.maxTouchPoints
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
