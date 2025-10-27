'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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

  const center = locations.length > 0 ? locations[0] : { lat: -28.4793, lng: 24.6727 };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Device Location History</CardTitle>
            <CardDescription>Consented location data from the subject's mobile device.</CardDescription>
        </CardHeader>
        <CardContent>
            <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <Map
                    defaultCenter={center}
                    defaultZoom={8}
                    mapId="veritas_intel_map"
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={false}
                    >
                    {locations.map((location, index) => (
                        <AdvancedMarker key={index} position={location}>
                            <Pin 
                                background={'hsl(var(--primary))'}
                                borderColor={'hsl(var(--primary))'}
                                glyphColor={'hsl(var(--primary-foreground))'}
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
