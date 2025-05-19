import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Briefcase, 
  ChevronDown, 
  Building2, 
  DollarSign, 
  Calendar,
  Book,
  Star,
  Users,
  Phone,
  Mail,
  User,
  Send,
  Download,
  Pencil,
  XCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  Plus,
  Eye,
  ExternalLink,
  Upload,
  Info,
  SearchX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
type JobType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship' | 'remote';
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn';

interface Company {
  id: string;
  name: string;
  logo?: string;
  location: string;
  website: string;
  size: string;
  industry: string;
  description: string;
}

interface JobPosting {
  id: string;
  title: string;
  company: Company;
  location: string;
  remoteOption: boolean;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  datePosted: Date;
  applicationDeadline?: Date;
  tags: string[];
  views: number;
  applicants: number;
  featured: boolean;
  contactEmail: string;
  contactPhone?: string;
}

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedDate: Date;
  lastUpdated: Date;
  notes?: string;
  feedback?: string;
  interviewScheduled?: Date;
  referred?: boolean;
  referredBy?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  avatar?: string;
  title: string;
  experience: number; // Years
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  skills: string[];
  languages: {
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }[];
  links: {
    type: 'linkedin' | 'github' | 'portfolio' | 'other';
    url: string;
  }[];
  bio: string;
}

// Mock Data
const mockCompanies: Company[] = [
  {
    id: 'company1',
    name: 'TechNova Inc.',
    logo: 'https://placehold.co/200x200/4F46E5/FFFFFF?text=TN',
    location: 'San Francisco, CA',
    website: 'https://technova.example.com',
    size: '500-1000',
    industry: 'Technology',
    description: 'TechNova is a leading technology company specializing in cloud solutions and AI-powered software. We are dedicated to innovation and creating cutting-edge products that solve real-world problems.'
  },
  {
    id: 'company2',
    name: 'GreenEarth Solutions',
    logo: 'https://placehold.co/200x200/10B981/FFFFFF?text=GE',
    location: 'Portland, OR',
    website: 'https://greenearth.example.com',
    size: '100-500',
    industry: 'Environmental',
    description: 'GreenEarth Solutions is committed to developing sustainable technology solutions that help businesses reduce their environmental impact while improving efficiency and reducing costs.'
  },
  {
    id: 'company3',
    name: 'MediCore Health',
    logo: 'https://placehold.co/200x200/EC4899/FFFFFF?text=MC',
    location: 'Boston, MA',
    website: 'https://medicore.example.com',
    size: '1000-5000',
    industry: 'Healthcare',
    description: 'MediCore Health is a healthcare technology company focused on improving patient outcomes through innovative digital solutions, data analytics, and integrated care management platforms.'
  },
  {
    id: 'company4',
    name: 'Finance Plus',
    logo: 'https://placehold.co/200x200/FBBF24/000000?text=F+',
    location: 'New York, NY',
    website: 'https://financeplus.example.com',
    size: '500-1000',
    industry: 'Finance',
    description: 'Finance Plus is a fintech company specializing in innovative financial tools and platforms that help individuals and businesses manage their finances more effectively and securely.'
  },
  {
    id: 'company5',
    name: 'Creative Media Group',
    logo: 'https://placehold.co/200x200/F43F5E/FFFFFF?text=CMG',
    location: 'Los Angeles, CA',
    website: 'https://creativemedia.example.com',
    size: '100-500',
    industry: 'Media & Entertainment',
    description: 'Creative Media Group is a dynamic media company that creates engaging content across multiple platforms, from digital media to traditional publishing, film, and television.'
  }
];

const mockJobPostings: JobPosting[] = [
  {
    id: 'job1',
    title: 'Senior Full Stack Developer',
    company: mockCompanies[0],
    location: 'San Francisco, CA',
    remoteOption: true,
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD',
      period: 'yearly'
    },
    description: "At TechNova, we're looking for a talented Senior Full Stack Developer to join our product team. You'll work on challenging projects, collaborate with cross-functional teams, and build innovative solutions that impact millions of users.\n\nAs a Senior Full Stack Developer, you'll be responsible for designing, implementing, and maintaining both frontend and backend systems. You'll work closely with product managers, designers, and other engineers to deliver high-quality, scalable solutions.",
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "5+ years of experience in full stack development",
      "Strong proficiency in JavaScript/TypeScript, React, Node.js",
      "Experience with cloud services (AWS, GCP, or Azure)",
      "Knowledge of database systems (SQL and NoSQL)",
      "Excellent problem-solving and communication skills"
    ],
    responsibilities: [
      "Design and implement scalable web applications",
      "Collaborate with cross-functional teams to define and implement new features",
      "Ensure code quality through testing and code reviews",
      "Mentor junior developers and contribute to team growth",
      "Participate in system architecture decisions",
      "Continuously improve our development practices and tools"
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work schedule and remote options",
      "Generous PTO and parental leave",
      "Professional development budget",
      "Modern equipment and workspace"
    ],
    jobType: 'full-time',
    experienceLevel: 'senior',
    datePosted: new Date('2025-05-01'),
    applicationDeadline: new Date('2025-06-01'),
    tags: ['React', 'Node.js', 'TypeScript', 'AWS', 'Full Stack'],
    views: 1245,
    applicants: 87,
    featured: true,
    contactEmail: 'careers@technova.example.com',
    contactPhone: '+1 (555) 123-4567'
  },
  {
    id: 'job2',
    title: 'UX/UI Designer',
    company: mockCompanies[0],
    location: 'San Francisco, CA',
    remoteOption: true,
    salary: {
      min: 90000,
      max: 120000,
      currency: 'USD',
      period: 'yearly'
    },
    description: "TechNova is seeking a talented UX/UI Designer to join our growing product team. In this role, you'll create intuitive, engaging user experiences across our digital products, working closely with product managers, engineers, and other stakeholders.\n\nYou'll be responsible for the entire design process, from user research and wireframing to creating high-fidelity prototypes and collaborating with engineers on implementation.",
    requirements: [
      "Bachelor's degree in Design, HCI, or related field",
      "3+ years of experience in UX/UI design",
      "Strong portfolio showcasing your design thinking and process",
      "Proficiency with design tools (Figma, Sketch, Adobe Suite)",
      "Experience with user research and usability testing",
      "Understanding of accessibility standards and best practices"
    ],
    responsibilities: [
      "Create user-centered designs by understanding business requirements and user feedback",
      "Design wireframes, prototypes, and user interfaces for web and mobile applications",
      "Conduct user research and usability testing to inform design decisions",
      "Collaborate with cross-functional teams to define and implement features",
      "Create and maintain design systems and style guides",
      "Stay up-to-date with the latest design trends and technologies"
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work schedule and remote options",
      "Generous PTO and parental leave",
      "Professional development budget",
      "Modern equipment and workspace"
    ],
    jobType: 'full-time',
    experienceLevel: 'mid',
    datePosted: new Date('2025-05-05'),
    applicationDeadline: new Date('2025-06-05'),
    tags: ['UI Design', 'UX Research', 'Figma', 'Product Design', 'Wireframing'],
    views: 876,
    applicants: 54,
    featured: false,
    contactEmail: 'careers@technova.example.com'
  },
  {
    id: 'job3',
    title: 'Environmental Engineer',
    company: mockCompanies[1],
    location: 'Portland, OR',
    remoteOption: false,
    salary: {
      min: 85000,
      max: 110000,
      currency: 'USD',
      period: 'yearly'
    },
    description: "GreenEarth Solutions is seeking an Environmental Engineer to join our sustainable technology team. In this role, you'll help design and implement innovative solutions to reduce environmental impact for our clients.\n\nYou'll work on challenging projects ranging from renewable energy systems to waste reduction strategies, collaborating with a multidisciplinary team of engineers, scientists, and business professionals.",
    requirements: [
      "Bachelor's or Master's degree in Environmental Engineering or related field",
      "3+ years of experience in environmental engineering",
      "Knowledge of sustainability principles and environmental regulations",
      "Experience with environmental impact assessments",
      "Familiarity with renewable energy systems",
      "Strong analytical and problem-solving skills"
    ],
    responsibilities: [
      "Design and implement sustainable solutions for clients",
      "Conduct environmental assessments and feasibility studies",
      "Develop and maintain environmental management systems",
      "Collaborate with cross-functional teams on project implementation",
      "Monitor and report on project outcomes and environmental metrics",
      "Stay current with environmental regulations and sustainability practices"
    ],
    benefits: [
      "Competitive salary and benefits package",
      "Health, dental, and vision insurance",
      "Retirement plan with company match",
      "Generous PTO policy",
      "Professional development opportunities",
      "Company-wide sustainability initiatives"
    ],
    jobType: 'full-time',
    experienceLevel: 'mid',
    datePosted: new Date('2025-05-03'),
    tags: ['Environmental Engineering', 'Sustainability', 'Renewable Energy', 'Green Technology'],
    views: 543,
    applicants: 32,
    featured: true,
    contactEmail: 'jobs@greenearth.example.com',
    contactPhone: '+1 (555) 987-6543'
  },
  {
    id: 'job4',
    title: 'Data Scientist',
    company: mockCompanies[2],
    location: 'Boston, MA',
    remoteOption: true,
    salary: {
      min: 110000,
      max: 140000,
      currency: 'USD',
      period: 'yearly'
    },
    description: "MediCore Health is looking for a skilled Data Scientist to join our analytics team. In this role, you'll leverage health data to develop insights and predictive models that improve patient care and operational efficiency.\n\nYou'll work with large healthcare datasets, applying advanced analytics and machine learning techniques to solve complex problems in the healthcare domain.",
    requirements: [
      "Master's or PhD in Data Science, Statistics, Computer Science, or related field",
      "3+ years of experience in data science or analytics",
      "Strong proficiency in Python, R, or similar programming languages",
      "Experience with machine learning frameworks and statistical analysis",
      "Knowledge of SQL and database systems",
      "Familiarity with healthcare data is a plus"
    ],
    responsibilities: [
      "Analyze large healthcare datasets to extract actionable insights",
      "Develop and implement machine learning models for predictive analytics",
      "Create data visualizations and reports for stakeholders",
      "Collaborate with product and engineering teams on data-driven features",
      "Ensure data quality and integrity in analytical processes",
      "Stay current with advances in data science and machine learning"
    ],
    benefits: [
      "Competitive salary and comprehensive benefits",
      "Health, dental, and vision insurance",
      "Flexible work arrangements",
      "Generous PTO policy",
      "Continuing education and conference attendance",
      "Modern workspace and equipment"
    ],
    jobType: 'full-time',
    experienceLevel: 'senior',
    datePosted: new Date('2025-05-07'),
    applicationDeadline: new Date('2025-06-15'),
    tags: ['Data Science', 'Machine Learning', 'Python', 'Healthcare', 'Analytics'],
    views: 789,
    applicants: 45,
    featured: false,
    contactEmail: 'careers@medicore.example.com'
  },
  {
    id: 'job5',
    title: 'Financial Analyst (Internship)',
    company: mockCompanies[3],
    location: 'New York, NY',
    remoteOption: false,
    salary: {
      min: 25,
      max: 30,
      currency: 'USD',
      period: 'hourly'
    },
    description: "Finance Plus is offering a Financial Analyst internship for students or recent graduates interested in pursuing a career in finance. This internship provides hands-on experience in financial analysis, reporting, and forecasting.\n\nAs an intern, you'll work alongside experienced financial professionals, gaining valuable skills and insights into the fintech industry while contributing to real projects.",
    requirements: [
      "Currently pursuing or recently completed a degree in Finance, Economics, or related field",
      "Strong analytical and quantitative skills",
      "Proficiency with Excel and financial analysis tools",
      "Excellent attention to detail",
      "Good communication and presentation skills",
      "Interest in financial technology and innovation"
    ],
    responsibilities: [
      "Assist in financial data collection and analysis",
      "Help prepare financial reports and presentations",
      "Support budget planning and forecasting activities",
      "Participate in financial research projects",
      "Contribute to process improvement initiatives",
      "Learn about fintech products and services"
    ],
    benefits: [
      "Competitive hourly rate",
      "Structured learning and development program",
      "Mentorship from experienced professionals",
      "Networking opportunities",
      "Potential for full-time employment",
      "Modern office in prime location"
    ],
    jobType: 'internship',
    experienceLevel: 'entry',
    datePosted: new Date('2025-05-10'),
    applicationDeadline: new Date('2025-05-31'),
    tags: ['Finance', 'Analysis', 'Internship', 'Fintech', 'Entry Level'],
    views: 432,
    applicants: 78,
    featured: false,
    contactEmail: 'internships@financeplus.example.com'
  },
  {
    id: 'job6',
    title: 'Content Marketing Manager',
    company: mockCompanies[4],
    location: 'Los Angeles, CA',
    remoteOption: true,
    salary: {
      min: 75000,
      max: 95000,
      currency: 'USD',
      period: 'yearly'
    },
    description: "Creative Media Group is seeking a Content Marketing Manager to develop and execute content strategies that engage our audience and drive growth. In this role, you'll oversee content creation across multiple channels, working with writers, designers, and other creatives.\n\nYou'll be responsible for planning, producing, and measuring the impact of various content initiatives, ensuring they align with our brand voice and business objectives.",
    requirements: [
      "Bachelor's degree in Marketing, Communications, Journalism, or related field",
      "3+ years of experience in content marketing or similar role",
      "Excellent writing and editing skills",
      "Experience with content management systems",
      "Understanding of SEO and content analytics",
      "Strong project management and organizational skills"
    ],
    responsibilities: [
      "Develop and implement content strategy across multiple platforms",
      "Manage editorial calendar and content production workflow",
      "Create engaging, high-quality content for various channels",
      "Work with creative teams to produce multimedia content",
      "Analyze content performance and optimize based on insights",
      "Stay current with content marketing trends and best practices"
    ],
    benefits: [
      "Competitive salary and benefits package",
      "Health, dental, and vision insurance",
      "Flexible work arrangements",
      "Generous PTO policy",
      "Professional development opportunities",
      "Creative work environment"
    ],
    jobType: 'full-time',
    experienceLevel: 'mid',
    datePosted: new Date('2025-05-08'),
    applicationDeadline: new Date('2025-06-08'),
    tags: ['Content Marketing', 'Digital Media', 'SEO', 'Editorial', 'Creative'],
    views: 621,
    applicants: 41,
    featured: false,
    contactEmail: 'jobs@creativemedia.example.com',
    contactPhone: '+1 (555) 456-7890'
  }
];

const mockJobApplications: JobApplication[] = [
  {
    id: 'app1',
    jobId: 'job1',
    userId: 'user1',
    resumeUrl: '/assets/mock-resume.pdf',
    coverLetter: 'I am excited to apply for the Senior Full Stack Developer position at TechNova...',
    status: 'interview',
    appliedDate: new Date('2025-05-10'),
    lastUpdated: new Date('2025-05-15'),
    notes: 'Candidate has strong experience with React and Node.js. Technical screening went well.',
    interviewScheduled: new Date('2025-05-20T14:00:00')
  },
  {
    id: 'app2',
    jobId: 'job3',
    userId: 'user1',
    resumeUrl: '/assets/mock-resume.pdf',
    status: 'applied',
    appliedDate: new Date('2025-05-12'),
    lastUpdated: new Date('2025-05-12')
  },
  {
    id: 'app3',
    jobId: 'job4',
    userId: 'user1',
    resumeUrl: '/assets/mock-resume.pdf',
    coverLetter: 'As a data scientist with healthcare experience, I am particularly interested in...',
    status: 'screening',
    appliedDate: new Date('2025-05-08'),
    lastUpdated: new Date('2025-05-14'),
    notes: 'Initial review positive. Schedule phone screen.'
  }
];

const mockCandidate: Candidate = {
  id: 'user1',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 123-4567',
  location: 'Seattle, WA',
  avatar: 'https://randomuser.me/api/portraits/people/1.jpg',
  title: 'Senior Software Engineer',
  experience: 8,
  education: [
    {
      degree: 'Master of Computer Science',
      institution: 'University of Washington',
      year: 2019
    },
    {
      degree: 'Bachelor of Science in Computer Engineering',
      institution: 'California Institute of Technology',
      year: 2017
    }
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'GraphQL', 'Python', 'Machine Learning'],
  languages: [
    {
      language: 'English',
      proficiency: 'native'
    },
    {
      language: 'Spanish',
      proficiency: 'conversational'
    }
  ],
  links: [
    {
      type: 'linkedin',
      url: 'https://linkedin.com/in/alexmorgan'
    },
    {
      type: 'github',
      url: 'https://github.com/alexmorgan'
    },
    {
      type: 'portfolio',
      url: 'https://alexmorgan.dev'
    }
  ],
  bio: 'Experienced software engineer with a passion for building scalable, user-friendly applications. Specialized in full-stack development with expertise in React, Node.js, and cloud technologies. Strong problem-solving skills and a track record of delivering high-quality software products.'
};

export default function JobBoard() {
  const [jobs, setJobs] = useState<JobPosting[]>(mockJobPostings);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>(mockJobPostings);
  const [applications, setApplications] = useState<JobApplication[]>(mockJobApplications);
  const [candidate, setCandidate] = useState<Candidate>(mockCandidate);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'applications'>('board');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | ''>('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<ExperienceLevel | ''>('');
  const [salaryRangeFilter, setSalaryRangeFilter] = useState<[number, number]>([0, 200000]);
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [openDialog, setOpenDialog] = useState<'jobDetails' | 'apply' | 'applicationDetails' | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    resumeFile: null as File | null
  });
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Filter jobs based on search and filter criteria
  useEffect(() => {
    let result = [...jobs];
    
    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowerQuery) || 
        job.company.name.toLowerCase().includes(lowerQuery) ||
        job.description.toLowerCase().includes(lowerQuery) ||
        job.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Location filter
    if (locationFilter) {
      result = result.filter(job => 
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    // Job type filter
    if (jobTypeFilter) {
      result = result.filter(job => job.jobType === jobTypeFilter);
    }
    
    // Experience level filter
    if (experienceLevelFilter) {
      result = result.filter(job => job.experienceLevel === experienceLevelFilter);
    }
    
    // Salary range filter
    result = result.filter(job => {
      // Convert hourly/monthly to yearly for comparison
      let annualizedMin = job.salary.min;
      let annualizedMax = job.salary.max;
      
      if (job.salary.period === 'hourly') {
        annualizedMin = job.salary.min * 40 * 52; // 40 hours per week, 52 weeks per year
        annualizedMax = job.salary.max * 40 * 52;
      } else if (job.salary.period === 'monthly') {
        annualizedMin = job.salary.min * 12;
        annualizedMax = job.salary.max * 12;
      }
      
      return annualizedMax >= salaryRangeFilter[0] && annualizedMin <= salaryRangeFilter[1];
    });
    
    // Remote only filter
    if (remoteOnlyFilter) {
      result = result.filter(job => job.remoteOption);
    }
    
    // Sort by featured and date posted (featured first, then most recent)
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.datePosted.getTime() - a.datePosted.getTime();
    });
    
    setFilteredJobs(result);
  }, [jobs, searchQuery, locationFilter, jobTypeFilter, experienceLevelFilter, salaryRangeFilter, remoteOnlyFilter]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  // Format salary range
  const formatSalaryRange = (salary: JobPosting['salary']): string => {
    const { min, max, currency, period } = salary;
    
    const formattedMin = formatCurrency(min, currency);
    const formattedMax = formatCurrency(max, currency);
    
    let periodText = '';
    switch (period) {
      case 'hourly':
        periodText = '/hour';
        break;
      case 'monthly':
        periodText = '/month';
        break;
      case 'yearly':
        periodText = '/year';
        break;
    }
    
    return `${formattedMin} - ${formattedMax}${periodText}`;
  };

  // Get application status badge
  const getApplicationStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Applied</Badge>;
      case 'screening':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Screening</Badge>;
      case 'interview':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Interview</Badge>;
      case 'offer':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Offer</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>;
      case 'withdrawn':
        return <Badge className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">Withdrawn</Badge>;
    }
  };

  // Handle applying for a job
  const handleApplyForJob = async () => {
    if (!selectedJob) return;
    
    setIsApplying(true);
    
    try {
      // In a real app, this would upload the resume file and send the application data
      // const formData = new FormData();
      // if (applicationForm.resumeFile) {
      //   formData.append('resume', applicationForm.resumeFile);
      // }
      // formData.append('coverLetter', applicationForm.coverLetter);
      // formData.append('jobId', selectedJob.id);
      
      // const response = await apiRequest('POST', '/api/job-applications', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a new application
      const newApplication: JobApplication = {
        id: `app${Date.now()}`,
        jobId: selectedJob.id,
        userId: candidate.id,
        resumeUrl: '/assets/mock-resume.pdf', // In a real app, this would be the uploaded file URL
        coverLetter: applicationForm.coverLetter,
        status: 'applied',
        appliedDate: new Date(),
        lastUpdated: new Date()
      };
      
      setApplications([...applications, newApplication]);
      
      // Reset form
      setApplicationForm({
        coverLetter: '',
        resumeFile: null
      });
      
      // Close dialog
      setOpenDialog(null);
      
      toast({
        title: 'Application Submitted',
        description: `Your application for ${selectedJob.title} has been submitted successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setApplicationForm({
        ...applicationForm,
        resumeFile: files[0]
      });
    }
  };

  // Handle opening job details
  const handleOpenJobDetails = (job: JobPosting) => {
    setSelectedJob(job);
    setOpenDialog('jobDetails');
  };

  // Handle opening application details
  const handleOpenApplicationDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setOpenDialog('applicationDetails');
  };

  // Get job for application
  const getJobForApplication = (application: JobApplication): JobPosting | undefined => {
    return jobs.find(job => job.id === application.jobId);
  };

  // Check if user has already applied for a job
  const hasAppliedForJob = (jobId: string): boolean => {
    return applications.some(app => app.jobId === jobId && app.userId === candidate.id);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Job Board</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Find and apply for jobs matching your skills and experience</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              onClick={() => setViewMode('board')}
              className="gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden md:inline">Job Listings</span>
            </Button>
            <Button
              variant={viewMode === 'applications' ? 'default' : 'outline'}
              onClick={() => setViewMode('applications')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">My Applications</span>
            </Button>
          </div>
        </div>
      </div>
      
      {viewMode === 'board' ? (
        <>
          {/* Filters */}
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search jobs by title, company, or keywords..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <Select
                  value={locationFilter}
                  onValueChange={setLocationFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {Array.from(new Set(jobs.map(job => job.location))).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={jobTypeFilter}
                  onValueChange={(value) => setJobTypeFilter(value as JobType | '')}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={experienceLevelFilter}
                  onValueChange={(value) => setExperienceLevelFilter(value as ExperienceLevel | '')}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="remote-only"
                    checked={remoteOnlyFilter}
                    onCheckedChange={setRemoteOnlyFilter}
                  />
                  <Label htmlFor="remote-only" className="text-sm cursor-pointer">Remote Only</Label>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
              <Label className="mb-0">Salary Range:</Label>
              <div className="w-full md:w-80 flex items-center gap-4">
                <Slider
                  value={salaryRangeFilter}
                  min={0}
                  max={200000}
                  step={10000}
                  onValueChange={(value) => setSalaryRangeFilter(value as [number, number])}
                />
                <span className="text-sm whitespace-nowrap">
                  {formatCurrency(salaryRangeFilter[0])} - {formatCurrency(salaryRangeFilter[1])}+ /year
                </span>
              </div>
            </div>
          </div>
          
          {/* Job Listings */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <h2 className="text-lg font-medium">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              </h2>
            </div>
            
            <div className="space-y-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => {
                  const hasApplied = hasAppliedForJob(job.id);
                  
                  return (
                    <Card
                      key={job.id}
                      className={`overflow-hidden cursor-pointer hover:border-primary transition-all ${job.featured ? 'ring-1 ring-yellow-500' : ''}`}
                      onClick={() => handleOpenJobDetails(job)}
                    >
                      {job.featured && (
                        <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs px-4 py-1 text-center">
                          Featured Job
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                              {job.company.logo ? (
                                <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="h-8 w-8 text-neutral-400" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-grow space-y-1.5">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                              <h3 className="text-lg font-medium">{job.title}</h3>
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {job.jobType.replace('-', ' ')}
                                </Badge>
                                
                                <Badge variant="outline" className="text-xs">
                                  {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)} Level
                                </Badge>
                                
                                {job.remoteOption && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                    Remote Option
                                  </Badge>
                                )}
                                
                                {hasApplied && (
                                  <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    Applied
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-base font-medium">{job.company.name}</div>
                            
                            <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatSalaryRange(job.salary)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {getRelativeTime(job.datePosted)}</span>
                              </div>
                            </div>
                            
                            <div className="pt-1">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                {job.description.substring(0, 150)}...
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 pt-1">
                              {job.tags.slice(0, 5).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {job.tags.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{job.tags.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <SearchX className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
                  <p className="mt-2 text-neutral-500">
                    Try adjusting your filters or search query to find more jobs.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setJobTypeFilter('');
                      setExperienceLevelFilter('');
                      setSalaryRangeFilter([0, 200000]);
                      setRemoteOnlyFilter(false);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* My Applications */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <h2 className="text-lg font-medium">My Applications</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Track the status of jobs you've applied for
              </p>
            </div>
            
            {applications.length > 0 ? (
              <div className="space-y-4">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Applications</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <div className="space-y-4">
                      {applications.map(application => {
                        const job = getJobForApplication(application);
                        if (!job) return null;
                        
                        return (
                          <Card
                            key={application.id}
                            className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                            onClick={() => handleOpenApplicationDetails(application)}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                    {job.company.logo ? (
                                      <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Building2 className="h-8 w-8 text-neutral-400" />
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-grow space-y-1.5">
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                    <h3 className="text-lg font-medium">{job.title}</h3>
                                    {getApplicationStatusBadge(application.status)}
                                  </div>
                                  
                                  <div className="text-base font-medium">{job.company.name}</div>
                                  
                                  <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{job.location}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Applied on {formatDate(application.appliedDate)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>Last updated {getRelativeTime(application.lastUpdated)}</span>
                                    </div>
                                  </div>
                                  
                                  {application.interviewScheduled && (
                                    <div className="mt-2 flex items-center gap-2 text-sm bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-3 py-1.5 rounded">
                                      <Calendar className="h-4 w-4" />
                                      <span>Interview scheduled for {formatDate(application.interviewScheduled)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="active" className="mt-4">
                    <div className="space-y-4">
                      {applications
                        .filter(app => ['applied', 'screening', 'interview', 'offer'].includes(app.status))
                        .map(application => {
                          const job = getJobForApplication(application);
                          if (!job) return null;
                          
                          return (
                            <Card
                              key={application.id}
                              className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                              onClick={() => handleOpenApplicationDetails(application)}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                      {job.company.logo ? (
                                        <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Building2 className="h-8 w-8 text-neutral-400" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-grow space-y-1.5">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                      <h3 className="text-lg font-medium">{job.title}</h3>
                                      {getApplicationStatusBadge(application.status)}
                                    </div>
                                    
                                    <div className="text-base font-medium">{job.company.name}</div>
                                    
                                    <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{job.location}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Applied on {formatDate(application.appliedDate)}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Last updated {getRelativeTime(application.lastUpdated)}</span>
                                      </div>
                                    </div>
                                    
                                    {application.interviewScheduled && (
                                      <div className="mt-2 flex items-center gap-2 text-sm bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-3 py-1.5 rounded">
                                        <Calendar className="h-4 w-4" />
                                        <span>Interview scheduled for {formatDate(application.interviewScheduled)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        
                        {applications.filter(app => ['applied', 'screening', 'interview', 'offer'].includes(app.status)).length === 0 && (
                          <div className="text-center py-8">
                            <FileText className="mx-auto h-12 w-12 text-neutral-300" />
                            <h3 className="mt-4 text-lg font-medium">No active applications</h3>
                            <p className="mt-2 text-neutral-500">
                              You don't have any active job applications at this time.
                            </p>
                            <Button
                              className="mt-4"
                              onClick={() => setViewMode('board')}
                            >
                              Browse Jobs
                            </Button>
                          </div>
                        )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="archived" className="mt-4">
                    <div className="space-y-4">
                      {applications
                        .filter(app => ['accepted', 'rejected', 'withdrawn'].includes(app.status))
                        .map(application => {
                          const job = getJobForApplication(application);
                          if (!job) return null;
                          
                          return (
                            <Card
                              key={application.id}
                              className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                              onClick={() => handleOpenApplicationDetails(application)}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                      {job.company.logo ? (
                                        <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Building2 className="h-8 w-8 text-neutral-400" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-grow space-y-1.5">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                      <h3 className="text-lg font-medium">{job.title}</h3>
                                      {getApplicationStatusBadge(application.status)}
                                    </div>
                                    
                                    <div className="text-base font-medium">{job.company.name}</div>
                                    
                                    <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{job.location}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Applied on {formatDate(application.appliedDate)}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Last updated {getRelativeTime(application.lastUpdated)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        
                        {applications.filter(app => ['accepted', 'rejected', 'withdrawn'].includes(app.status)).length === 0 && (
                          <div className="text-center py-8">
                            <FileText className="mx-auto h-12 w-12 text-neutral-300" />
                            <h3 className="mt-4 text-lg font-medium">No archived applications</h3>
                            <p className="mt-2 text-neutral-500">
                              You don't have any completed or archived job applications.
                            </p>
                          </div>
                        )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium">No applications yet</h3>
                <p className="mt-2 text-neutral-500">
                  You haven't applied for any jobs yet. Browse jobs to get started.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setViewMode('board')}
                >
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Job Details Dialog */}
      <Dialog open={openDialog === 'jobDetails'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto p-0">
          {selectedJob && (
            <>
              <div className="h-28 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center relative">
                <div className="absolute -bottom-12 left-6 w-24 h-24 rounded-md bg-white dark:bg-black shadow-md flex items-center justify-center overflow-hidden border-4 border-white dark:border-black">
                  {selectedJob.company.logo ? (
                    <img src={selectedJob.company.logo} alt={selectedJob.company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-12 w-12 text-neutral-400" />
                  )}
                </div>
              </div>
              
              <div className="px-6 pt-16 pb-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                    <div className="text-lg mt-1">{selectedJob.company.name}</div>
                    
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedJob.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatSalaryRange(selectedJob.salary)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {getRelativeTime(selectedJob.datePosted)}</span>
                      </div>
                      
                      {selectedJob.applicationDeadline && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Apply by {formatDate(selectedJob.applicationDeadline)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-sm">
                        {selectedJob.jobType.replace('-', ' ')}
                      </Badge>
                      
                      <Badge variant="outline" className="text-sm">
                        {selectedJob.experienceLevel.charAt(0).toUpperCase() + selectedJob.experienceLevel.slice(1)} Level
                      </Badge>
                      
                      {selectedJob.remoteOption && (
                        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                          Remote Option
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <Button
                      className="w-full md:w-auto"
                      disabled={hasAppliedForJob(selectedJob.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDialog('apply');
                      }}
                    >
                      {hasAppliedForJob(selectedJob.id) ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Apply Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Job Description</h3>
                      <div className="prose max-w-none dark:prose-invert">
                        <p className="whitespace-pre-line">{selectedJob.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((requirement, index) => (
                          <li key={index} className="flex gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Responsibilities</h3>
                      <ul className="space-y-2">
                        {selectedJob.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Benefits</h3>
                      <ul className="space-y-2">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index} className="flex gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Industry</div>
                          <div>{selectedJob.company.industry}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Company Size</div>
                          <div>{selectedJob.company.size} employees</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Website</div>
                          <a 
                            href={selectedJob.company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {selectedJob.company.website.replace(/^https?:\/\//, '')}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">About</div>
                          <p className="mt-1 text-sm">{selectedJob.company.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-neutral-500" />
                          <span>{selectedJob.contactEmail}</span>
                        </div>
                        
                        {selectedJob.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-neutral-500" />
                            <span>{selectedJob.contactPhone}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Job Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-neutral-500" />
                            <span>Applicants</span>
                          </div>
                          <Badge variant="outline">{selectedJob.applicants}</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-neutral-500" />
                            <span>Views</span>
                          </div>
                          <Badge variant="outline">{selectedJob.views}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="px-6 py-4 border-t">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-1 text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Posted on {formatDate(selectedJob.datePosted)}</span>
                  </div>
                  
                  <Button
                    disabled={hasAppliedForJob(selectedJob.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDialog('apply');
                    }}
                  >
                    {hasAppliedForJob(selectedJob.id) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Applied
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Apply Now
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Apply for Job Dialog */}
      <Dialog open={openDialog === 'apply'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>Apply for {selectedJob.title}</DialogTitle>
                <DialogDescription>
                  Complete your application for {selectedJob.company.name}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume/CV</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="border rounded-md p-3 bg-neutral-50 dark:bg-neutral-900">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Label htmlFor="resume" className="flex items-center justify-center gap-2 text-sm cursor-pointer p-4 border border-dashed rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <Upload className="h-4 w-4" />
                        {applicationForm.resumeFile ? (
                          <span>{applicationForm.resumeFile.name}</span>
                        ) : (
                          <span>Upload your resume (PDF, DOC, DOCX)</span>
                        )}
                      </Label>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        Your resume will be used for this application and future jobs.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm({...applicationForm, coverLetter: e.target.value})}
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Application Tips</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1 list-disc list-inside">
                        <li>Tailor your resume to highlight relevant experience</li>
                        <li>Include specific achievements and metrics</li>
                        <li>Address the job requirements in your cover letter</li>
                        <li>Proofread your application before submitting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog('jobDetails')}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApplyForJob}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Application Details Dialog */}
      <Dialog open={openDialog === 'applicationDetails'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedApplication && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle>Application Status</DialogTitle>
                    <DialogDescription>
                      Track your application progress
                    </DialogDescription>
                  </div>
                  {getApplicationStatusBadge(selectedApplication.status)}
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Job Info */}
                {(() => {
                  const job = getJobForApplication(selectedApplication);
                  if (!job) return null;
                  
                  return (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                          {job.company.logo ? (
                            <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-8 w-8 text-neutral-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">{job.title}</h3>
                        <div className="text-base font-medium">{job.company.name}</div>
                        
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatSalaryRange(job.salary)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            setSelectedJob(job);
                            setOpenDialog('jobDetails');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Job
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                
                <Separator />
                
                {/* Application Timeline */}
                <div>
                  <h3 className="font-medium mb-4">Application Timeline</h3>
                  
                  <div className="space-y-8">
                    <div className="relative pl-6 border-l-2 border-green-500">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-green-500"></div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(selectedApplication.appliedDate)}
                      </div>
                      <div className="font-medium">Application Submitted</div>
                      <div className="text-sm mt-1">
                        Your application has been received by {getJobForApplication(selectedApplication)?.company.name}.
                      </div>
                    </div>
                    
                    {selectedApplication.status === 'screening' && (
                      <div className="relative pl-6 border-l-2 border-purple-500">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(selectedApplication.lastUpdated)}
                        </div>
                        <div className="font-medium">Application Under Review</div>
                        <div className="text-sm mt-1">
                          Your application is being reviewed by the hiring team.
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.status === 'interview' && (
                      <>
                        <div className="relative pl-6 border-l-2 border-purple-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {/* Use a date before the interview date */}
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Application Under Review</div>
                          <div className="text-sm mt-1">
                            Your application was reviewed by the hiring team.
                          </div>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-amber-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-amber-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(selectedApplication.lastUpdated)}
                          </div>
                          <div className="font-medium">Interview Scheduled</div>
                          <div className="text-sm mt-1">
                            {selectedApplication.interviewScheduled ? (
                              <>
                                Your interview is scheduled for {formatDate(selectedApplication.interviewScheduled)}.
                                {selectedApplication.notes && (
                                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded text-amber-800 dark:text-amber-300">
                                    {selectedApplication.notes}
                                  </div>
                                )}
                              </>
                            ) : (
                              'You have been selected for an interview. Check your email for details.'
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedApplication.status === 'offer' && (
                      <>
                        <div className="relative pl-6 border-l-2 border-purple-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 7 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Application Under Review</div>
                          <div className="text-sm mt-1">
                            Your application was reviewed by the hiring team.
                          </div>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-amber-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-amber-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Interview Completed</div>
                          <div className="text-sm mt-1">
                            You completed your interview with the hiring team.
                          </div>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-green-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-green-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(selectedApplication.lastUpdated)}
                          </div>
                          <div className="font-medium">Offer Extended</div>
                          <div className="text-sm mt-1">
                            Congratulations! You've received a job offer. Check your email for details.
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedApplication.status === 'rejected' && (
                      <>
                        {selectedApplication.notes && selectedApplication.notes.includes('screening') ? (
                          <div className="relative pl-6 border-l-2 border-purple-500">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000))}
                            </div>
                            <div className="font-medium">Application Under Review</div>
                            <div className="text-sm mt-1">
                              Your application was reviewed by the hiring team.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative pl-6 border-l-2 border-purple-500">
                              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 7 * 24 * 60 * 60 * 1000))}
                              </div>
                              <div className="font-medium">Application Under Review</div>
                              <div className="text-sm mt-1">
                                Your application was reviewed by the hiring team.
                              </div>
                            </div>
                            
                            <div className="relative pl-6 border-l-2 border-amber-500">
                              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-amber-500"></div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000))}
                              </div>
                              <div className="font-medium">Interview Completed</div>
                              <div className="text-sm mt-1">
                                You completed your interview with the hiring team.
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="relative pl-6 border-l-2 border-red-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-red-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(selectedApplication.lastUpdated)}
                          </div>
                          <div className="font-medium">Application Not Selected</div>
                          <div className="text-sm mt-1">
                            {selectedApplication.feedback ? selectedApplication.feedback : 
                              "Thank you for your interest. While your qualifications are impressive, we've decided to pursue other candidates whose experiences more closely align with our current needs."}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedApplication.status === 'accepted' && (
                      <>
                        <div className="relative pl-6 border-l-2 border-purple-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 10 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Application Under Review</div>
                          <div className="text-sm mt-1">
                            Your application was reviewed by the hiring team.
                          </div>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-amber-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-amber-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 7 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Interview Completed</div>
                          <div className="text-sm mt-1">
                            You completed your interview with the hiring team.
                          </div>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-green-500">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-green-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(new Date(selectedApplication.lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000))}
                          </div>
                          <div className="font-medium">Offer Extended</div>
                          <div className="text-sm mt-1">
                            You received a job offer.
                          </div>
                        </div>
                        
                        <div className="relative pl-6">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-emerald-500"></div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(selectedApplication.lastUpdated)}
                          </div>
                          <div className="font-medium">Offer Accepted</div>
                          <div className="text-sm mt-1">
                            Congratulations! You've accepted the job offer. The hiring team will be in touch with next steps.
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedApplication.status === 'withdrawn' && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-neutral-500"></div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(selectedApplication.lastUpdated)}
                        </div>
                        <div className="font-medium">Application Withdrawn</div>
                        <div className="text-sm mt-1">
                          You've withdrawn your application for this position.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Application Details */}
                <div>
                  <h3 className="font-medium mb-4">Application Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Applied On</div>
                      <div>{formatDate(selectedApplication.appliedDate)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Last Updated</div>
                      <div>{formatDate(selectedApplication.lastUpdated)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Resume</div>
                    <div className="mt-1">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Resume
                      </Button>
                    </div>
                  </div>
                  
                  {selectedApplication.coverLetter && (
                    <div className="mt-4">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Cover Letter</div>
                      <div className="mt-1 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md text-sm">
                        {selectedApplication.coverLetter}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                {selectedApplication.status === 'applied' || selectedApplication.status === 'screening' ? (
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950">
                    Withdraw Application
                  </Button>
                ) : null}
                
                <Button onClick={() => setOpenDialog(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}