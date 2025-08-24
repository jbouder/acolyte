'use client';

import { useEffect, useState } from 'react';

// Network Information API interface (experimental)
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface IPInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
}

export default function WebStatsPage() {
  const [ipInfo, setIpInfo] = useState<IPInfo>({});
  const [loading, setLoading] = useState(true);

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

    fetchIPInfo();
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
                (navigator as NavigatorWithConnection).connection
                  ? (navigator as NavigatorWithConnection).connection
                      ?.effectiveType || 'Unknown'
                  : 'N/A'}
              </div>
              <div>
                Download Speed:{' '}
                {typeof navigator !== 'undefined' &&
                (navigator as NavigatorWithConnection).connection
                  ? `${(navigator as NavigatorWithConnection).connection?.downlink || 'Unknown'} Mbps`
                  : 'N/A'}
              </div>
              <div>
                Online Status:{' '}
                {typeof navigator !== 'undefined'
                  ? navigator.onLine
                    ? 'Online'
                    : 'Offline'
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
