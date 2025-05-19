import { useState } from 'react';
import { 
  Users, 
  CalendarDays, 
  ListChecks, 
  Book, 
  Presentation,
  CheckSquare,
  Clock,
  User,
  BarChart3,
  GraduationCap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock data for classroom
interface Student {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  grades: {
    assignments: number;
    tests: number;
    participation: number;
    average: number;
  };
}

interface ClassSession {
  date: Date;
  topic: string;
  attendance: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  students: Student[];
  sessions: ClassSession[];
}

// Mock data
const mockClassroom: Classroom = {
  id: 'class1',
  name: 'Biology 101',
  subject: 'Science',
  schedule: 'Mon, Wed, Fri 10:00 AM - 11:30 AM',
  students: [
    {
      id: 'student1',
      name: 'Alex Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      email: 'alex.j@school.edu',
      attendance: {
        present: 15,
        absent: 1,
        late: 2,
        excused: 0
      },
      grades: {
        assignments: 88,
        tests: 92,
        participation: 85,
        average: 89
      }
    },
    {
      id: 'student2',
      name: 'Samantha Lee',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      email: 'samantha.l@school.edu',
      attendance: {
        present: 18,
        absent: 0,
        late: 0,
        excused: 0
      },
      grades: {
        assignments: 95,
        tests: 97,
        participation: 92,
        average: 95
      }
    },
    {
      id: 'student3',
      name: 'Jason Kim',
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
      email: 'jason.k@school.edu',
      attendance: {
        present: 16,
        absent: 2,
        late: 0,
        excused: 0
      },
      grades: {
        assignments: 85,
        tests: 78,
        participation: 90,
        average: 84
      }
    },
    {
      id: 'student4',
      name: 'Emily Martinez',
      avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
      email: 'emily.m@school.edu',
      attendance: {
        present: 14,
        absent: 0,
        late: 3,
        excused: 1
      },
      grades: {
        assignments: 91,
        tests: 89,
        participation: 95,
        average: 91
      }
    },
    {
      id: 'student5',
      name: 'Michael Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/78.jpg',
      email: 'michael.w@school.edu',
      attendance: {
        present: 12,
        absent: 3,
        late: 2,
        excused: 1
      },
      grades: {
        assignments: 75,
        tests: 80,
        participation: 72,
        average: 76
      }
    }
  ],
  sessions: [
    {
      date: new Date('2025-05-01'),
      topic: 'Introduction to Cell Biology',
      attendance: [
        { studentId: 'student1', status: 'present' },
        { studentId: 'student2', status: 'present' },
        { studentId: 'student3', status: 'present' },
        { studentId: 'student4', status: 'present' },
        { studentId: 'student5', status: 'present' }
      ]
    },
    {
      date: new Date('2025-05-03'),
      topic: 'Cell Structure and Function',
      attendance: [
        { studentId: 'student1', status: 'present' },
        { studentId: 'student2', status: 'present' },
        { studentId: 'student3', status: 'absent' },
        { studentId: 'student4', status: 'present' },
        { studentId: 'student5', status: 'present' }
      ]
    },
    {
      date: new Date('2025-05-05'),
      topic: 'Cell Membrane and Transport',
      attendance: [
        { studentId: 'student1', status: 'late' },
        { studentId: 'student2', status: 'present' },
        { studentId: 'student3', status: 'present' },
        { studentId: 'student4', status: 'late' },
        { studentId: 'student5', status: 'absent' }
      ]
    }
  ]
};

export default function ClassroomManager() {
  const [classroom, setClassroom] = useState<Classroom>(mockClassroom);
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter students based on search
  const filteredStudents = classroom.students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate attendance rate
  const calculateAttendanceRate = (student: Student): number => {
    const total = student.attendance.present + student.attendance.absent + student.attendance.late + student.attendance.excused;
    return total === 0 ? 0 : (student.attendance.present / total) * 100;
  };
  
  // Get attendance status badge
  const getAttendanceStatusBadge = (status: 'present' | 'absent' | 'late' | 'excused') => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Absent</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Excused</Badge>;
    }
  };
  
  // Get grade color
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          <p className="text-neutral-500 dark:text-neutral-400">{classroom.subject} • {classroom.schedule}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Presentation className="h-4 w-4" />
            <span className="hidden md:inline">Start Class</span>
          </Button>
          <Button className="gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden md:inline">Take Attendance</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neutral-500" />
              <span className="text-2xl font-bold">{classroom.students.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Class Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-neutral-500" />
              <span className="text-2xl font-bold">{classroom.sessions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neutral-500" />
              <span className="text-2xl font-bold">
                {Math.round(classroom.students.reduce((sum, student) => sum + student.grades.average, 0) / classroom.students.length)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>
        
        <div className="my-4">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <TabsContent value="students" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>Manage your classroom students</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Avg. Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {student.avatar ? (
                              <AvatarImage src={student.avatar} alt={student.name} />
                            ) : (
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{Math.round(calculateAttendanceRate(student))}%</span>
                          <Badge variant="outline">
                            {student.attendance.present} / {student.attendance.present + student.attendance.absent + student.attendance.late + student.attendance.excused}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getGradeColor(student.grades.average)}>
                          {student.grades.average}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Track student attendance for each class session</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classroom.sessions.map(session => {
                    const presentCount = session.attendance.filter(a => a.status === 'present').length;
                    const absentCount = session.attendance.filter(a => a.status === 'absent').length;
                    const lateCount = session.attendance.filter(a => a.status === 'late').length;
                    
                    return (
                      <TableRow key={session.date.toString()}>
                        <TableCell>
                          <div className="font-medium">{formatDate(session.date)}</div>
                        </TableCell>
                        <TableCell>{session.topic}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                            {presentCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                            {absentCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            {lateCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grades" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Grade Book</CardTitle>
              <CardDescription>Track student performance and grades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Participation</TableHead>
                    <TableHead>Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {student.avatar ? (
                              <AvatarImage src={student.avatar} alt={student.name} />
                            ) : (
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getGradeColor(student.grades.assignments)}>
                          {student.grades.assignments}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getGradeColor(student.grades.tests)}>
                          {student.grades.tests}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getGradeColor(student.grades.participation)}>
                          {student.grades.participation}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getGradeColor(student.grades.average)}`}>
                          {student.grades.average}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}