'use client';

import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Internal component to handle map re-centering when locations change
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
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Google Maps API key is not configured. Please set the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.</p>
        </CardContent>
      </Card>
    );
  }

  // Use the latest location as the center, or a default South African coordinate
  const center = locations && locations.length > 0 
    ? { lat: locations[0].lat, lng: locations[0].lng } 
    : { lat: -28.4793, lng: 24.6727 };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Device Location History</CardTitle>
            <CardDescription>Consented location data from the subject's mobile device (triangulated via GSM).</CardDescription>
        </CardHeader>
        <CardContent>
            <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden border bg-muted">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <Map
                        defaultCenter={center}
                        defaultZoom={12}
                        mapId="veritas_intel_map"
                        mapTypeControl={false}
                        streetViewControl={false}
                        fullscreenControl={false}
                        gestureHandling={'greedy'}
                    >
                        <MapHandler center={center} />
                        {locations?.map((location, index) => (
                            <AdvancedMarker key={index} position={{ lat: location.lat, lng: location.lng }}>
                                <Pin 
                                    background={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                                    borderColor={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                                    glyphColor={'white'}
                                    scale={index === 0 ? 1.2 : 0.8}
                                />
                            </AdvancedMarker>
                        ))}
                    </Map>
                </APIProvider>
            </div>
      </CardContent>
    </Card>
  );
}
