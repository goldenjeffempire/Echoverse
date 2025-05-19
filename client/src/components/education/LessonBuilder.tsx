import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen,
  FileText,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Lightbulb,
  Monitor,
  Book,
  Video,
  Link,
  Clock,
  Clock as TimerIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Save,
  PlayCircle,
  Film,
  Image,
  FileQuestion,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Types
interface Standard {
  id: string;
  code: string;
  description: string;
  subject: string;
  gradeLevel: string[];
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  overview: string;
  objectives: string[];
  duration: number; // minutes
  standards: string[]; // IDs of standards
  materials: string[];
  sections: LessonSection[];
  assessments: Assessment[];
  status: 'draft' | 'published' | 'archived';
  aiGenerated: boolean;
  aiPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  collaborators?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  tags?: string[];
}

interface LessonSection {
  id: string;
  title: string;
  type: 'introduction' | 'instruction' | 'activity' | 'discussion' | 'assessment' | 'conclusion';
  content: string;
  duration: number; // minutes
  materials?: string[];
  resources?: Resource[];
}

interface Resource {
  id: string;
  type: 'document' | 'video' | 'image' | 'link' | 'quiz';
  title: string;
  url?: string;
  fileType?: string;
  content?: string;
  aiGenerated?: boolean;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'essay' | 'project' | 'observation';
  instructions: string;
  questions?: Question[];
  rubric?: {
    criteria: {
      name: string;
      description: string;
      points: number;
    }[];
  };
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: {
    id: string;
    text: string;
    correct: boolean;
  }[];
  correctAnswer?: string;
  points: number;
}

// Mock Data
const mockStandards: Standard[] = [
  {
    id: 'std1',
    code: 'SCI.BIO.1.2',
    description: 'Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations of organisms in an ecosystem.',
    subject: 'Science',
    gradeLevel: ['9th Grade', '10th Grade']
  },
  {
    id: 'std2',
    code: 'SCI.BIO.3.1',
    description: 'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins which carry out the essential functions of life.',
    subject: 'Science',
    gradeLevel: ['9th Grade', '10th Grade']
  },
  {
    id: 'std3',
    code: 'MATH.ALG.2.3',
    description: 'Solve quadratic equations by inspection, taking square roots, completing the square, the quadratic formula and factoring.',
    subject: 'Mathematics',
    gradeLevel: ['9th Grade', '10th Grade']
  },
  {
    id: 'std4',
    code: 'ELA.9.4',
    description: 'Determine the meaning of words and phrases as they are used in the text, including figurative and connotative meanings.',
    subject: 'English',
    gradeLevel: ['9th Grade']
  }
];

const mockLessonPlans: LessonPlan[] = [
  {
    id: 'lesson1',
    title: 'Cellular Respiration and Photosynthesis',
    subject: 'Biology',
    gradeLevel: '9th Grade',
    overview: 'This lesson explores the complementary processes of photosynthesis and cellular respiration, demonstrating energy flow in living systems.',
    objectives: [
      'Explain the process of photosynthesis and its importance',
      'Describe the stages of cellular respiration',
      'Compare and contrast photosynthesis and cellular respiration',
      'Analyze the relationship between these processes in ecosystems'
    ],
    duration: 90,
    standards: ['std1', 'std2'],
    materials: [
      'Microscopes',
      'Plant leaves (spinach or elodea)',
      'Bromothymol blue indicator',
      'Test tubes',
      'Handouts'
    ],
    sections: [
      {
        id: 'section1',
        title: 'Introduction to Energy in Biological Systems',
        type: 'introduction',
        content: 'Begin by discussing energy needs of living organisms and how energy is transferred in biological systems. Ask students to brainstorm how plants and animals obtain energy.',
        duration: 10
      },
      {
        id: 'section2',
        title: 'Photosynthesis Process',
        type: 'instruction',
        content: 'Explain the process of photosynthesis using diagrams and models. Cover the light-dependent and light-independent reactions, emphasizing the inputs and outputs of the process.',
        duration: 20,
        resources: [
          {
            id: 'resource1',
            type: 'image',
            title: 'Photosynthesis Diagram',
            url: 'https://example.com/photosynthesis-diagram.jpg',
            fileType: 'jpg'
          },
          {
            id: 'resource2',
            type: 'document',
            title: 'Photosynthesis Handout',
            url: 'https://example.com/photosynthesis-handout.pdf',
            fileType: 'pdf'
          }
        ]
      },
      {
        id: 'section3',
        title: 'Cellular Respiration Process',
        type: 'instruction',
        content: 'Cover the stages of cellular respiration: glycolysis, the citric acid cycle, and the electron transport chain. Emphasize ATP production and the role of oxygen.',
        duration: 20,
        resources: [
          {
            id: 'resource3',
            type: 'video',
            title: 'Cellular Respiration Animation',
            url: 'https://example.com/cellular-respiration-video',
            fileType: 'mp4'
          }
        ]
      },
      {
        id: 'section4',
        title: 'Investigation: Carbon Dioxide and Photosynthesis',
        type: 'activity',
        content: 'Students will conduct an experiment using bromothymol blue to demonstrate how plants consume carbon dioxide during photosynthesis. They will set up test tubes with elodea plants and observe color changes.',
        duration: 25,
        materials: [
          'Bromothymol blue solution',
          'Elodea plants',
          'Test tubes and stoppers',
          'Light source'
        ]
      },
      {
        id: 'section5',
        title: 'Discussion: Energy Flow in Ecosystems',
        type: 'discussion',
        content: 'Lead a discussion about how energy flows through ecosystems via these processes. Discuss the relationship between producers and consumers, and how carbon cycles through living systems.',
        duration: 10
      },
      {
        id: 'section6',
        title: 'Conclusion and Reflection',
        type: 'conclusion',
        content: 'Summarize the key points about photosynthesis and cellular respiration. Ask students to reflect on how these processes are essential for life on Earth.',
        duration: 5
      }
    ],
    assessments: [
      {
        id: 'assessment1',
        title: 'Photosynthesis and Cellular Respiration Quiz',
        type: 'quiz',
        instructions: 'Answer the following questions about photosynthesis and cellular respiration.',
        questions: [
          {
            id: 'q1',
            text: 'Which process converts light energy into chemical energy?',
            type: 'multiple_choice',
            options: [
              { id: 'opt1', text: 'Cellular respiration', correct: false },
              { id: 'opt2', text: 'Photosynthesis', correct: true },
              { id: 'opt3', text: 'Fermentation', correct: false },
              { id: 'opt4', text: 'Digestion', correct: false }
            ],
            points: 1
          },
          {
            id: 'q2',
            text: 'Cellular respiration occurs in which organelle?',
            type: 'multiple_choice',
            options: [
              { id: 'opt5', text: 'Nucleus', correct: false },
              { id: 'opt6', text: 'Ribosome', correct: false },
              { id: 'opt7', text: 'Mitochondria', correct: true },
              { id: 'opt8', text: 'Golgi apparatus', correct: false }
            ],
            points: 1
          },
          {
            id: 'q3',
            text: 'Explain how photosynthesis and cellular respiration are complementary processes.',
            type: 'essay',
            points: 3
          }
        ]
      }
    ],
    status: 'published',
    aiGenerated: false,
    createdAt: new Date('2025-04-15T10:30:00'),
    updatedAt: new Date('2025-05-02T14:22:00'),
    author: {
      id: 'teacher1',
      name: 'Dr. Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    tags: ['photosynthesis', 'cellular respiration', 'energy', 'plants']
  },
  {
    id: 'lesson2',
    title: 'Introduction to Quadratic Equations',
    subject: 'Mathematics',
    gradeLevel: '9th Grade',
    overview: 'This lesson introduces students to quadratic equations, their properties, and how to solve them using various methods.',
    objectives: [
      'Identify quadratic equations and their standard form',
      'Solve quadratic equations using factoring',
      'Apply the quadratic formula',
      'Interpret the solutions in real-world contexts'
    ],
    duration: 60,
    standards: ['std3'],
    materials: [
      'Graphing calculators',
      'Whiteboards and markers',
      'Quadratic equation worksheet',
      'Graph paper'
    ],
    sections: [
      {
        id: 'section1',
        title: 'Introduction to Quadratic Equations',
        type: 'introduction',
        content: 'Introduce the concept of quadratic equations and their standard form ax² + bx + c = 0. Show examples and discuss where these equations appear in real life.',
        duration: 10
      },
      {
        id: 'section2',
        title: 'Solving by Factoring',
        type: 'instruction',
        content: 'Teach students how to solve quadratic equations by factoring. Demonstrate the zero product property and work through several examples together.',
        duration: 15
      },
      {
        id: 'section3',
        title: 'Using the Quadratic Formula',
        type: 'instruction',
        content: 'Introduce the quadratic formula as a method to solve any quadratic equation. Derive the formula and practice applying it to various equations.',
        duration: 15
      },
      {
        id: 'section4',
        title: 'Practice Problems',
        type: 'activity',
        content: 'Students work in pairs to solve a set of quadratic equations using both factoring and the quadratic formula. Encourage them to check their answers.',
        duration: 15
      },
      {
        id: 'section5',
        title: 'Conclusion and Exit Ticket',
        type: 'conclusion',
        content: 'Summarize the methods for solving quadratic equations. Have students complete an exit ticket with one problem to solve.',
        duration: 5
      }
    ],
    assessments: [
      {
        id: 'assessment1',
        title: 'Quadratic Equations Quiz',
        type: 'quiz',
        instructions: 'Solve the following quadratic equations using the most appropriate method.',
        questions: [
          {
            id: 'q1',
            text: 'Solve x² - 5x + 6 = 0',
            type: 'short_answer',
            correctAnswer: 'x = 2, x = 3',
            points: 2
          },
          {
            id: 'q2',
            text: 'Solve 2x² - x - 6 = 0',
            type: 'short_answer',
            correctAnswer: 'x = -1.5, x = 2',
            points: 2
          }
        ]
      }
    ],
    status: 'draft',
    aiGenerated: true,
    aiPrompt: 'Create a 9th grade math lesson on quadratic equations with examples using factoring and the quadratic formula',
    createdAt: new Date('2025-05-10T09:15:00'),
    updatedAt: new Date('2025-05-10T09:15:00'),
    author: {
      id: 'teacher2',
      name: 'Prof. David Martinez',
      avatar: 'https://randomuser.me/api/portraits/men/62.jpg'
    },
    tags: ['algebra', 'quadratic equations', 'factoring', 'mathematics']
  }
];

export default function LessonBuilder() {
  const [lessons, setLessons] = useState<LessonPlan[]>(mockLessonPlans);
  const [standards, setStandards] = useState<Standard[]>(mockStandards);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLesson, setEditedLesson] = useState<LessonPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Update active lesson when activeLessonId changes
  useEffect(() => {
    if (activeLessonId) {
      const lesson = lessons.find(l => l.id === activeLessonId);
      setActiveLesson(lesson || null);
      setEditedLesson(lesson ? { ...lesson } : null);
    } else {
      setActiveLesson(null);
      setEditedLesson(null);
    }
  }, [activeLessonId, lessons]);

  // Filter lessons based on search query and filters
  const filteredLessons = lessons.filter(lesson => {
    // Search query filter
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.tags && lesson.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Subject filter
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject;
    
    // Grade filter
    const matchesGrade = filterGrade === 'all' || lesson.gradeLevel === filterGrade;
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || lesson.status === filterStatus;
    
    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  // Get unique subjects and grades for filters
  const subjects = ['all', ...Array.from(new Set(lessons.map(lesson => lesson.subject)))];
  const grades = ['all', ...Array.from(new Set(lessons.map(lesson => lesson.gradeLevel)))];

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create new lesson
  const createNewLesson = () => {
    setIsCreating(true);
    
    const newLesson: LessonPlan = {
      id: `lesson${Date.now()}`,
      title: 'New Lesson Plan',
      subject: '',
      gradeLevel: '',
      overview: '',
      objectives: [''],
      duration: 60,
      standards: [],
      materials: [''],
      sections: [
        {
          id: `section${Date.now()}`,
          title: 'Introduction',
          type: 'introduction',
          content: '',
          duration: 10
        }
      ],
      assessments: [],
      status: 'draft',
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'currentUser',
        name: 'Current User', // This would be the logged-in user in a real app
      },
      tags: []
    };
    
    setEditedLesson(newLesson);
  };

  // Generate lesson with AI
  const generateLessonWithAI = async () => {
    if (!aiPrompt) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a detailed prompt for the AI to generate a lesson plan.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingWithAI(true);
    
    try {
      // In a real app, this would be an API call to an AI service
      // const response = await apiRequest('POST', '/api/ai/generate-lesson', { prompt: aiPrompt });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a simulated AI-generated lesson based on the prompt
      const generatedLesson: LessonPlan = {
        id: `lesson${Date.now()}`,
        title: 'AI Generated Lesson: ' + aiPrompt.split(' ').slice(0, 5).join(' '),
        subject: aiPrompt.toLowerCase().includes('math') ? 'Mathematics' : 
                aiPrompt.toLowerCase().includes('science') ? 'Science' : 
                aiPrompt.toLowerCase().includes('english') ? 'English' : 'General',
        gradeLevel: '9th Grade', // Default, would be extracted from prompt in a real implementation
        overview: `This lesson was generated based on the prompt: "${aiPrompt}"`,
        objectives: [
          'Understand key concepts related to the topic',
          'Apply knowledge in practical scenarios',
          'Analyze and evaluate information critically'
        ],
        duration: 60,
        standards: [],
        materials: ['Textbook', 'Worksheets', 'Digital resources'],
        sections: [
          {
            id: `section${Date.now()}1`,
            title: 'Introduction to Topic',
            type: 'introduction',
            content: 'Begin by introducing the main concepts and establishing prior knowledge. Ask students what they already know about the topic.',
            duration: 10
          },
          {
            id: `section${Date.now()}2`,
            title: 'Main Content Delivery',
            type: 'instruction',
            content: 'Present the core material using visual aids, examples, and explanations. Ensure to connect new information to existing knowledge.',
            duration: 20
          },
          {
            id: `section${Date.now()}3`,
            title: 'Guided Practice',
            type: 'activity',
            content: 'Students work through examples with teacher guidance. Provide immediate feedback and clarification as needed.',
            duration: 15
          },
          {
            id: `section${Date.now()}4`,
            title: 'Independent Practice',
            type: 'activity',
            content: 'Students apply what they have learned independently or in small groups. Monitor progress and provide support as needed.',
            duration: 10
          },
          {
            id: `section${Date.now()}5`,
            title: 'Conclusion and Assessment',
            type: 'conclusion',
            content: 'Summarize key points and check for understanding. Address any remaining questions or misconceptions.',
            duration: 5
          }
        ],
        assessments: [
          {
            id: `assessment${Date.now()}`,
            title: 'Formative Assessment',
            type: 'quiz',
            instructions: 'Complete the following questions to demonstrate understanding of the material covered.',
            questions: [
              {
                id: `q${Date.now()}1`,
                text: 'Sample multiple choice question about the topic',
                type: 'multiple_choice',
                options: [
                  { id: 'opt1', text: 'Option 1', correct: false },
                  { id: 'opt2', text: 'Option 2', correct: true },
                  { id: 'opt3', text: 'Option 3', correct: false },
                  { id: 'opt4', text: 'Option 4', correct: false }
                ],
                points: 1
              },
              {
                id: `q${Date.now()}2`,
                text: 'Short answer question about applying the concepts learned',
                type: 'short_answer',
                points: 2
              }
            ]
          }
        ],
        status: 'draft',
        aiGenerated: true,
        aiPrompt: aiPrompt,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'currentUser',
          name: 'Current User', // This would be the logged-in user in a real app
        },
        tags: aiPrompt.split(' ').filter(word => word.length > 3).slice(0, 5)
      };
      
      setEditedLesson(generatedLesson);
      
      toast({
        title: 'Lesson Generated',
        description: 'AI has created a lesson plan based on your prompt. Review and edit as needed.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate lesson plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingWithAI(false);
      setIsUsingAI(false);
      setIsCreating(true);
    }
  };

  // Save lesson plan
  const saveLesson = async () => {
    if (!editedLesson) return;
    
    // Validation
    if (!editedLesson.title || !editedLesson.subject || !editedLesson.gradeLevel) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title, subject, and grade level for the lesson plan.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest(
      //   isCreating ? 'POST' : 'PUT',
      //   isCreating ? '/api/lessons' : `/api/lessons/${editedLesson.id}`,
      //   editedLesson
      // );
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      const updatedLesson = {
        ...editedLesson,
        updatedAt: new Date()
      };
      
      if (isCreating) {
        setLessons([...lessons, updatedLesson]);
        setActiveLessonId(updatedLesson.id);
      } else {
        setLessons(lessons.map(lesson => 
          lesson.id === updatedLesson.id ? updatedLesson : lesson
        ));
      }
      
      setIsCreating(false);
      setIsEditing(false);
      
      toast({
        title: 'Lesson Saved',
        description: 'Your lesson plan has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save lesson plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add objective to lesson
  const addObjective = () => {
    if (!editedLesson) return;
    
    setEditedLesson({
      ...editedLesson,
      objectives: [...editedLesson.objectives, '']
    });
  };

  // Update objective
  const updateObjective = (index: number, value: string) => {
    if (!editedLesson) return;
    
    const updatedObjectives = [...editedLesson.objectives];
    updatedObjectives[index] = value;
    
    setEditedLesson({
      ...editedLesson,
      objectives: updatedObjectives
    });
  };

  // Remove objective
  const removeObjective = (index: number) => {
    if (!editedLesson) return;
    
    const updatedObjectives = [...editedLesson.objectives];
    updatedObjectives.splice(index, 1);
    
    setEditedLesson({
      ...editedLesson,
      objectives: updatedObjectives
    });
  };

  // Add material to lesson
  const addMaterial = () => {
    if (!editedLesson) return;
    
    setEditedLesson({
      ...editedLesson,
      materials: [...editedLesson.materials, '']
    });
  };

  // Update material
  const updateMaterial = (index: number, value: string) => {
    if (!editedLesson) return;
    
    const updatedMaterials = [...editedLesson.materials];
    updatedMaterials[index] = value;
    
    setEditedLesson({
      ...editedLesson,
      materials: updatedMaterials
    });
  };

  // Remove material
  const removeMaterial = (index: number) => {
    if (!editedLesson) return;
    
    const updatedMaterials = [...editedLesson.materials];
    updatedMaterials.splice(index, 1);
    
    setEditedLesson({
      ...editedLesson,
      materials: updatedMaterials
    });
  };

  // Add section to lesson
  const addSection = () => {
    if (!editedLesson) return;
    
    const newSection: LessonSection = {
      id: `section${Date.now()}`,
      title: 'New Section',
      type: 'instruction',
      content: '',
      duration: 15
    };
    
    setEditedLesson({
      ...editedLesson,
      sections: [...editedLesson.sections, newSection]
    });
  };

  // Update section
  const updateSection = (index: number, updatedSection: LessonSection) => {
    if (!editedLesson) return;
    
    const updatedSections = [...editedLesson.sections];
    updatedSections[index] = updatedSection;
    
    setEditedLesson({
      ...editedLesson,
      sections: updatedSections
    });
  };

  // Remove section
  const removeSection = (index: number) => {
    if (!editedLesson) return;
    
    const updatedSections = [...editedLesson.sections];
    updatedSections.splice(index, 1);
    
    setEditedLesson({
      ...editedLesson,
      sections: updatedSections
    });
  };

  // Add assessment to lesson
  const addAssessment = () => {
    if (!editedLesson) return;
    
    const newAssessment: Assessment = {
      id: `assessment${Date.now()}`,
      title: 'New Assessment',
      type: 'quiz',
      instructions: 'Complete the following questions.',
      questions: []
    };
    
    setEditedLesson({
      ...editedLesson,
      assessments: [...editedLesson.assessments, newAssessment]
    });
  };

  // Update assessment
  const updateAssessment = (index: number, updatedAssessment: Assessment) => {
    if (!editedLesson) return;
    
    const updatedAssessments = [...editedLesson.assessments];
    updatedAssessments[index] = updatedAssessment;
    
    setEditedLesson({
      ...editedLesson,
      assessments: updatedAssessments
    });
  };

  // Remove assessment
  const removeAssessment = (index: number) => {
    if (!editedLesson) return;
    
    const updatedAssessments = [...editedLesson.assessments];
    updatedAssessments.splice(index, 1);
    
    setEditedLesson({
      ...editedLesson,
      assessments: updatedAssessments
    });
  };

  // Add question to assessment
  const addQuestion = (assessmentIndex: number) => {
    if (!editedLesson) return;
    
    const updatedAssessments = [...editedLesson.assessments];
    const assessment = updatedAssessments[assessmentIndex];
    
    if (!assessment.questions) {
      assessment.questions = [];
    }
    
    const newQuestion: Question = {
      id: `question${Date.now()}`,
      text: '',
      type: 'multiple_choice',
      options: [
        { id: `opt${Date.now()}1`, text: '', correct: false },
        { id: `opt${Date.now()}2`, text: '', correct: false },
        { id: `opt${Date.now()}3`, text: '', correct: false },
        { id: `opt${Date.now()}4`, text: '', correct: false }
      ],
      points: 1
    };
    
    assessment.questions.push(newQuestion);
    
    setEditedLesson({
      ...editedLesson,
      assessments: updatedAssessments
    });
  };

  // Update question
  const updateQuestion = (assessmentIndex: number, questionIndex: number, updatedQuestion: Question) => {
    if (!editedLesson) return;
    
    const updatedAssessments = [...editedLesson.assessments];
    const assessment = updatedAssessments[assessmentIndex];
    
    if (assessment.questions) {
      assessment.questions[questionIndex] = updatedQuestion;
      
      setEditedLesson({
        ...editedLesson,
        assessments: updatedAssessments
      });
    }
  };

  // Remove question
  const removeQuestion = (assessmentIndex: number, questionIndex: number) => {
    if (!editedLesson) return;
    
    const updatedAssessments = [...editedLesson.assessments];
    const assessment = updatedAssessments[assessmentIndex];
    
    if (assessment.questions) {
      assessment.questions.splice(questionIndex, 1);
      
      setEditedLesson({
        ...editedLesson,
        assessments: updatedAssessments
      });
    }
  };

  // Get standard by ID
  const getStandard = (id: string) => {
    return standards.find(standard => standard.id === id);
  };

  // Calculate total duration of sections
  const getTotalSectionsDuration = (sections: LessonSection[]) => {
    return sections.reduce((total, section) => total + section.duration, 0);
  };

  // Get icon for section type
  const getSectionTypeIcon = (type: string) => {
    switch (type) {
      case 'introduction':
        return <BookOpen className="h-4 w-4" />;
      case 'instruction':
        return <Lightbulb className="h-4 w-4" />;
      case 'activity':
        return <PlayCircle className="h-4 w-4" />;
      case 'discussion':
        return <MessageSquare className="h-4 w-4" />;
      case 'assessment':
        return <FileQuestion className="h-4 w-4" />;
      case 'conclusion':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get icon for resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'quiz':
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Cancel editing or creating lesson
  const cancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
      setEditedLesson(null);
    } else if (isEditing) {
      setIsEditing(false);
      setEditedLesson(activeLesson ? { ...activeLesson } : null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lesson Builder</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Create, manage, and organize your lesson plans
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setIsUsingAI(true)}
            variant="outline"
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            AI Generate
          </Button>
          
          <Button
            onClick={createNewLesson}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Lesson
          </Button>
        </div>
      </div>
      
      <Dialog open={isUsingAI} onOpenChange={setIsUsingAI}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Lesson with AI</DialogTitle>
            <DialogDescription>
              Describe the lesson you want to create, including subject, grade level, and specific topics.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="aiPrompt">Your Prompt</Label>
            <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., Create a 9th grade biology lesson about cellular respiration and photosynthesis with a lab activity and quiz assessment."
              className="h-32 mt-2"
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Tip: Include details about the subject, grade level, learning objectives, activities, and assessments you want to include.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUsingAI(false)}>Cancel</Button>
            <Button onClick={generateLessonWithAI} disabled={isGeneratingWithAI}>
              {isGeneratingWithAI ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : 'Generate Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {(isCreating || isEditing) ? (
        <div className="space-y-6">
          {/* Lesson editor */}
          {editedLesson && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{isCreating ? 'Create New Lesson' : 'Edit Lesson'}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={saveLesson} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Lesson
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {editedLesson.aiGenerated && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      AI Generated
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lessonTitle">Lesson Title</Label>
                        <Input
                          id="lessonTitle"
                          value={editedLesson.title}
                          onChange={(e) => setEditedLesson({...editedLesson, title: e.target.value})}
                          placeholder="Enter lesson title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lessonSubject">Subject</Label>
                        <Input
                          id="lessonSubject"
                          value={editedLesson.subject}
                          onChange={(e) => setEditedLesson({...editedLesson, subject: e.target.value})}
                          placeholder="E.g., Biology, Mathematics, English"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lessonGrade">Grade Level</Label>
                        <Select
                          value={editedLesson.gradeLevel}
                          onValueChange={(value) => setEditedLesson({...editedLesson, gradeLevel: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6th Grade">6th Grade</SelectItem>
                            <SelectItem value="7th Grade">7th Grade</SelectItem>
                            <SelectItem value="8th Grade">8th Grade</SelectItem>
                            <SelectItem value="9th Grade">9th Grade</SelectItem>
                            <SelectItem value="10th Grade">10th Grade</SelectItem>
                            <SelectItem value="11th Grade">11th Grade</SelectItem>
                            <SelectItem value="12th Grade">12th Grade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lessonDuration">Duration (minutes)</Label>
                        <Input
                          id="lessonDuration"
                          type="number"
                          min="1"
                          value={editedLesson.duration}
                          onChange={(e) => setEditedLesson({...editedLesson, duration: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="lessonOverview">Overview</Label>
                      <Textarea
                        id="lessonOverview"
                        value={editedLesson.overview}
                        onChange={(e) => setEditedLesson({...editedLesson, overview: e.target.value})}
                        placeholder="Provide a brief overview of the lesson"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Learning Objectives</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addObjective}
                        className="h-8"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Objective
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {editedLesson.objectives.map((objective, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={objective}
                            onChange={(e) => updateObjective(index, e.target.value)}
                            placeholder={`Objective ${index + 1}`}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeObjective(index)}
                            disabled={editedLesson.objectives.length <= 1}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Materials</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addMaterial}
                        className="h-8"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Material
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {editedLesson.materials.map((material, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={material}
                            onChange={(e) => updateMaterial(index, e.target.value)}
                            placeholder={`Material ${index + 1}`}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeMaterial(index)}
                            disabled={editedLesson.materials.length <= 1}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Lesson Sections</Label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Total duration: {getTotalSectionsDuration(editedLesson.sections)} min / {editedLesson.duration} min
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addSection}
                        className="h-8"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Section
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {editedLesson.sections.map((section, index) => (
                        <Card key={section.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex gap-2 items-center">
                                  <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(index, {...section, title: e.target.value})}
                                    placeholder="Section title"
                                    className="font-medium text-base"
                                  />
                                  <div className="flex items-center gap-1 whitespace-nowrap">
                                    <Clock className="h-4 w-4 text-neutral-500" />
                                    <Input
                                      type="number"
                                      min="1"
                                      value={section.duration}
                                      onChange={(e) => updateSection(index, {...section, duration: parseInt(e.target.value)})}
                                      className="w-16"
                                    />
                                    <span className="text-sm text-neutral-500">min</span>
                                  </div>
                                </div>
                                <Select
                                  value={section.type}
                                  onValueChange={(value: any) => updateSection(index, {...section, type: value})}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Section type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="introduction">Introduction</SelectItem>
                                    <SelectItem value="instruction">Instruction</SelectItem>
                                    <SelectItem value="activity">Activity</SelectItem>
                                    <SelectItem value="discussion">Discussion</SelectItem>
                                    <SelectItem value="assessment">Assessment</SelectItem>
                                    <SelectItem value="conclusion">Conclusion</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeSection(index)}
                                disabled={editedLesson.sections.length <= 1}
                                className="shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={section.content}
                              onChange={(e) => updateSection(index, {...section, content: e.target.value})}
                              placeholder="Describe this section of the lesson..."
                              className="min-h-[100px]"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Assessments</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addAssessment}
                        className="h-8"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Assessment
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {editedLesson.assessments.map((assessment, assessmentIndex) => (
                        <Card key={assessment.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <Input
                                  value={assessment.title}
                                  onChange={(e) => updateAssessment(assessmentIndex, {...assessment, title: e.target.value})}
                                  placeholder="Assessment title"
                                  className="font-medium text-base"
                                />
                                <Select
                                  value={assessment.type}
                                  onValueChange={(value: any) => updateAssessment(assessmentIndex, {...assessment, type: value})}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Assessment type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="observation">Observation</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeAssessment(assessmentIndex)}
                                className="shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Textarea
                              value={assessment.instructions}
                              onChange={(e) => updateAssessment(assessmentIndex, {...assessment, instructions: e.target.value})}
                              placeholder="Instructions for this assessment..."
                              className="min-h-[80px]"
                            />
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label>Questions</Label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => addQuestion(assessmentIndex)}
                                  className="h-8"
                                >
                                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                  Add Question
                                </Button>
                              </div>
                              
                              <div className="space-y-4">
                                {assessment.questions && assessment.questions.map((question, questionIndex) => (
                                  <Card key={question.id} className="border-dashed">
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between items-start">
                                        <Input
                                          value={question.text}
                                          onChange={(e) => updateQuestion(assessmentIndex, questionIndex, {...question, text: e.target.value})}
                                          placeholder="Question text"
                                          className="font-medium"
                                        />
                                        <div className="flex gap-2 ml-2 shrink-0">
                                          <Select
                                            value={question.type}
                                            onValueChange={(value: any) => updateQuestion(assessmentIndex, questionIndex, {...question, type: value})}
                                          >
                                            <SelectTrigger className="h-8 w-40">
                                              <SelectValue placeholder="Question type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                              <SelectItem value="true_false">True/False</SelectItem>
                                              <SelectItem value="short_answer">Short Answer</SelectItem>
                                              <SelectItem value="essay">Essay</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeQuestion(assessmentIndex, questionIndex)}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      {question.type === 'multiple_choice' && question.options && (
                                        <div className="space-y-2">
                                          {question.options.map((option, optionIndex) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                              <RadioGroup
                                                value={option.correct ? option.id : ''}
                                                onValueChange={(value) => {
                                                  const updatedOptions = question.options?.map((opt) => ({
                                                    ...opt,
                                                    correct: opt.id === value
                                                  }));
                                                  updateQuestion(assessmentIndex, questionIndex, {
                                                    ...question,
                                                    options: updatedOptions
                                                  });
                                                }}
                                              >
                                                <RadioGroupItem value={option.id} id={option.id} />
                                              </RadioGroup>
                                              <Input
                                                value={option.text}
                                                onChange={(e) => {
                                                  const updatedOptions = [...(question.options || [])];
                                                  updatedOptions[optionIndex] = {
                                                    ...option,
                                                    text: e.target.value
                                                  };
                                                  updateQuestion(assessmentIndex, questionIndex, {
                                                    ...question,
                                                    options: updatedOptions
                                                  });
                                                }}
                                                placeholder={`Option ${optionIndex + 1}`}
                                                className="flex-1"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {question.type === 'true_false' && (
                                        <RadioGroup
                                          value={question.correctAnswer || ''}
                                          onValueChange={(value) => updateQuestion(assessmentIndex, questionIndex, {
                                            ...question,
                                            correctAnswer: value
                                          })}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id={`${question.id}-true`} />
                                            <Label htmlFor={`${question.id}-true`}>True</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id={`${question.id}-false`} />
                                            <Label htmlFor={`${question.id}-false`}>False</Label>
                                          </div>
                                        </RadioGroup>
                                      )}
                                      
                                      {(question.type === 'short_answer' || question.type === 'essay') && (
                                        <div className="space-y-2">
                                          <Label>Correct Answer (for grading reference)</Label>
                                          <Textarea
                                            value={question.correctAnswer || ''}
                                            onChange={(e) => updateQuestion(assessmentIndex, questionIndex, {
                                              ...question,
                                              correctAnswer: e.target.value
                                            })}
                                            placeholder="Enter correct or sample answer"
                                            className="min-h-[60px]"
                                          />
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-2 mt-4">
                                        <Label htmlFor={`points-${question.id}`}>Points:</Label>
                                        <Input
                                          id={`points-${question.id}`}
                                          type="number"
                                          min="1"
                                          value={question.points}
                                          onChange={(e) => updateQuestion(assessmentIndex, questionIndex, {
                                            ...question,
                                            points: parseInt(e.target.value)
                                          })}
                                          className="w-20"
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                                
                                {(!assessment.questions || assessment.questions.length === 0) && (
                                  <div className="text-center p-4 border border-dashed rounded-md text-neutral-500 dark:text-neutral-400">
                                    No questions added yet. Click "Add Question" to create one.
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {editedLesson.assessments.length === 0 && (
                        <div className="text-center p-6 border border-dashed rounded-md text-neutral-500 dark:text-neutral-400">
                          No assessments added yet. Click "Add Assessment" to create one.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label>Lesson Tags</Label>
                    <div>
                      <Input
                        value={editedLesson.tags ? editedLesson.tags.join(', ') : ''}
                        onChange={(e) => setEditedLesson({
                          ...editedLesson,
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                        })}
                        placeholder="Enter tags separated by commas (e.g., photosynthesis, biology, plants)"
                      />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Tags help organize and search for lessons
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Label>Publishing Status</Label>
                      <Select
                        value={editedLesson.status}
                        onValueChange={(value: any) => setEditedLesson({...editedLesson, status: value})}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={saveLesson} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Lesson
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lesson list or details view */}
          {activeLesson ? (
            <div className="space-y-6">
              {/* Lesson details view */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setActiveLessonId(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Lessons
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Print Lesson
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link className="mr-2 h-4 w-4" />
                        Share Lesson
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Lesson
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">{activeLesson.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-800">
                          {activeLesson.subject}
                        </Badge>
                        <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-800">
                          {activeLesson.gradeLevel}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800">
                          <Clock className="h-3 w-3" /> {activeLesson.duration} min
                        </Badge>
                        <Badge variant={activeLesson.status === 'published' ? 'default' : 'outline'}>
                          {activeLesson.status.charAt(0).toUpperCase() + activeLesson.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-right">
                        <div className="text-neutral-500 dark:text-neutral-400">Created by</div>
                        <div className="font-medium">{activeLesson.author.name}</div>
                      </div>
                      <Avatar className="h-10 w-10">
                        {activeLesson.author.avatar ? (
                          <AvatarImage src={activeLesson.author.avatar} alt={activeLesson.author.name} />
                        ) : (
                          <AvatarFallback>{activeLesson.author.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                  {activeLesson.aiGenerated && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      AI Generated
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Overview</h3>
                    <p className="text-neutral-700 dark:text-neutral-300">{activeLesson.overview}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Learning Objectives</h3>
                    <ul className="space-y-2">
                      {activeLesson.objectives.map((objective, index) => (
                        <li key={index} className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Standards Alignment</h3>
                    <div className="space-y-2">
                      {activeLesson.standards.length > 0 ? activeLesson.standards.map(standardId => {
                        const standard = getStandard(standardId);
                        return standard ? (
                          <div key={standardId} className="p-3 border rounded-md">
                            <div className="font-medium">{standard.code}</div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              {standard.description}
                            </div>
                          </div>
                        ) : null;
                      }) : (
                        <div className="text-neutral-500 dark:text-neutral-400 italic">
                          No standards associated with this lesson
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Materials Needed</h3>
                    <ul className="space-y-1">
                      {activeLesson.materials.map((material, index) => (
                        <li key={index} className="flex gap-2 items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Lesson Sections</h3>
                    <div className="space-y-4">
                      {activeLesson.sections.map((section, index) => (
                        <Card key={section.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  {getSectionTypeIcon(section.type)}
                                  <CardTitle className="text-base">{section.title}</CardTitle>
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                                </Badge>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {section.duration} min
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                              {section.content}
                            </div>
                            
                            {section.resources && section.resources.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Resources</h4>
                                <div className="flex flex-wrap gap-2">
                                  {section.resources.map(resource => (
                                    <div 
                                      key={resource.id}
                                      className="border rounded-md p-2 flex items-center gap-2 text-sm"
                                    >
                                      {getResourceTypeIcon(resource.type)}
                                      {resource.url ? (
                                        <a 
                                          href={resource.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center hover:underline"
                                        >
                                          {resource.title}
                                          <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span>{resource.title}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {section.materials && section.materials.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Section Materials</h4>
                                <ul className="list-disc list-inside text-sm pl-2">
                                  {section.materials.map((material, idx) => (
                                    <li key={idx}>{material}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Assessments</h3>
                    <div className="space-y-4">
                      {activeLesson.assessments.length > 0 ? activeLesson.assessments.map(assessment => (
                        <Card key={assessment.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{assessment.title}</CardTitle>
                                <Badge variant="outline" className="mt-1">
                                  {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                Print
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-neutral-700 dark:text-neutral-300 mb-4">
                              <h4 className="font-medium mb-1">Instructions:</h4>
                              <p>{assessment.instructions}</p>
                            </div>
                            
                            {assessment.questions && assessment.questions.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="font-medium">Questions:</h4>
                                {assessment.questions.map((question, qIndex) => (
                                  <div 
                                    key={question.id}
                                    className="border p-3 rounded-md"
                                  >
                                    <div className="font-medium flex justify-between">
                                      <div>
                                        {qIndex + 1}. {question.text}
                                      </div>
                                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {question.points} {question.points === 1 ? 'point' : 'points'}
                                      </div>
                                    </div>
                                    
                                    {question.type === 'multiple_choice' && question.options && (
                                      <div className="mt-2 space-y-1">
                                        {question.options.map(option => (
                                          <div 
                                            key={option.id}
                                            className={`flex items-center p-2 rounded-md text-sm ${
                                              option.correct ? 'bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50' : ''
                                            }`}
                                          >
                                            <div className="h-3 w-3 rounded-full mr-2 border border-current flex items-center justify-center">
                                              {option.correct && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                            </div>
                                            {option.text}
                                            {option.correct && <CheckCircle className="ml-auto h-4 w-4 text-green-500" />}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {question.type === 'true_false' && (
                                      <div className="mt-2 flex gap-4 text-sm">
                                        <div className={question.correctAnswer === 'true' ? 'text-green-600 font-medium' : ''}>
                                          <div className="flex items-center">
                                            <div className="h-3 w-3 rounded-full mr-2 border border-current flex items-center justify-center">
                                              {question.correctAnswer === 'true' && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                            </div>
                                            True
                                          </div>
                                        </div>
                                        <div className={question.correctAnswer === 'false' ? 'text-green-600 font-medium' : ''}>
                                          <div className="flex items-center">
                                            <div className="h-3 w-3 rounded-full mr-2 border border-current flex items-center justify-center">
                                              {question.correctAnswer === 'false' && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                            </div>
                                            False
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {(question.type === 'short_answer' || question.type === 'essay') && question.correctAnswer && (
                                      <div className="mt-2 text-sm">
                                        <div className="text-neutral-500 dark:text-neutral-400">Sample answer:</div>
                                        <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-md mt-1">
                                          {question.correctAnswer}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) : (
                        <div className="text-center p-6 border border-dashed rounded-md text-neutral-500 dark:text-neutral-400">
                          No assessments defined for this lesson
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {activeLesson.tags && activeLesson.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {activeLesson.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                    <div>Created: {formatDate(activeLesson.createdAt)}</div>
                    <div>Last updated: {formatDate(activeLesson.updatedAt)}</div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="outline" onClick={() => setActiveLessonId(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Lessons
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lesson list view */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Lesson Plans</CardTitle>
                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                      <Input
                        placeholder="Search lessons..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={filterSubject}
                        onValueChange={setFilterSubject}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>
                              {subject === 'all' ? 'All Subjects' : subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={filterGrade}
                        onValueChange={setFilterGrade}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map(grade => (
                            <SelectItem key={grade} value={grade}>
                              {grade === 'all' ? 'All Grades' : grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredLessons.length > 0 ? (
                      filteredLessons.map(lesson => (
                        <Card 
                          key={lesson.id} 
                          className="border cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setActiveLessonId(lesson.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-2 mt-1">
                                  <Badge variant="outline">{lesson.subject}</Badge>
                                  <Badge variant="outline">{lesson.gradeLevel}</Badge>
                                  {lesson.aiGenerated && (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">AI</Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <Badge variant={lesson.status === 'published' ? 'default' : 'outline'}>
                                {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                              {lesson.overview}
                            </p>
                            
                            <div className="flex justify-between items-center mt-4">
                              <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                                <Clock className="h-4 w-4" />
                                <span>{lesson.duration} min</span>
                                <span className="mx-2">•</span>
                                <span>{formatDate(lesson.updatedAt)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => {
                                  e.stopPropagation();
                                  setEditedLesson(lesson);
                                  setActiveLessonId(lesson.id);
                                  setIsEditing(true);
                                }}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only md:not-sr-only">Edit</span>
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Print
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle delete
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <Book className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">No Lessons Found</h3>
                        <p className="mb-4">No lesson plans match your current filters.</p>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSearchQuery('');
                              setFilterSubject('all');
                              setFilterGrade('all');
                              setFilterStatus('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                          <Button onClick={createNewLesson}>Create New Lesson</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LessonCalendar(props: any) {
  return <Calendar {...props} />;
}

function LessonMoreHorizontal(props: any) {
  return <MoreHorizontal {...props} />;
}

function LessonTimerIcon(props) {
  return <Clock {...props} />;
}