'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Search, Trash2 } from 'lucide-react';
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
  Clear: 'bg-green-500/20 text-green-400 border-green-500/30',
  Review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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
    <Card>
      <CardHeader>
        <CardTitle>Subject Profiles</CardTitle>
        <CardDescription>Comprehensive database of intelligence subjects.</CardDescription>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or ID..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/subjects/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">ID Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last Check</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subjects found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={subject.avatarUrl} alt={subject.name} data-ai-hint="person" />
                        <AvatarFallback>{subject.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Link href={`/subjects/${subject.id}`} className="font-medium hover:underline">
                        {subject.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono">{subject.idNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[subject.status]}>
                      {subject.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(subject.lastCheck)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/subjects/${subject.id}`}>View Intelligence</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Edit Profile</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => handleDelete(subject.id, subject.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Profile
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
