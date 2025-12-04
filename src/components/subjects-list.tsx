'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
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

const statusStyles: Record<Subject['status'], string> = {
  Clear: 'bg-green-500/20 text-green-400 border-green-500/30',
  Review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function SubjectsList({ subjects }: { subjects: Subject[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Profiles</CardTitle>
        <CardDescription>Manage and view background check subjects.</CardDescription>
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
              Create Subject
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
            {filteredSubjects.map((subject) => (
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
                  {subject.lastCheck instanceof Date
                    ? format(subject.lastCheck, 'yyyy-MM-dd')
                    : typeof subject.lastCheck === 'string'
                    ? subject.lastCheck
                    : subject.lastCheck?.toDate().toLocaleDateString()}
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
                        <Link href={`/subjects/${subject.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
