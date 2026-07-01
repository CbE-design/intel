'use client';

import { useState } from 'react';
import { Link } from 'wouter';
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
import { ScrollArea, ScrollBar } from './ui/scroll-area';

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
    <Card className="border-2 border-primary rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)]">
      <CardHeader className="border-b p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="space-y-1 md:space-y-2">
            <CardTitle className="text-xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2 md:gap-3">
              <Fingerprint className="h-6 w-6 md:h-8 md:h-8" /> Registry
            </CardTitle>
            <CardDescription className="text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground">
              Node-Based Intelligence // Total: {subjects.length}
            </CardDescription>
          </div>
          <Link href="/subjects/new">
            <Button className="rounded-none h-12 md:h-14 w-full md:w-auto px-6 md:px-8 font-black uppercase text-xs tracking-widest">
              <PlusCircle className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:h-5" /> Enroll Subject
            </Button>
          </Link>
        </div>
        <div className="mt-4 md:mt-8">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="QUERY REGISTRY..."
              className="w-full h-12 md:h-14 rounded-none border-2 border-primary bg-background pl-10 md:pl-12 font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest placeholder:opacity-30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full overflow-x-auto">
          <Table className="min-w-[600px] md:min-w-full">
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b-2 border-primary hover:bg-transparent">
                <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest h-12 md:h-14 px-4 md:px-8">Subject</TableHead>
                <TableHead className="hidden sm:table-cell text-[9px] md:text-[10px] font-black uppercase tracking-widest h-12 md:h-14">Identifier</TableHead>
                <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest h-12 md:h-14">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-[9px] md:text-[10px] font-black uppercase tracking-widest h-12 md:h-14">Last Analysis</TableHead>
                <TableHead className="w-12 md:w-16 h-12 md:h-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 md:py-20 text-[9px] md:text-[10px] uppercase font-black tracking-widest opacity-30">
                    NO_RECORDS_FOUND
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => (
                  <TableRow key={subject.id} className="group hover:bg-muted/10 border-b">
                    <TableCell className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 rounded-none border-2 border-primary">
                          <AvatarImage src={subject.avatarUrl} alt={subject.name} data-ai-hint="person" />
                          <AvatarFallback className="rounded-none font-black">{subject.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <Link href={`/subjects/${subject.id}`} className="text-sm md:text-base font-black uppercase tracking-tighter hover:underline truncate max-w-[120px] md:max-w-none">
                            {subject.name}
                          </Link>
                          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">SUB_{subject.id.slice(-4)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono font-black text-xs md:text-sm tracking-widest">
                      {subject.idNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-none px-2 md:px-3 py-0.5 md:py-1 uppercase text-[8px] md:text-[9px] tracking-widest ${statusStyles[subject.status]}`}>
                        {subject.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[10px] md:text-xs font-mono opacity-60">
                      {formatDate(subject.lastCheck)}
                    </TableCell>
                    <TableCell className="pr-4 md:pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-none hover:bg-primary hover:text-primary-foreground">
                            <MoreHorizontal className="h-4 w-4 md:h-5 md:h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-2 border-primary font-black uppercase text-[9px] md:text-[10px] tracking-widest">
                          <DropdownMenuLabel className="opacity-40">Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/subjects/${subject.id}`} className="flex items-center gap-2">
                               <ShieldCheck className="h-3.5 w-3.5" /> Intelligence
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive font-black cursor-pointer"
                            onClick={() => handleDelete(subject.id, subject.name)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Purge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
