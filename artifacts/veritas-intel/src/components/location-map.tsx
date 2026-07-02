'use client';

import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, SignalHigh, History as HistoryIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

function formatLocationTime(timestamp: any): string {
  if (!timestamp) return 'Syncing...';
  try {
    const date =
      timestamp instanceof Date
        ? timestamp
        : typeof timestamp === 'string' || typeof timestamp === 'number'
        ? new Date(timestamp)
        : null;
    if (date) return format(date, 'HH:mm:ss');
  } catch {
    // ignore
  }
  return 'Intercepted';
}

/** Re-centres the map whenever locations change. Must live inside <Map>. */
function MapHandler({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) map.panTo(center);
  }, [map, center]);
  return null;
}

/**
 * Custom pin rendered as plain HTML — no internal hooks, so it cannot
 * crash even if the Maps API fails partway through loading.
 */
function VectorPin({ isLatest }: { isLatest: boolean }) {
  return (
    <div
      style={{
        width: isLatest ? 16 : 10,
        height: isLatest ? 16 : 10,
        borderRadius: '50%',
        background: isLatest ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        border: `2px solid ${isLatest ? 'white' : 'hsl(var(--border))'}`,
        boxShadow: isLatest ? '0 0 8px hsl(var(--primary) / 0.7)' : 'none',
      }}
    />
  );
}

/** Fallback card shown when the map cannot load */
function MapErrorCard({ reason }: { reason: 'no-key' | 'billing' | 'unknown' }) {
  const messages: Record<typeof reason, { title: string; body: string }> = {
    'no-key': {
      title: 'Auth Required',
      body: 'GSM Triangulation is in standby. Configure VITE_GOOGLE_MAPS_API_KEY to activate.',
    },
    'billing': {
      title: 'Billing Not Enabled',
      body: 'Your Google Cloud project needs billing enabled before the Maps JavaScript API can load. Visit console.cloud.google.com → Billing to activate it — the free tier covers normal usage.',
    },
    'unknown': {
      title: 'Map Unavailable',
      body: 'GSM Vector could not load. Check the browser console for details.',
    },
  };

  const { title, body } = messages[reason];

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-yellow-600 flex items-center gap-2 text-xs md:text-sm uppercase font-bold tracking-widest">
          <AlertTriangle className="h-4 w-4" /> {title}
        </CardTitle>
        <CardDescription className="text-[10px] md:text-xs">
          GSM Triangulation is currently in standby mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <div className="bg-background/50 p-3 md:p-4 rounded-lg text-[10px] md:text-xs font-mono border border-yellow-500/20 leading-relaxed">
          <p className="text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Catches crashes from @vis.gl/react-google-maps internals (e.g. PinModern hook errors) */
class MapErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

export function LocationMap({ locations }: { locations: Location[] }) {
  const [mounted, setMounted] = useState(false);
  const [mapError, setMapError] = useState<'no-key' | 'billing' | 'unknown' | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for billing / auth errors emitted by the Maps JS API loader
  useEffect(() => {
    if (!apiKey) return;
    const handler = (e: ErrorEvent) => {
      const msg: string = e.message ?? '';
      if (msg.includes('BillingNotEnabled') || msg.includes('billing')) {
        setMapError('billing');
      } else if (msg.includes('InvalidKey') || msg.includes('ApiNotActivated')) {
        setMapError('unknown');
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [apiKey]);

  const latestLocation = locations && locations.length > 0 ? locations[0] : null;

  const center = useMemo(() => {
    if (latestLocation) return { lat: latestLocation.lat, lng: latestLocation.lng };
    return { lat: -26.2041, lng: 28.0473 }; // Johannesburg default
  }, [latestLocation]);

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return <MapErrorCard reason="no-key" />;
  }

  if (mapError) {
    return <MapErrorCard reason={mapError} />;
  }

  return (
    <Card className="overflow-hidden border-primary/20 shadow-lg bg-card rounded-none md:rounded-lg">
      <CardHeader className="bg-muted/30 p-3 md:p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-1.5 text-[10px] md:text-sm uppercase font-bold tracking-widest">
              <Radio className="h-3 w-3 md:h-4 md:w-4 text-primary animate-pulse" />
              GSM Vector
            </CardTitle>
            <CardDescription className="text-[8px] md:text-[10px] uppercase font-bold text-muted-foreground hidden sm:block">
              Encrypted Tunnel Active
            </CardDescription>
          </div>
          <div className="flex gap-1 md:gap-2">
            <Badge
              variant="outline"
              className="bg-background text-[7px] md:text-[9px] font-mono border-primary/20 h-5 px-1.5 md:px-2"
            >
              NODES: {locations?.length || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div
          style={{ height: '400px', width: '100%' }}
          className="md:h-[500px] bg-muted/10 grayscale-[0.5]"
        >
          <MapErrorBoundary onError={() => setMapError('unknown')}>
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={center}
                defaultZoom={13}
                mapId="veritas_intel_map"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                gestureHandling="greedy"
                colorScheme="DARK"
                disableDefaultUI={true}
              >
                <MapHandler center={center} />

                {mounted &&
                  locations?.map((location, index) => {
                    const isLatest = index === 0;
                    return (
                      <AdvancedMarker
                        key={index}
                        position={{ lat: location.lat, lng: location.lng }}
                        title={
                          isLatest
                            ? 'Current Vector Lock'
                            : `Historical Point — ${formatLocationTime(location.timestamp)}`
                        }
                      >
                        <VectorPin isLatest={isLatest} />
                      </AdvancedMarker>
                    );
                  })}
              </Map>
            </APIProvider>
          </MapErrorBoundary>
        </div>

        {/* Investigative overlay */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-10 space-y-2">
          <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-2 md:p-3 rounded shadow-2xl text-[8px] md:text-[9px] font-bold uppercase tracking-tighter space-y-1.5 w-32 md:w-44">
            <div className="flex items-center justify-between border-b border-primary/10 pb-0.5 mb-0.5">
              <span>Mode</span>
              <span className="text-primary">FORENSIC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground opacity-50" />
              <span>Trail</span>
            </div>
          </div>

          {mounted && latestLocation && (
            <div className="bg-primary/90 backdrop-blur-md border border-primary/30 p-2 md:p-3 rounded shadow-2xl text-[8px] md:text-[9px] font-mono text-primary-foreground w-32 md:w-44">
              <div className="flex items-center gap-1.5 mb-0.5">
                <SignalHigh className="h-2.5 w-2.5" />
                <span>
                  FIX: {latestLocation.lat.toFixed(4)}, {latestLocation.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 opacity-70">
                <HistoryIcon className="h-2.5 w-2.5" />
                <span>{formatLocationTime(latestLocation.timestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
