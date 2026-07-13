import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Plus, Trash2, CheckCheck, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/use-toast';

interface WatchlistAlert {
  id: string;
  subject_id: string | null;
  subject_name: string;
  alert_type: 'Manual' | 'Auto' | 'Breach' | 'Location' | 'Status';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  is_read: boolean;
  triggered_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: 'text-green-400 border-green-400',
  Medium: 'text-yellow-400 border-yellow-400',
  High: 'text-orange-400 border-orange-400',
  Critical: 'text-red-400 border-red-400',
};

export default function WatchlistPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject_name: '', alert_type: 'Manual', severity: 'Medium', message: '' });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: alerts = [], isLoading } = useQuery<WatchlistAlert[]>({
    queryKey: ['watchlist'],
    queryFn: () => fetch(`/api/watchlist`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => fetch(`/api/watchlist/${id}/read`, { method: 'PATCH' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => fetch(`/api/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); toast({ title: 'Alert removed' }); },
  });

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    await Promise.all(unread.map(a => markRead.mutateAsync(a.id)));
    toast({ title: `Marked ${unread.length} alerts as read` });
  };

  const createAlert = useMutation({
    mutationFn: () => fetch(`/api/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      setShowNew(false);
      setForm({ subject_name: '', alert_type: 'Manual', severity: 'Medium', message: '' });
      toast({ title: 'Alert created' });
    },
  });

  const filtered = filter === 'unread' ? alerts.filter(a => !a.is_read) : alerts;
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AppLayout>
      <PageHeader title="Watchlist & Alerts">
        <Badge variant="outline" className="rounded-none border-primary font-black">{unreadCount} UNREAD</Badge>
      </PageHeader>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" className="rounded-none text-xs uppercase font-black" onClick={() => setFilter('all')}>All ({alerts.length})</Button>
            <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" className="rounded-none text-xs uppercase font-black" onClick={() => setFilter('unread')}>Unread ({unreadCount})</Button>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && <Button variant="outline" size="sm" className="rounded-none text-xs uppercase font-black" onClick={markAllRead}><CheckCheck className="size-3 mr-1" />Mark All Read</Button>}
            <Button size="sm" className="rounded-none text-xs uppercase font-black" onClick={() => setShowNew(s => !s)}><Plus className="size-3 mr-1" />New Alert</Button>
          </div>
        </div>

        {showNew && (
          <Card className="rounded-none border-2 border-primary">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2"><Bell className="size-4" />Create Alert</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Subject name" value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} className="rounded-none" />
                <Select value={form.alert_type} onValueChange={v => setForm(f => ({ ...f, alert_type: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Manual','Auto','Breach','Location','Status'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low','Medium','High','Critical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Alert message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="rounded-none" />
              </div>
              <div className="flex gap-2">
                <Button className="rounded-none text-xs uppercase font-black" onClick={() => createAlert.mutate()} disabled={!form.subject_name || !form.message || createAlert.isPending}>
                  {createAlert.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null} Create
                </Button>
                <Button variant="outline" className="rounded-none text-xs uppercase font-black" onClick={() => setShowNew(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-border text-center py-16 text-muted-foreground">
            <BellOff className="size-8 mx-auto mb-3 opacity-30" />
            <p className="uppercase text-xs font-black tracking-widest">No alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(alert => (
              <Card key={alert.id} className={`rounded-none border-2 transition-all ${alert.is_read ? 'opacity-60 border-border' : 'border-primary'}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-1">
                    {alert.severity === 'Critical' ? <AlertTriangle className="size-5 text-red-400" /> :
                     alert.severity === 'High' ? <AlertTriangle className="size-5 text-orange-400" /> :
                     <Shield className="size-5 text-yellow-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-black text-sm">{alert.subject_name}</span>
                      <Badge variant="outline" className={`rounded-none text-[10px] ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</Badge>
                      <Badge variant="outline" className="rounded-none text-[10px]">{alert.alert_type}</Badge>
                      {!alert.is_read && <Badge className="rounded-none text-[10px] bg-primary">NEW</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">{new Date(alert.triggered_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!alert.is_read && (
                      <Button variant="ghost" size="icon" className="size-7 rounded-none" onClick={() => markRead.mutate(alert.id)}><CheckCheck className="size-3" /></Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-7 rounded-none hover:text-red-400" onClick={() => deleteAlert.mutate(alert.id)}><Trash2 className="size-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
