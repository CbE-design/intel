'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, SignalHigh, History as HistoryIcon, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * Safely formats a location timestamp. 
 * Handles Firestore Timestamps, standard Dates, and null values (e.g. while serverTimestamp is pending).
 */
function formatLocationTime(timestamp: any): string {
  if (!timestamp) return 'Syncing...';
  
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : timestamp instanceof Date 
        ? timestamp 
        : typeof timestamp.seconds === 'number' 
          ? new Date(timestamp.seconds * 1000) 
          : null;
    
    if (date) {
      return format(date, 'HH:mm:ss');
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
  const [mounted, setMounted] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-yellow-600 flex items-center gap-2 text-xs md:text-sm uppercase font-bold tracking-widest">
            <AlertTriangle className="h-4 w-4" /> Auth Required
          </CardTitle>
          <CardDescription className="text-[10px] md:text-xs">
            GSM Triangulation is currently in standby mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="bg-background/50 p-3 md:p-4 rounded-lg text-[10px] md:text-xs font-mono border border-yellow-500/20 leading-relaxed">
            <p className="text-muted-foreground mb-2">To activate the live vector lock, please configure your API key.</p>
            <p className="text-yellow-600/80 font-bold truncate">REQUIRED: GOOGLE_MAPS_API_KEY</p>
          </div>
        </CardContent>
      </Card>
    );
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
            <Badge variant="outline" className="bg-background text-[7px] md:text-[9px] font-mono border-primary/20 h-5 px-1.5 md:px-2">
              NODES: {locations?.length || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div style={{ height: '400px', width: '100%' }} className="md:h-[500px] bg-muted/10 grayscale-[0.5]">
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
              
              {mounted && locations?.map((location, index) => {
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
                      scale={isLatest ? 1.0 : 0.6}
                    />
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </div>

        {/* Investigative Map Overlay - Mobile Optimized */}
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
                <span>FIX: {latestLocation.lat.toFixed(4)}, {latestLocation.lng.toFixed(4)}</span>
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
