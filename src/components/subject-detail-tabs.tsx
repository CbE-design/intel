'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileSearch, MapPin, History, Radio } from 'lucide-react';
import { BackgroundCheckForm } from './background-check-form';
import { LocationMap } from './location-map';
import { ReportsHistory } from './reports-history';
import type { Location, Subject } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function SubjectDetailTabs({ subject }: { subject: Subject }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);

  const locationsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'subject_profiles', subject.id, 'location_data'), orderBy('timestamp', 'desc'))
        : null,
    [firestore, subject.id]
  );
  const { data: locations } = useCollection<Location>(locationsQuery);

  const reportsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'subject_profiles', subject.id, 'background_checks'),
            orderBy('timestamp', 'desc')
          )
        : null,
    [firestore, subject.id]
  );
  const { data: reports, isLoading: reportsLoading } = useCollection<any>(reportsQuery);

  const simulatePing = () => {
    if (!firestore) return;
    setSimulating(true);
    
    // Default to a central SA location if no points exist
    const base = locations && locations.length > 0 
      ? locations[0] 
      : { lat: -26.2041, lng: 28.0473 };

    // Random variation around the base point (approx 1-5km)
    const newPoint = {
      lat: base.lat + (Math.random() - 0.5) * 0.05,
      lng: base.lng + (Math.random() - 0.5) * 0.05,
      timestamp: serverTimestamp(),
      consent: true,
      deviceId: 'SIMULATOR-01'
    };

    const locationCol = collection(firestore, 'subject_profiles', subject.id, 'location_data');
    addDocumentNonBlocking(locationCol, newPoint);

    toast({
      title: "Device Ping Simulated",
      description: "New location coordinate added to history.",
    });

    setTimeout(() => setSimulating(false), 500);
  };

  if (!subject) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Subject intelligence profile not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="background-check">
          <FileSearch className="mr-2 h-4 w-4" /> New Check
        </TabsTrigger>
        <TabsTrigger value="reports">
          <History className="mr-2 h-4 w-4" /> Reports
        </TabsTrigger>
        <TabsTrigger value="location">
          <MapPin className="mr-2 h-4 w-4" /> Location
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Subject Identity Data</CardTitle>
            <CardDescription>Verified personal information and government identifiers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</p>
                  <p className="text-lg font-medium">{subject.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID Number</p>
                  <p className="text-lg font-mono">{subject.idNumber}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Contact</p>
                  <p className="text-lg">{subject.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verified Residence</p>
                  <p className="text-lg leading-relaxed">{subject.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="background-check" className="mt-4">
        <BackgroundCheckForm subject={subject} />
      </TabsContent>

      <TabsContent value="reports" className="mt-4">
        <ReportsHistory reports={reports || []} isLoading={reportsLoading} />
      </TabsContent>

      <TabsContent value="location" className="mt-4">
        <div className="flex flex-col gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Simulator Active</h3>
                <p className="text-xs text-muted-foreground">Force a location update from the subject's device.</p>
              </div>
              <Button size="sm" onClick={simulatePing} disabled={simulating}>
                <Radio className={`mr-2 h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
                Simulate Device Ping
              </Button>
            </CardContent>
          </Card>
          <LocationMap locations={locations || []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
