// client/src/types/displayData.ts

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  // ... add relevant props
}

export interface Metric {
  name: string;
  value: number;
  // ...
}

export interface Course {
  id: number;
  name: string;
  // ...
}

export interface StudySession {
  id: number;
  participants: Participant[];
  // ...
}

export interface Participant {
  id: number;
  name: string;
}

export interface Assignment {
  id: number;
  status: 'completed' | 'pending' | string;
  dueDate: Date;
  // ...
}

export interface Project {
  id: number;
  name: string;
  // ...
}

export interface Activity {
  id: number;
  description: string;
  // ...
}

export interface DisplayData {
  tasks?: Task[];
  metrics?: Metric[];
  courses?: Course[];
  studySessions?: StudySession[];
  assignments?: Assignment[];
  projects?: Project[];
  activities?: Activity[];
}
