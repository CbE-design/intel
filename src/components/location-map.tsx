'use client';

import { useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, SignalHigh, History as HistoryIcon, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

/**
 * Safely formats a location timestamp. 
 * Handles Firestore Timestamps, standard Dates, and null values (e.g. while serverTimestamp is pending).
 */
function formatLocationTime(timestamp: any): string {
  if (!timestamp) return 'Syncing...';
  
  try {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleTimeString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString();
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleTimeString();
    }
  } catch (e) {
    console.error('Error formatting location time:', e);
  }
  
  return 'Intercepted';
}

/**
 * Internal component to handle map re-centering when locations change.
 * This ensures the map "follows" the subject as new pings come in.
 */
function MapHandler({ center }: { center: { lat: number, lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

export function LocationMap({ locations }: { locations: Location[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Use the latest location as the center, or a default South African coordinate (Johannesburg)
  const latestLocation = locations && locations.length > 0 ? locations[0] : null;
  
  const center = useMemo(() => {
    if (latestLocation) {
      return { lat: latestLocation.lat, lng: latestLocation.lng };
    }
    return { lat: -26.2041, lng: 28.0473 };
  }, [latestLocation]);

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-yellow-600 flex items-center gap-2 text-sm uppercase font-bold tracking-widest">
            <AlertTriangle className="h-4 w-4" /> Map Authentication Required
          </CardTitle>
          <CardDescription>
            GSM Triangulation Vector mapping is currently in standby mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 p-4 rounded-lg text-xs font-mono border border-yellow-500/20 leading-relaxed">
            <p className="text-muted-foreground mb-2">To activate the live vector lock, please ensure your API key is correctly configured in the environment settings.</p>
            <p className="text-yellow-600/80 font-bold">REQUIRED: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 shadow-lg bg-card">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm uppercase font-bold tracking-widest">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              GSM Triangulation Vector
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
              Handover intercept telemetry - Encrypted Tunnel Active
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-background text-[9px] font-mono border-primary/20">
              SENSITIVITY: HIGH
            </Badge>
            <Badge variant="outline" className="bg-background text-[9px] font-mono border-primary/20">
              NODES: {locations?.length || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div style={{ height: '500px', width: '100%' }} className="bg-muted/10 grayscale-[0.5]">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={center}
              defaultZoom={13}
              mapId="veritas_intel_map"
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              gestureHandling={'greedy'}
              colorScheme={'DARK'}
              disableDefaultUI={true}
            >
              <MapHandler center={center} />
              
              {locations?.map((location, index) => {
                const isLatest = index === 0;
                return (
                  <AdvancedMarker 
                    key={index} 
                    position={{ lat: location.lat, lng: location.lng }}
                    title={isLatest ? "Current Vector Lock" : `Historical Point - ${formatLocationTime(location.timestamp)}`}
                  >
                    <Pin 
                      background={isLatest ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      borderColor={isLatest ? 'white' : 'hsl(var(--border))'}
                      glyphColor={isLatest ? 'white' : 'hsl(var(--muted))'}
                      scale={isLatest ? 1.1 : 0.7}
                    />
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </div>

        {/* Investigative Map Overlay */}
        <div className="absolute bottom-4 left-4 z-10 space-y-2">
          <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-3 rounded shadow-2xl text-[9px] font-bold uppercase tracking-tighter space-y-2 w-44">
            <div className="flex items-center justify-between border-b border-primary/10 pb-1 mb-1">
              <span>Map Mode</span>
              <span className="text-primary">FORENSIC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)]" />
              <span>Target Vector</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground opacity-50" />
              <span>Historical Trail</span>
            </div>
          </div>
          
          {latestLocation && (
            <div className="bg-primary/90 backdrop-blur-md border border-primary/30 p-3 rounded shadow-2xl text-[9px] font-mono text-primary-foreground w-44">
              <div className="flex items-center gap-2 mb-1">
                <SignalHigh className="h-3 w-3" />
                <span>FIX: {latestLocation.lat.toFixed(6)}, {latestLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2 opacity-70">
                <HistoryIcon className="h-3 w-3" />
                <span>REC: {formatLocationTime(latestLocation.timestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}