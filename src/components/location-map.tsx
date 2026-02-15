'use client';

import { useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, SignalHigh, History as HistoryIcon } from 'lucide-react';

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
  // Use the latest location as the center, or a default South African coordinate (Johannesburg)
  const latestLocation = locations && locations.length > 0 ? locations[0] : null;
  
  const center = useMemo(() => {
    if (latestLocation) {
      return { lat: latestLocation.lat, lng: latestLocation.lng };
    }
    return { lat: -26.2041, lng: 28.0473 };
  }, [latestLocation]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Map Initialization Error</CardTitle>
          <CardDescription>Intelligence mapping requires an active Google Maps API key.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-lg text-sm font-mono border border-destructive/20">
            CRITICAL: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not defined.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 shadow-lg">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary animate-pulse" />
              GSM Triangulation Vector
            </CardTitle>
            <CardDescription>
              Consented location history retrieved via cellular handover intercept.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-background text-[10px] font-mono">
              SENSITIVITY: HIGH
            </Badge>
            <Badge variant="outline" className="bg-background text-[10px] font-mono">
              NODES: {locations?.length || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div style={{ height: '600px', width: '100%' }} className="bg-muted">
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={center}
              defaultZoom={13}
              mapId="veritas_intel_map"
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              gestureHandling={'greedy'}
              colorScheme={'DARK'}
            >
              <MapHandler center={center} />
              
              {locations?.map((location, index) => {
                const isLatest = index === 0;
                return (
                  <AdvancedMarker 
                    key={index} 
                    position={{ lat: location.lat, lng: location.lng }}
                    title={isLatest ? "Current Vector Lock" : `Historical Point - ${new Date(location.timestamp.seconds * 1000).toLocaleTimeString()}`}
                  >
                    <Pin 
                      background={isLatest ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      borderColor={isLatest ? 'white' : 'hsl(var(--border))'}
                      glyphColor={isLatest ? 'white' : 'hsl(var(--muted))'}
                      scale={isLatest ? 1.2 : 0.8}
                    />
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </div>

        {/* Investigative Map Overlay */}
        <div className="absolute bottom-6 left-6 z-10 space-y-2">
          <div className="bg-background/90 backdrop-blur-sm border p-3 rounded-lg shadow-xl text-[10px] font-bold uppercase tracking-tighter space-y-2 w-48">
            <div className="flex items-center justify-between border-b pb-1">
              <span>Map Mode</span>
              <span className="text-primary">INVESTIGATIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Active Target Lock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span>Historical Trail</span>
            </div>
          </div>
          
          {latestLocation && (
            <div className="bg-primary/90 backdrop-blur-sm border border-primary/20 p-3 rounded-lg shadow-xl text-[10px] font-mono text-primary-foreground w-48">
              <div className="flex items-center gap-2 mb-1">
                <SignalHigh className="h-3 w-3" />
                <span>FIX: {latestLocation.lat.toFixed(6)}, {latestLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <HistoryIcon className="h-3 w-3" />
                <span>REC: {new Date(latestLocation.timestamp.seconds * 1000).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
