'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus, Trash2, AlertTriangle, Eye, Zap, CheckSquare, Loader2 } from 'lucide-react';
import { useCaseNotes } from '@/lib/use-api';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { CaseNote } from '@/lib/types';

type NoteTag = CaseNote['tag'];

const TAG_CONFIG: Record<NoteTag, { label: string; icon: typeof Eye; color: string }> = {
  Evidence:    { label: 'Evidence',    icon: CheckSquare, color: 'border-primary bg-primary text-primary-foreground' },
  Observation: { label: 'Observation', icon: Eye,         color: 'border-primary/50 bg-background text-foreground' },
  Action:      { label: 'Action',      icon: Zap,         color: 'border-primary bg-primary/80 text-primary-foreground' },
  Alert:       { label: 'Alert',       icon: AlertTriangle, color: 'border-destructive bg-destructive text-destructive-foreground' },
};

function formatNoteTime(ts: CaseNote['timestamp']): string {
  try {
    return format(new Date(ts as string), 'dd MMM yyyy, HH:mm');
  } catch { return 'Unknown time'; }
}

export function CaseDiaryPanel({ subjectId }: { subjectId: string }) {
  const { toast } = useToast();
  const { data: notes, isLoading, refresh } = useCaseNotes(subjectId);
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<NoteTag>('Observation');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.caseNotes.create(subjectId, { content: content.trim(), tag, analyst: 'Analyst' });
      setContent('');
      toast({ title: 'Entry logged', description: 'Case diary updated.' });
      refresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId);
    try {
      await api.caseNotes.delete(subjectId, noteId);
      toast({ title: 'Entry removed.' });
      refresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="rounded-none border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-primary" /> New Case Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TAG_CONFIG) as NoteTag[]).map((t) => {
              const { label, icon: Icon, color } = TAG_CONFIG[t];
              const active = tag === t;
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-none
                    ${active ? color : 'border-muted-foreground/30 bg-transparent text-muted-foreground hover:border-primary/50'}`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <Textarea
            placeholder="Log your observation, evidence note, or action item…"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="rounded-none border-2 resize-none min-h-[90px] text-xs"
          />

          <Button
            onClick={handleAdd}
            disabled={submitting || !content.trim()}
            className="rounded-none font-black uppercase tracking-widest text-xs h-9 w-full md:w-auto px-6"
          >
            {submitting ? <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Logging...</> : <><Plus className="h-3 w-3 mr-2" /> Log Entry</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none border-2 border-primary">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Investigation Diary
            {notes && notes.length > 0 && (
              <Badge variant="outline" className="text-[8px] rounded-none font-black h-5 ml-auto">
                {notes.length} {notes.length === 1 ? 'entry' : 'entries'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-6">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading diary...
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No entries yet</p>
              <p className="text-[9px] text-muted-foreground mt-1">Log your first observation above.</p>
            </div>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="divide-y divide-border">
                {notes.map((note) => {
                  const { icon: Icon, color } = TAG_CONFIG[note.tag] ?? TAG_CONFIG.Observation;
                  return (
                    <div key={note.id} className="p-4 md:p-5 flex gap-4 hover:bg-muted/5 transition-colors group">
                      <div className={`shrink-0 w-1 self-stretch rounded-full ${
                        note.tag === 'Alert' ? 'bg-destructive' :
                        note.tag === 'Evidence' ? 'bg-primary' :
                        note.tag === 'Action' ? 'bg-primary/60' :
                        'bg-muted-foreground/30'
                      }`} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[7px] rounded-none font-black h-4 px-1.5 flex items-center gap-1 ${
                              note.tag === 'Alert' ? 'border-destructive text-destructive' : 'border-primary text-primary'
                            }`}
                          >
                            <Icon className="h-2 w-2" />
                            {note.tag.toUpperCase()}
                          </Badge>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide">{note.analyst}</span>
                          <span className="text-[8px] text-muted-foreground ml-auto">{formatNoteTime(note.timestamp)}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === note.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
