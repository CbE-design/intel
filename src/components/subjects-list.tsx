'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Search, Trash2, ShieldCheck, Fingerprint } from 'lucide-react';
import type { Subject } from '@/lib/types';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { Timestamp, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<Subject['status'], string> = {
  Clear: 'bg-black text-white dark:bg-white dark:text-black border-none font-black',
  Review: 'bg-muted text-muted-foreground border-primary/20',
  Pending: 'bg-transparent text-primary border-primary animate-pulse',
};

function formatDate(date: Subject['lastCheck']): string {
  if (!date) return 'Never';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'yyyy-MM-dd');
  }
  if (date instanceof Date) {
    return format(date, 'yyyy-MM-dd');
  }
  return date;
}

export function SubjectsList({ subjects }: { subjects: Subject[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (!firestore) return;
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const docRef = doc(firestore, 'subject_profiles', id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Subject Deleted",
        description: `${name} has been removed from the intelligence database.`,
      });
    }
  };

  return (
    <Card className="border-2 border-primary rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)]">
      <CardHeader className="border-b p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Fingerprint className="h-8 w-8" /> Investigative Registry
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground">
              Node-Based Intelligence Management // Total: {subjects.length}
            </CardDescription>
          </div>
          <Link href="/subjects/new">
            <Button className="rounded-none h-14 px-8 font-black uppercase text-xs tracking-widest">
              <PlusCircle className="mr-3 h-5 w-5" /> Enroll Subject
            </Button>
          </Link>
        </div>
        <div className="mt-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="QUERY REGISTRY (NAME / ID)..."
              className="w-full h-14 rounded-none border-2 border-primary bg-background pl-12 font-mono text-xs uppercase font-bold tracking-widest placeholder:opacity-30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2 border-primary hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 px-8">Identified Subject</TableHead>
              <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest h-14">National Identifier</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Threat Status</TableHead>
              <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest h-14">Last Analysis</TableHead>
              <TableHead className="w-16 h-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-[10px] uppercase font-black tracking-widest opacity-30">
                  NO_RECORDS_MATCH_QUERY
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id} className="group hover:bg-muted/10 border-b">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-none border-2 border-primary">
                        <AvatarImage src={subject.avatarUrl} alt={subject.name} data-ai-hint="person" />
                        <AvatarFallback className="rounded-none font-black">{subject.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link href={`/subjects/${subject.id}`} className="text-base font-black uppercase tracking-tighter hover:underline">
                          {subject.name}
                        </Link>
                        <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">SUB_NODE_{subject.id.slice(-6)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono font-black text-sm tracking-widest">
                    {subject.idNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-none px-3 py-1 uppercase text-[9px] tracking-widest ${statusStyles[subject.status]}`}>
                      {subject.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs font-mono opacity-60">
                    {formatDate(subject.lastCheck)}
                  </TableCell>
                  <TableCell className="pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-none hover:bg-primary hover:text-primary-foreground">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-2 border-primary font-black uppercase text-[10px] tracking-widest">
                        <DropdownMenuLabel className="opacity-40">Command Menu</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/subjects/${subject.id}`} className="flex items-center gap-2">
                             <ShieldCheck className="h-4 w-4" /> Open Intelligence
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive font-black cursor-pointer" 
                          onClick={() => handleDelete(subject.id, subject.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Purge Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
