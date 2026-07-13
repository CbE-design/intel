import { useEffect, useRef, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Wifi, Home, Users, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';


interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'subject' | 'ip' | 'address';
  details?: string;
}

const TYPE_COLORS: Record<string, string> = {
  subject: '#ef4444',
  ip: '#3b82f6',
  address: '#22c55e',
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [ipInput, setIpInput] = useState('');
  const [addrInput, setAddrInput] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: subjects } = useQuery<any[]>({
    queryKey: ['subjects'],
    queryFn: () => fetch(`/api/subjects`).then(r => r.json()),
  });

  // Init Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    import('leaflet').then(L => {
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });
      L.Marker.prototype.options.icon = defaultIcon;

      const map = L.map(mapRef.current!, { center: [-28.5, 25.5], zoom: 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leafletMapRef.current = map;
      setMapReady(true);
    });
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Sync markers to map
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      markers.forEach(mk => {
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${TYPE_COLORS[mk.type]};border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>`,
          className: '', iconSize: [14, 14], iconAnchor: [7, 7],
        });
        const m = L.marker([mk.lat, mk.lng], { icon })
          .addTo(leafletMapRef.current)
          .bindPopup(`<b>${mk.label}</b><br/><small>${mk.type.toUpperCase()}</small>${mk.details ? `<br/>${mk.details}` : ''}`);
        markersRef.current.push(m);
      });
    });
  }, [markers, mapReady]);

  // Plot all subjects with addresses
  useEffect(() => {
    if (!subjects?.length) return;
    const subjectMarkers: MapMarker[] = [];
    const geocodeSubject = async (s: any) => {
      if (!s.address) return;
      try {
        const r = await fetch(`/api/intelligence/address-geolocate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: s.address }),
        });
        if (r.ok) {
          const d = await r.json();
          subjectMarkers.push({ id: `subj-${s.id}`, lat: d.lat, lng: d.lng, label: s.name, type: 'subject', details: s.address });
        }
      } catch { /* skip */ }
    };
    Promise.allSettled(subjects.map(geocodeSubject)).then(() => {
      setMarkers(prev => {
        const nonSubject = prev.filter(m => m.type !== 'subject');
        return [...nonSubject, ...subjectMarkers];
      });
    });
  }, [subjects]);

  const geolocateIP = async () => {
    if (!ipInput.trim()) return;
    setLoading('ip'); setError(null);
    try {
      const r = await fetch(`/api/intelligence/ip-geolocate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Lookup failed'); return; }
      const mk: MapMarker = { id: `ip-${ipInput}`, lat: d.lat, lng: d.lng, label: d.ip, type: 'ip', details: `${d.city}, ${d.country} | ${d.isp}` };
      setMarkers(prev => [...prev.filter(m => m.id !== mk.id), mk]);
      leafletMapRef.current?.flyTo([d.lat, d.lng], 10);
      setIpInput('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const geocodeAddress = async () => {
    if (!addrInput.trim()) return;
    setLoading('addr'); setError(null);
    try {
      const r = await fetch(`/api/intelligence/address-geolocate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addrInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Address not found'); return; }
      const mk: MapMarker = { id: `addr-${addrInput}`, lat: d.lat, lng: d.lng, label: addrInput, type: 'address', details: d.display_name };
      setMarkers(prev => [...prev.filter(m => m.id !== mk.id), mk]);
      leafletMapRef.current?.flyTo([d.lat, d.lng], 14);
      setAddrInput('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const removeMarker = (id: string) => setMarkers(prev => prev.filter(m => m.id !== id));

  return (
    <AppLayout>
      <PageHeader title="Intelligence Map" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="flex flex-col gap-4 p-4 md:p-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-none border-2">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2"><Wifi className="size-4" /> IP Geolocation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={ipInput} onChange={e => setIpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && geolocateIP()} placeholder="8.8.8.8" className="rounded-none font-mono text-sm" />
                <Button onClick={geolocateIP} disabled={loading === 'ip'} className="rounded-none">
                  {loading === 'ip' ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none border-2">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2"><Home className="size-4" /> SA Address Pin</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={addrInput} onChange={e => setAddrInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && geocodeAddress()} placeholder="45 Rivonia Rd, Sandton" className="rounded-none text-sm" />
                <Button onClick={geocodeAddress} disabled={loading === 'addr'} className="rounded-none">
                  {loading === 'addr' ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && <div className="border-2 border-red-500 bg-red-950/30 text-red-400 px-4 py-2 text-sm font-mono">{error}</div>}

        <div className="flex gap-3 items-center text-xs uppercase tracking-widest font-black">
          <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-red-500 inline-block" /><Users className="size-3" /> Subjects ({markers.filter(m=>m.type==='subject').length})</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-blue-500 inline-block" /><Wifi className="size-3" /> IPs ({markers.filter(m=>m.type==='ip').length})</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-green-500 inline-block" /><MapPin className="size-3" /> Addresses ({markers.filter(m=>m.type==='address').length})</span>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div ref={mapRef} className="flex-1 min-h-[500px] border-2 border-primary" style={{ zIndex: 0 }} />
          {markers.length > 0 && (
            <Card className="rounded-none border-2 w-64 shrink-0 overflow-auto max-h-[600px]">
              <CardHeader className="pb-2 sticky top-0 bg-background"><CardTitle className="text-xs uppercase tracking-widest font-black">Pinned ({markers.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-2">
                {markers.map(mk => (
                  <div key={mk.id} className="flex items-start gap-2 border border-border p-2 text-xs">
                    <span className="size-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: TYPE_COLORS[mk.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-black truncate">{mk.label}</div>
                      <Badge variant="outline" className="text-[9px] rounded-none mt-0.5">{mk.type.toUpperCase()}</Badge>
                      {mk.details && <div className="text-muted-foreground truncate mt-1">{mk.details}</div>}
                    </div>
                    <button onClick={() => removeMarker(mk.id)} className="shrink-0 hover:text-red-400"><X className="size-3" /></button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
