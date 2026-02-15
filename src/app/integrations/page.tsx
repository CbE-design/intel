'use client';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { ExternalLink, Database, ShieldCheck, Key, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntegrationsPage() {
  const firestore = useFirestore();
  const sourcesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'external_sources')) : null),
    [firestore]
  );
  const { data: sources, isLoading } = useCollection(sourcesQuery);

  return (
    <AppLayout>
      <PageHeader title="Intelligence Sources">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add API Source
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <Badge>Active</Badge>
              </div>
              <CardTitle className="mt-4">Google Maps API</CardTitle>
              <CardDescription>Real-time location and geocoding services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <Key className="h-3 w-3" />
                <span>••••••••••••••••</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-muted-foreground" />
                <Badge variant="outline">Simulated</Badge>
              </div>
              <CardTitle className="mt-4">SAPS Criminal Records</CardTitle>
              <CardDescription>Integration with national criminal database.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="https://www.mie.co.za/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Request API Key
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-muted-foreground" />
                <Badge variant="outline">Simulated</Badge>
              </div>
              <CardTitle className="mt-4">TransUnion Credit</CardTitle>
              <CardDescription>Financial risk and credit history verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="https://www.transunion.co.za/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Connect Bureau
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Integrations</CardTitle>
            <CardDescription>Manage your third-party intelligence data streams.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sources && sources.length > 0 ? (
              <div className="rounded-md border">
                {/* Table implementation for sources */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium text-muted-foreground">No custom sources configured</h3>
                <p className="mt-2 text-sm text-muted-foreground">Add external APIs to begin ingesting real-time intelligence.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
