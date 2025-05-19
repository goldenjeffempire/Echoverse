import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Video,
  MapPin,
  Phone,
  User,
  Mail,
  CalendarDays,
  Clock3,
  ArrowRight,
  CheckCircle2,
  Info,
  Globe2,
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Filter,
  ClipboardCheck,
  Repeat,
  CalendarRange,
  Lock,
  Settings,
  PencilIcon
} from 'lucide-react';
import { addDays, addMonths, format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, getDay, subDays, addWeeks, startOfMonth, endOfMonth, isSameMonth, isToday, parseISO, isBefore } from 'date-fns';
import { format as formatTz } from 'date-fns-tz';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
type BookingDuration = 15 | 30 | 45 | 60 | 90 | 120;
type BookingLocationTypes = 'virtual' | 'inPerson' | 'phone';
type BookingStatus = 'scheduled' | 'cancelled' | 'completed' | 'noShow' | 'pending';
type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface Location {
  type: BookingLocationTypes;
  details: string;
}

interface AvailabilitySchedule {
  id: string;
  name: string;
  timeZone: string;
  daysAvailable: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  hoursAvailable: {
    startTime: string; // 24-hour format 'HH:MM'
    endTime: string; // 24-hour format 'HH:MM'
  };
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

interface BookingType {
  id: string;
  name: string;
  description: string;
  duration: BookingDuration;
  location: Location;
  availabilityScheduleId: string;
  color: string;
  maxParticipants: number;
  requiresApproval: boolean;
  customQuestions: {
    id: string;
    question: string;
    required: boolean;
    type: 'text' | 'longText' | 'singleChoice' | 'multipleChoice';
    options?: string[];
  }[];
}

interface BookingParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  responses?: {
    questionId: string;
    answer: string | string[];
  }[];
}

interface Booking {
  id: string;
  typeId: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  title: string;
  participants: BookingParticipant[];
  hostId: string;
  location: Location;
  status: BookingStatus;
  notes?: string;
  recurrence: {
    pattern: RecurrencePattern;
    interval: number;
    count?: number;
    until?: Date;
  };
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BookableSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

interface Host {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  availabilitySchedules: AvailabilitySchedule[];
  bookingTypes: BookingType[];
}

// Mock data
const mockHosts: Host[] = [
  {
    id: 'host1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: 'Senior Consultant',
    availabilitySchedules: [
      {
        id: 'schedule1',
        name: 'Standard Work Hours',
        timeZone: 'America/New_York',
        daysAvailable: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        hoursAvailable: {
          startTime: '09:00',
          endTime: '17:00'
        },
        bufferBefore: 15,
        bufferAfter: 15
      },
      {
        id: 'schedule2',
        name: 'Evening Hours',
        timeZone: 'America/New_York',
        daysAvailable: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        hoursAvailable: {
          startTime: '17:00',
          endTime: '20:00'
        },
        bufferBefore: 15,
        bufferAfter: 15
      }
    ],
    bookingTypes: [
      {
        id: 'type1',
        name: 'Initial Consultation',
        description: 'A 30-minute consultation to discuss your needs and how we can help.',
        duration: 30,
        location: {
          type: 'virtual',
          details: 'Zoom meeting'
        },
        availabilityScheduleId: 'schedule1',
        color: '#4f46e5',
        maxParticipants: 1,
        requiresApproval: false,
        customQuestions: [
          {
            id: 'q1',
            question: 'What specific topics would you like to discuss?',
            required: true,
            type: 'text'
          },
          {
            id: 'q2',
            question: 'How did you hear about us?',
            required: false,
            type: 'singleChoice',
            options: ['Search Engine', 'Social Media', 'Referral', 'Other']
          }
        ]
      },
      {
        id: 'type2',
        name: 'Full Consultation',
        description: 'A comprehensive 60-minute consultation to discuss your project in detail.',
        duration: 60,
        location: {
          type: 'virtual',
          details: 'Google Meet'
        },
        availabilityScheduleId: 'schedule1',
        color: '#0ea5e9',
        maxParticipants: 3,
        requiresApproval: true,
        customQuestions: [
          {
            id: 'q3',
            question: 'Please describe your project:',
            required: true,
            type: 'longText'
          },
          {
            id: 'q4',
            question: 'What are your main goals for this consultation?',
            required: true,
            type: 'text'
          }
        ]
      },
      {
        id: 'type3',
        name: 'Evening Mentoring',
        description: 'After-hours mentoring session (45 minutes).',
        duration: 45,
        location: {
          type: 'virtual',
          details: 'Zoom meeting'
        },
        availabilityScheduleId: 'schedule2',
        color: '#8b5cf6',
        maxParticipants: 1,
        requiresApproval: false,
        customQuestions: []
      }
    ]
  },
  {
    id: 'host2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    title: 'Product Specialist',
    availabilitySchedules: [
      {
        id: 'schedule3',
        name: 'Product Demo Hours',
        timeZone: 'America/Los_Angeles',
        daysAvailable: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        hoursAvailable: {
          startTime: '10:00',
          endTime: '16:00'
        },
        bufferBefore: 10,
        bufferAfter: 10
      }
    ],
    bookingTypes: [
      {
        id: 'type4',
        name: 'Product Demo',
        description: 'A 45-minute demonstration of our product features.',
        duration: 45,
        location: {
          type: 'virtual',
          details: 'Zoom meeting'
        },
        availabilityScheduleId: 'schedule3',
        color: '#0d9488',
        maxParticipants: 5,
        requiresApproval: false,
        customQuestions: [
          {
            id: 'q5',
            question: 'Which specific features are you interested in?',
            required: false,
            type: 'multipleChoice',
            options: ['Feature A', 'Feature B', 'Feature C', 'Integration Options']
          }
        ]
      },
      {
        id: 'type5',
        name: 'Technical Support',
        description: 'One-on-one technical support session.',
        duration: 30,
        location: {
          type: 'phone',
          details: 'We will call you at the provided number'
        },
        availabilityScheduleId: 'schedule3',
        color: '#f59e0b',
        maxParticipants: 1,
        requiresApproval: false,
        customQuestions: [
          {
            id: 'q6',
            question: 'Please describe the issue you are experiencing:',
            required: true,
            type: 'longText'
          },
          {
            id: 'q7',
            question: 'What is your phone number?',
            required: true,
            type: 'text'
          }
        ]
      }
    ]
  }
];

const mockBookings: Booking[] = [
  {
    id: 'booking1',
    typeId: 'type1',
    startTime: new Date('2025-05-20T13:00:00'),
    endTime: new Date('2025-05-20T13:30:00'),
    timeZone: 'America/New_York',
    title: 'Initial Consultation with John Doe',
    participants: [
      {
        id: 'participant1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        responses: [
          {
            questionId: 'q1',
            answer: 'I need help with project planning and resource allocation.'
          },
          {
            questionId: 'q2',
            answer: 'Referral'
          }
        ]
      }
    ],
    hostId: 'host1',
    location: {
      type: 'virtual',
      details: 'Zoom meeting'
    },
    status: 'scheduled',
    recurrence: {
      pattern: 'none',
      interval: 0
    },
    reminderSent: false,
    createdAt: new Date('2025-05-15T10:25:00'),
    updatedAt: new Date('2025-05-15T10:25:00')
  },
  {
    id: 'booking2',
    typeId: 'type2',
    startTime: new Date('2025-05-22T10:00:00'),
    endTime: new Date('2025-05-22T11:00:00'),
    timeZone: 'America/New_York',
    title: 'Full Consultation with ABC Corp',
    participants: [
      {
        id: 'participant2',
        name: 'Jane Smith',
        email: 'jane.smith@abccorp.com',
        responses: [
          {
            questionId: 'q3',
            answer: 'We need to upgrade our content management system and improve our workflow efficiency.'
          },
          {
            questionId: 'q4',
            answer: 'To understand implementation timeframes and resource requirements.'
          }
        ]
      },
      {
        id: 'participant3',
        name: 'Robert Johnson',
        email: 'robert.johnson@abccorp.com'
      }
    ],
    hostId: 'host1',
    location: {
      type: 'virtual',
      details: 'Google Meet'
    },
    status: 'scheduled',
    recurrence: {
      pattern: 'weekly',
      interval: 1,
      count: 4
    },
    reminderSent: true,
    createdAt: new Date('2025-05-10T14:32:00'),
    updatedAt: new Date('2025-05-12T09:15:00')
  },
  {
    id: 'booking3',
    typeId: 'type4',
    startTime: new Date('2025-05-21T14:00:00'),
    endTime: new Date('2025-05-21T14:45:00'),
    timeZone: 'America/Los_Angeles',
    title: 'Product Demo for XYZ Inc',
    participants: [
      {
        id: 'participant4',
        name: 'Lisa Chen',
        email: 'lisa.chen@xyzinc.com',
        responses: [
          {
            questionId: 'q5',
            answer: ['Feature A', 'Integration Options']
          }
        ]
      },
      {
        id: 'participant5',
        name: 'David Miller',
        email: 'david.miller@xyzinc.com'
      },
      {
        id: 'participant6',
        name: 'Amanda Wong',
        email: 'amanda.wong@xyzinc.com'
      }
    ],
    hostId: 'host2',
    location: {
      type: 'virtual',
      details: 'Zoom meeting'
    },
    status: 'scheduled',
    recurrence: {
      pattern: 'none',
      interval: 0
    },
    reminderSent: false,
    createdAt: new Date('2025-05-16T11:45:00'),
    updatedAt: new Date('2025-05-16T11:45:00')
  },
  {
    id: 'booking4',
    typeId: 'type5',
    startTime: new Date('2025-05-19T11:00:00'),
    endTime: new Date('2025-05-19T11:30:00'),
    timeZone: 'America/Los_Angeles',
    title: 'Technical Support for Emily Taylor',
    participants: [
      {
        id: 'participant7',
        name: 'Emily Taylor',
        email: 'emily.taylor@example.com',
        phone: '+1 (555) 123-4567',
        responses: [
          {
            questionId: 'q6',
            answer: 'I cannot sync my data between devices. The sync process starts but never completes.'
          },
          {
            questionId: 'q7',
            answer: '+1 (555) 123-4567'
          }
        ]
      }
    ],
    hostId: 'host2',
    location: {
      type: 'phone',
      details: 'We will call you at the provided number'
    },
    status: 'completed',
    recurrence: {
      pattern: 'none',
      interval: 0
    },
    reminderSent: true,
    createdAt: new Date('2025-05-17T16:20:00'),
    updatedAt: new Date('2025-05-19T12:00:00')
  },
  {
    id: 'booking5',
    typeId: 'type3',
    startTime: new Date('2025-05-23T18:00:00'),
    endTime: new Date('2025-05-23T18:45:00'),
    timeZone: 'America/New_York',
    title: 'Evening Mentoring with Carlos Diaz',
    participants: [
      {
        id: 'participant8',
        name: 'Carlos Diaz',
        email: 'carlos.diaz@example.com'
      }
    ],
    hostId: 'host1',
    location: {
      type: 'virtual',
      details: 'Zoom meeting'
    },
    status: 'scheduled',
    recurrence: {
      pattern: 'biweekly',
      interval: 1,
      until: new Date('2025-07-18T18:45:00')
    },
    reminderSent: false,
    createdAt: new Date('2025-05-18T09:30:00'),
    updatedAt: new Date('2025-05-18T09:30:00')
  }
];

// Time slots generation
const generateTimeSlots = (date: Date, schedules: AvailabilitySchedule[], bookingDuration: number): BookableSlot[] => {
  // This is simplified; in a real app, you'd need more complex logic to handle
  // timezone conversions, buffer time, existing bookings, etc.
  const slots: BookableSlot[] = [];
  const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
  
  // Map day index to day name
  const dayMap: Record<number, keyof AvailabilitySchedule['daysAvailable']> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  schedules.forEach(schedule => {
    const dayName = dayMap[dayOfWeek];
    if (schedule.daysAvailable[dayName]) {
      // Convert time strings to Date objects for the specified date
      const [startHour, startMinute] = schedule.hoursAvailable.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.hoursAvailable.endTime.split(':').map(Number);
      
      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Generate slots with the specified duration
      let currentSlotStart = new Date(startTime);
      while (currentSlotStart.getTime() + bookingDuration * 60 * 1000 <= endTime.getTime()) {
        const slotEnd = new Date(currentSlotStart.getTime() + bookingDuration * 60 * 1000);
        
        slots.push({
          startTime: currentSlotStart,
          endTime: slotEnd,
          available: true // In a real app, check against existing bookings
        });
        
        // Move to next slot
        currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000); // 30-minute increments
      }
    }
  });
  
  return slots;
};

export default function BookingSystem() {
  const [hosts, setHosts] = useState<Host[]>(mockHosts);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookableSlot | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<Partial<BookingParticipant>>({
    name: '',
    email: '',
    phone: '',
    responses: []
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUserTimeZone, setSelectedUserTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [responseValues, setResponseValues] = useState<{[key: string]: string | string[]}>({});
  const [openDialogs, setOpenDialogs] = useState({
    newBooking: false,
    bookingDetails: false,
    editBooking: false,
    cancelBooking: false,
    confirmBooking: false
  });
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  
  const { toast } = useToast();

  // Initialize with first host on load
  useEffect(() => {
    if (hosts.length > 0 && !selectedHost) {
      setSelectedHost(hosts[0]);
    }
  }, [hosts, selectedHost]);

  // Get timezone options
  const getTimeZoneOptions = (): string[] => {
    // This is a subset of timezones for the example
    return [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
  };

  // Format date for display
  const formatDate = (date: Date, timezone: string = selectedUserTimeZone): string => {
    // Use regular date-fns format
    return format(date, 'MMMM d, yyyy');
  };

  // Format time for display
  const formatTime = (date: Date, timezone: string = selectedUserTimeZone): string => {
    // Use regular date-fns format
    return format(date, 'h:mm a');
  };

  // Format date and time for display
  const formatDateTime = (date: Date, timezone: string = selectedUserTimeZone): string => {
    // Use regular date-fns format
    return format(date, 'MMMM d, yyyy h:mm a');
  };

  // Get day of week name
  const getDayName = (date: Date, format: 'short' | 'long' = 'long'): string => {
    return new Intl.DateTimeFormat('en-US', { weekday: format }).format(date);
  };

  // Go to previous month in calendar
  const previousMonth = (): void => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
  };

  // Go to next month in calendar
  const nextMonth = (): void => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Get calendar days for month view
  const getCalendarDays = (): Date[] => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    
    const days: Date[] = [];
    let day = new Date(start);
    
    while (day <= end) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    
    return days;
  };

  // Get week days for week view
  const getWeekDays = (startDate: Date): Date[] => {
    const start = startOfWeek(startDate);
    const days: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    
    return days;
  };

  // Go to previous week in calendar
  const previousWeek = (): void => {
    setSelectedDate(prevDate => addWeeks(prevDate, -1));
  };

  // Go to next week in calendar
  const nextWeek = (): void => {
    setSelectedDate(prevDate => addWeeks(prevDate, 1));
  };

  // Go to previous day in calendar
  const previousDay = (): void => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  // Go to next day in calendar
  const nextDay = (): void => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  // Check if a date has any bookings
  const hasBookingsOnDate = (date: Date, hostId: string): boolean => {
    return bookings.some(booking => 
      booking.hostId === hostId && 
      isSameDay(booking.startTime, date) &&
      booking.status === 'scheduled'
    );
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date, hostId: string): Booking[] => {
    return bookings.filter(booking => 
      booking.hostId === hostId && 
      isSameDay(booking.startTime, date) &&
      booking.status === 'scheduled'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  // Get time slots for booking
  const getAvailableTimeSlots = async (date: Date, hostId: string, typeId: string) => {
    setIsLoadingTimeSlots(true);
    
    try {
      // In a real app, you would make an API call here
      // const response = await apiRequest('GET', `/api/availability/${hostId}/${typeId}?date=${date.toISOString()}`);
      
      const host = hosts.find(h => h.id === hostId);
      const bookingType = host?.bookingTypes.find(t => t.id === typeId);
      
      if (!host || !bookingType) {
        throw new Error('Host or booking type not found');
      }
      
      const schedule = host.availabilitySchedules.find(s => s.id === bookingType.availabilityScheduleId);
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const slots = generateTimeSlots(date, [schedule], bookingType.duration);
      
      // Filter out slots that overlap with existing bookings
      const existingBookings = bookings.filter(booking => 
        booking.hostId === hostId && 
        isSameDay(booking.startTime, date) &&
        booking.status === 'scheduled'
      );
      
      const availableSlots = slots.filter(slot => {
        // Check if slot overlaps with any existing booking
        return !existingBookings.some(booking => 
          (slot.startTime >= booking.startTime && slot.startTime < booking.endTime) ||
          (slot.endTime > booking.startTime && slot.endTime <= booking.endTime) ||
          (slot.startTime <= booking.startTime && slot.endTime >= booking.endTime)
        );
      });
      
      return availableSlots;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // Handle booking type selection
  const handleBookingTypeSelect = async (bookingType: BookingType) => {
    setSelectedBookingType(bookingType);
    setSelectedTimeSlot(null);
    
    if (selectedHost && selectedDate) {
      const slots = await getAvailableTimeSlots(selectedDate, selectedHost.id, bookingType.id);
      // We don't set slots directly in state here, but the function will update loading state and fetch them later
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookableSlot) => {
    setSelectedTimeSlot(slot);
  };

  // Handle participant details change
  const handleParticipantDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParticipantDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle response change
  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponseValues(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle booking creation
  const handleCreateBooking = async () => {
    if (!selectedHost || !selectedBookingType || !selectedTimeSlot) {
      toast({
        title: 'Missing Information',
        description: 'Please select a booking type, date, and time slot.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!participantDetails.name || !participantDetails.email) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and email.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for required custom questions
    const missingRequiredQuestions = selectedBookingType.customQuestions
      .filter(q => q.required && !responseValues[q.id]);
    
    if (missingRequiredQuestions.length > 0) {
      toast({
        title: 'Missing Information',
        description: `Please answer all required questions: ${missingRequiredQuestions.map(q => q.question).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreatingBooking(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest('POST', '/api/bookings', {
      //   hostId: selectedHost.id,
      //   typeId: selectedBookingType.id,
      //   startTime: selectedTimeSlot.startTime,
      //   endTime: selectedTimeSlot.endTime,
      //   participant: participantDetails,
      //   responses: Object.entries(responseValues).map(([questionId, answer]) => ({
      //     questionId,
      //     answer
      //   })),
      //   timeZone: selectedUserTimeZone
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a new booking
      const newBooking: Booking = {
        id: `booking${Date.now()}`,
        typeId: selectedBookingType.id,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        timeZone: selectedUserTimeZone,
        title: `${selectedBookingType.name} with ${participantDetails.name}`,
        participants: [
          {
            id: `participant${Date.now()}`,
            name: participantDetails.name || '',
            email: participantDetails.email || '',
            phone: participantDetails.phone,
            responses: Object.entries(responseValues).map(([questionId, answer]) => ({
              questionId,
              answer
            }))
          }
        ],
        hostId: selectedHost.id,
        location: selectedBookingType.location,
        status: 'scheduled',
        recurrence: {
          pattern: 'none',
          interval: 0
        },
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to bookings list
      setBookings([...bookings, newBooking]);
      
      // Reset form
      setSelectedBookingType(null);
      setSelectedTimeSlot(null);
      setParticipantDetails({
        name: '',
        email: '',
        phone: '',
        responses: []
      });
      setResponseValues({});
      
      // Show confirmation dialog
      setOpenDialogs({
        ...openDialogs,
        newBooking: false,
        confirmBooking: true
      });
      
      toast({
        title: 'Booking Confirmed',
        description: 'Your booking has been confirmed. You will receive an email confirmation shortly.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    try {
      // In a real app, this would be an API call
      // await apiRequest('POST', `/api/bookings/${bookingId}/cancel`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update booking status
      const updatedBookings = bookings.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            status: 'cancelled' as BookingStatus,
            updatedAt: new Date()
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      
      // Close dialogs
      setOpenDialogs({
        ...openDialogs,
        cancelBooking: false,
        bookingDetails: false
      });
      
      setSelectedBooking(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Scheduled</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Completed</Badge>;
      case 'noShow':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">No Show</Badge>;
      default:
        return null;
    }
  };

  // Get location type icon
  const getLocationIcon = (locationType: BookingLocationTypes) => {
    switch (locationType) {
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'inPerson':
        return <MapPin className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get participant details for a booking
  const getParticipantDetails = (booking: Booking) => {
    if (booking.participants.length === 0) return null;
    
    const mainParticipant = booking.participants[0];
    
    return (
      <div className="space-y-1">
        <div className="font-medium">{mainParticipant.name}</div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">{mainParticipant.email}</div>
        {mainParticipant.phone && (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{mainParticipant.phone}</div>
        )}
        {booking.participants.length > 1 && (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            +{booking.participants.length - 1} more {booking.participants.length - 1 === 1 ? 'participant' : 'participants'}
          </div>
        )}
      </div>
    );
  };

  // Get recurrence pattern text
  const getRecurrenceText = (booking: Booking) => {
    if (booking.recurrence.pattern === 'none') return null;
    
    let text = '';
    
    switch (booking.recurrence.pattern) {
      case 'daily':
        text = 'Daily';
        break;
      case 'weekly':
        text = 'Weekly';
        break;
      case 'biweekly':
        text = 'Every 2 weeks';
        break;
      case 'monthly':
        text = 'Monthly';
        break;
    }
    
    if (booking.recurrence.interval > 1) {
      text += ` (every ${booking.recurrence.interval} `;
      
      switch (booking.recurrence.pattern) {
        case 'daily':
          text += `day${booking.recurrence.interval !== 1 ? 's' : ''})`;
          break;
        case 'weekly':
          text += `week${booking.recurrence.interval !== 1 ? 's' : ''})`;
          break;
        case 'biweekly':
          text += `2 weeks)`;
          break;
        case 'monthly':
          text += `month${booking.recurrence.interval !== 1 ? 's' : ''})`;
          break;
      }
    }
    
    if (booking.recurrence.count) {
      text += `, ${booking.recurrence.count} occurrences`;
    } else if (booking.recurrence.until) {
      text += `, until ${formatDate(booking.recurrence.until)}`;
    }
    
    return text;
  };

  // Start new booking process
  const startNewBooking = () => {
    setSelectedBookingType(null);
    setSelectedTimeSlot(null);
    setParticipantDetails({
      name: '',
      email: '',
      phone: '',
      responses: []
    });
    setResponseValues({});
    setOpenDialogs({
      ...openDialogs,
      newBooking: true
    });
  };

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setOpenDialogs({
      ...openDialogs,
      bookingDetails: true
    });
  };

  // Get booking type details
  const getBookingTypeDetails = (typeId: string) => {
    for (const host of hosts) {
      const bookingType = host.bookingTypes.find(type => type.id === typeId);
      if (bookingType) return bookingType;
    }
    return null;
  };

  // Event handler for responding to bookings
  const handleBookingResponse = async (bookingId: string, approved: boolean) => {
    try {
      // In a real app, this would be an API call
      // await apiRequest('POST', `/api/bookings/${bookingId}/respond`, { approved });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update booking status
      const updatedBookings = bookings.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            status: approved ? 'scheduled' : 'cancelled' as BookingStatus,
            updatedAt: new Date()
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      
      toast({
        title: approved ? 'Booking Approved' : 'Booking Declined',
        description: approved 
          ? 'The booking has been approved and the participant has been notified.' 
          : 'The booking has been declined.',
      });
      
      // Close dialog
      setOpenDialogs({
        ...openDialogs,
        bookingDetails: false
      });
      
      setSelectedBooking(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process booking response. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Booking System</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Schedule and manage appointments</p>
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <Select
              value={selectedUserTimeZone}
              onValueChange={setSelectedUserTimeZone}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Timezones</SelectLabel>
                  {getTimeZoneOptions().map(timezone => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2" onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}>
              {viewMode === 'calendar' ? (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="hidden md:inline">List View</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span className="hidden md:inline">Calendar View</span>
                </>
              )}
            </Button>
            
            <Button onClick={startNewBooking} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">New Booking</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="myBookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="myBookings">My Bookings</TabsTrigger>
            <TabsTrigger value="calendar">Booking Calendar</TabsTrigger>
            <TabsTrigger value="manage">Manage Availability</TabsTrigger>
          </TabsList>
          
          {/* My Bookings Tab */}
          <TabsContent value="myBookings">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.status === 'scheduled' && booking.startTime > new Date())
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                    .map(booking => {
                      const bookingType = getBookingTypeDetails(booking.typeId);
                      const host = hosts.find(h => h.id === booking.hostId);
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden cursor-pointer hover:border-primary transition-all" onClick={() => viewBookingDetails(booking)}>
                          <div className="h-2" style={{ backgroundColor: bookingType?.color || '#6366f1' }}></div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="text-base">{booking.title}</CardTitle>
                              {getStatusBadge(booking.status)}
                            </div>
                            <CardDescription className="flex items-center gap-1">
                              {getLocationIcon(booking.location.type)}
                              <span>{booking.location.details}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">Date & Time</div>
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-neutral-500" />
                                  <span>{formatDate(booking.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-neutral-500" />
                                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                                </div>
                                {getRecurrenceText(booking) && (
                                  <div className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-neutral-500" />
                                    <span className="text-sm">{getRecurrenceText(booking)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">Host</div>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {host?.avatar ? (
                                      <AvatarImage src={host.avatar} alt={host.name} />
                                    ) : (
                                      <AvatarFallback>{host?.name.charAt(0) || '?'}</AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>{host?.name || 'Unknown Host'}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {bookingType?.duration} minutes • {bookingType?.name}
                            </div>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  
                  {bookings.filter(booking => booking.status === 'scheduled' && booking.startTime > new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                      <h3 className="mt-4 text-lg font-medium">No upcoming bookings</h3>
                      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                        You don't have any scheduled bookings. Click "New Booking" to schedule one.
                      </p>
                      <Button onClick={startNewBooking} className="mt-4">
                        Schedule a Booking
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Past Bookings</CardTitle>
                <CardDescription>Your previous appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.startTime <= new Date() || booking.status !== 'scheduled')
                    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
                    .slice(0, 5) // Show only 5 most recent
                    .map(booking => {
                      const bookingType = getBookingTypeDetails(booking.typeId);
                      const host = hosts.find(h => h.id === booking.hostId);
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden cursor-pointer hover:border-primary transition-all" onClick={() => viewBookingDetails(booking)}>
                          <div className="h-2" style={{ backgroundColor: bookingType?.color || '#6366f1' }}></div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="text-base">{booking.title}</CardTitle>
                              {getStatusBadge(booking.status)}
                            </div>
                            <CardDescription className="flex items-center gap-1">
                              {getLocationIcon(booking.location.type)}
                              <span>{booking.location.details}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">Date & Time</div>
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-neutral-500" />
                                  <span>{formatDate(booking.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-neutral-500" />
                                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">Host</div>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {host?.avatar ? (
                                      <AvatarImage src={host.avatar} alt={host.name} />
                                    ) : (
                                      <AvatarFallback>{host?.name.charAt(0) || '?'}</AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>{host?.name || 'Unknown Host'}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  
                  {bookings.filter(booking => booking.startTime <= new Date() || booking.status !== 'scheduled').length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                      <h3 className="mt-4 text-lg font-medium">No past bookings</h3>
                      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                        You don't have any past bookings.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Booking Calendar</CardTitle>
                  <div className="flex gap-2">
                    <Select
                      value={selectedHost?.id}
                      onValueChange={(hostId) => setSelectedHost(hosts.find(h => h.id === hostId) || null)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select host" />
                      </SelectTrigger>
                      <SelectContent>
                        {hosts.map(host => (
                          <SelectItem key={host.id} value={host.id}>
                            {host.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={calendarView}
                      onValueChange={(value) => setCalendarView(value as 'day' | 'week' | 'month')}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  View and manage your booking schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calendarView === 'month' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={previousMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-medium py-2">
                          {day}
                        </div>
                      ))}
                      
                      {getCalendarDays().map(day => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        const hasBookings = selectedHost ? hasBookingsOnDate(day, selectedHost.id) : false;
                        
                        return (
                          <div
                            key={day.toString()}
                            className={`
                              min-h-[100px] border rounded-md p-1 ${isCurrentMonth ? '' : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600'}
                              ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                              ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-950' : ''}
                              cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800
                            `}
                            onClick={() => handleDateSelect(day)}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-sm ${isCurrentDay ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                                {format(day, 'd')}
                              </span>
                              {hasBookings && (
                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                            
                            {selectedHost && isCurrentMonth && (
                              <div className="space-y-1">
                                {getBookingsForDate(day, selectedHost.id).slice(0, 3).map(booking => {
                                  const bookingType = getBookingTypeDetails(booking.typeId);
                                  
                                  return (
                                    <div
                                      key={booking.id}
                                      className="text-xs p-1 rounded truncate"
                                      style={{ backgroundColor: bookingType?.color ? `${bookingType.color}20` : '#4f46e520' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewBookingDetails(booking);
                                      }}
                                    >
                                      {formatTime(booking.startTime)} {booking.participants[0]?.name}
                                    </div>
                                  );
                                })}
                                
                                {getBookingsForDate(day, selectedHost.id).length > 3 && (
                                  <div className="text-xs text-center text-neutral-500">
                                    +{getBookingsForDate(day, selectedHost.id).length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {calendarView === 'week' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-medium">
                        Week of {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
                      </h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={previousWeek}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextWeek}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {getWeekDays(selectedDate).map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentDay = isToday(day);
                        
                        return (
                          <div
                            key={day.toString()}
                            className={`
                              text-center py-2 rounded-md cursor-pointer
                              ${isSelected ? 'bg-primary text-white' : ''}
                              ${isCurrentDay && !isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}
                              ${!isSelected && !isCurrentDay ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''}
                            `}
                            onClick={() => handleDateSelect(day)}
                          >
                            <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                            <div className={`text-lg ${isCurrentDay && !isSelected ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                              {format(day, 'd')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="border rounded-md">
                      <div className="grid grid-cols-7 divide-x">
                        {getWeekDays(selectedDate).map(day => {
                          const dayBookings = selectedHost ? getBookingsForDate(day, selectedHost.id) : [];
                          
                          return (
                            <div
                              key={day.toString()}
                              className={`min-h-[400px] ${isSameDay(day, selectedDate) ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                            >
                              <div className="p-2 space-y-2">
                                {dayBookings.map(booking => {
                                  const bookingType = getBookingTypeDetails(booking.typeId);
                                  
                                  return (
                                    <div
                                      key={booking.id}
                                      className="p-2 rounded-md text-sm cursor-pointer hover:ring-2 hover:ring-primary"
                                      style={{ backgroundColor: bookingType?.color ? `${bookingType.color}20` : '#4f46e520' }}
                                      onClick={() => viewBookingDetails(booking)}
                                    >
                                      <div className="font-medium">
                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                      </div>
                                      <div className="truncate">{booking.participants[0]?.name}</div>
                                      <div className="text-xs text-neutral-500 truncate">{bookingType?.name}</div>
                                    </div>
                                  );
                                })}
                                
                                {dayBookings.length === 0 && (
                                  <div className="text-center text-sm text-neutral-500 p-2">
                                    No bookings
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {calendarView === 'day' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-medium">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={previousDay}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextDay}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="space-y-4">
                        {selectedHost ? (
                          <>
                            {getBookingsForDate(selectedDate, selectedHost.id).length > 0 ? (
                              getBookingsForDate(selectedDate, selectedHost.id).map(booking => {
                                const bookingType = getBookingTypeDetails(booking.typeId);
                                
                                return (
                                  <Card
                                    key={booking.id}
                                    className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                                    onClick={() => viewBookingDetails(booking)}
                                  >
                                    <div className="h-2" style={{ backgroundColor: bookingType?.color || '#6366f1' }}></div>
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between">
                                        <CardTitle className="text-base">{booking.title}</CardTitle>
                                        {getStatusBadge(booking.status)}
                                      </div>
                                      <CardDescription className="flex items-center gap-1">
                                        {getLocationIcon(booking.location.type)}
                                        <span>{booking.location.details}</span>
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                                      <div className="space-y-1">
                                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Time</div>
                                        <div className="flex items-center gap-2">
                                          <Clock3 className="h-4 w-4 text-neutral-500" />
                                          <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                                        </div>
                                        {bookingType && (
                                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {bookingType.duration} minutes • {bookingType.name}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Participant</div>
                                        {getParticipantDetails(booking)}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })
                            ) : (
                              <div className="text-center py-8">
                                <Calendar className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                                <h3 className="mt-4 text-lg font-medium">No bookings for this day</h3>
                                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                                  There are no bookings scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
                                </p>
                                <Button onClick={startNewBooking} className="mt-4">
                                  Create Booking
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                            <h3 className="mt-4 text-lg font-medium">No host selected</h3>
                            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                              Please select a host to view their booking calendar.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Manage Availability Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Manage Availability</CardTitle>
                  <Select
                    value={selectedHost?.id}
                    onValueChange={(hostId) => setSelectedHost(hosts.find(h => h.id === hostId) || null)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select host" />
                    </SelectTrigger>
                    <SelectContent>
                      {hosts.map(host => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>
                  Configure your availability and booking settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedHost ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Availability Schedules</h3>
                        <div className="space-y-4">
                          {selectedHost.availabilitySchedules.map(schedule => (
                            <Card key={schedule.id}>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">{schedule.name}</CardTitle>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8">
                                      <PencilIcon className="h-3.5 w-3.5 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                                <CardDescription>
                                  <div className="flex items-center gap-1">
                                    <Globe2 className="h-3.5 w-3.5" />
                                    {schedule.timeZone.replace(/_/g, ' ')}
                                  </div>
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="space-y-2">
                                  <div className="text-sm">Days Available</div>
                                  <div className="flex gap-1 flex-wrap">
                                    {Object.entries(schedule.daysAvailable).map(([day, available]) => (
                                      <Badge key={day} variant={available ? 'default' : 'outline'}>
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                      </Badge>
                                    ))}
                                  </div>
                                  
                                  <div className="text-sm mt-2">Hours Available</div>
                                  <div className="font-medium">
                                    {schedule.hoursAvailable.startTime} - {schedule.hoursAvailable.endTime}
                                  </div>
                                  
                                  <div className="text-sm mt-2">Buffer Time</div>
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <span className="font-medium">{schedule.bufferBefore}</span> minutes before
                                    </div>
                                    <div>
                                      <span className="font-medium">{schedule.bufferAfter}</span> minutes after
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Availability Schedule
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Booking Types</h3>
                        <div className="space-y-4">
                          {selectedHost.bookingTypes.map(bookingType => (
                            <Card key={bookingType.id} className="overflow-hidden">
                              <div className="h-2" style={{ backgroundColor: bookingType.color }}></div>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">{bookingType.name}</CardTitle>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8">
                                      <PencilIcon className="h-3.5 w-3.5 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                                <CardDescription>{bookingType.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Duration</div>
                                    <div className="font-medium">
                                      {bookingType.duration} minutes
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Location</div>
                                    <div className="font-medium flex items-center gap-1">
                                      {getLocationIcon(bookingType.location.type)}
                                      <span>{bookingType.location.details}</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Max Participants</div>
                                    <div className="font-medium">
                                      {bookingType.maxParticipants}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Approval</div>
                                    <div className="font-medium">
                                      {bookingType.requiresApproval ? 'Required' : 'Not Required'}
                                    </div>
                                  </div>
                                </div>
                                
                                {bookingType.customQuestions.length > 0 && (
                                  <div className="mt-4">
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Custom Questions</div>
                                    <div className="text-sm mt-1">
                                      {bookingType.customQuestions.length} question{bookingType.customQuestions.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          
                          <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Booking Type
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Email Notifications</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive email notifications for new bookings</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">SMS Reminders</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Send SMS reminders to participants</p>
                              </div>
                              <Switch />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Calendar Integration</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Sync with external calendars</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Appointment Reminders</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Send reminders before appointments</p>
                              </div>
                              <Select defaultValue="60">
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="15">15 minutes</SelectItem>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="60">1 hour</SelectItem>
                                  <SelectItem value="120">2 hours</SelectItem>
                                  <SelectItem value="1440">1 day</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Allow Cancellations</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Let participants cancel bookings</p>
                              </div>
                              <Select defaultValue="24">
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Up to 1 hour</SelectItem>
                                  <SelectItem value="3">Up to 3 hours</SelectItem>
                                  <SelectItem value="24">Up to 24 hours</SelectItem>
                                  <SelectItem value="48">Up to 48 hours</SelectItem>
                                  <SelectItem value="0">Not allowed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Default Visibility</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Control who can book appointments</p>
                              </div>
                              <Select defaultValue="public">
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="public">Public</SelectItem>
                                  <SelectItem value="private">Private</SelectItem>
                                  <SelectItem value="invite">Invite Only</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="ml-auto">Save Settings</Button>
                      </CardFooter>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                    <h3 className="mt-4 text-lg font-medium">No host selected</h3>
                    <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                      Please select a host to manage their availability settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Booking Dialog */}
      <Dialog open={openDialogs.newBooking} onOpenChange={(open) => setOpenDialogs({ ...openDialogs, newBooking: open })}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Schedule a New Booking</DialogTitle>
            <DialogDescription>
              Select a booking type, date, and time to schedule your appointment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Select Booking Type */}
              <div>
                <h3 className="text-sm font-medium mb-3">1. Select Booking Type</h3>
                <div className="space-y-3">
                  <Select
                    value={selectedHost?.id}
                    onValueChange={(hostId) => setSelectedHost(hosts.find(h => h.id === hostId) || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select host" />
                    </SelectTrigger>
                    <SelectContent>
                      {hosts.map(host => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    {selectedHost?.bookingTypes.map(bookingType => (
                      <Card
                        key={bookingType.id}
                        className={`cursor-pointer hover:border-primary transition-all overflow-hidden ${
                          selectedBookingType?.id === bookingType.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleBookingTypeSelect(bookingType)}
                      >
                        <div className="h-2" style={{ backgroundColor: bookingType.color }}></div>
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-base flex items-center justify-between">
                            {bookingType.name}
                            <Badge className="ml-2">{bookingType.duration} min</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {bookingType.description}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            {getLocationIcon(bookingType.location.type)}
                            <span>{bookingType.location.details}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {!selectedHost && (
                      <div className="text-center p-6 border rounded-md">
                        <p className="text-neutral-500 dark:text-neutral-400">
                          Please select a host first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Step 2: Select Date */}
              <div>
                <h3 className="text-sm font-medium mb-3">2. Select Date</h3>
                {selectedBookingType ? (
                  <div className="space-y-3">
                    <div className="border rounded-md">
                      <div className="p-2 border-b">
                        <div className="flex justify-between items-center">
                          <Button variant="ghost" size="sm" onClick={previousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h4 className="text-sm font-medium">
                            {format(currentMonth, 'MMMM yyyy')}
                          </h4>
                          <Button variant="ghost" size="sm" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-2">
                        <div className="grid grid-cols-7 gap-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs p-1">
                              {day}
                            </div>
                          ))}
                          
                          {getCalendarDays().map(day => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isPast = isBefore(day, new Date()) && !isToday(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentDay = isToday(day);
                            
                            return (
                              <div
                                key={day.toString()}
                                className={`
                                  text-center p-1 text-sm rounded-md
                                  ${!isCurrentMonth ? 'text-neutral-300 dark:text-neutral-600' : ''}
                                  ${isPast ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed' : 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                                  ${isSelected ? 'bg-primary text-white hover:bg-primary' : ''}
                                  ${isCurrentDay && !isSelected ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                                `}
                                onClick={() => !isPast && handleDateSelect(day)}
                              >
                                {format(day, 'd')}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-center">
                      Selected date: <span className="font-medium">{formatDate(selectedDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border rounded-md">
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Please select a booking type first
                    </p>
                  </div>
                )}
              </div>
              
              {/* Step 3: Select Time */}
              <div>
                <h3 className="text-sm font-medium mb-3">3. Select Time</h3>
                {selectedBookingType && selectedDate ? (
                  <div className="space-y-3">
                    <Select
                      value={selectedUserTimeZone}
                      onValueChange={setSelectedUserTimeZone}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Timezones</SelectLabel>
                          {getTimeZoneOptions().map(timezone => (
                            <SelectItem key={timezone} value={timezone}>
                              {timezone.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    
                    <div className="border rounded-md h-64 overflow-y-auto p-2">
                      {isLoadingTimeSlots ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedHost && selectedBookingType && selectedDate && (
                            <AsyncContent
                              asyncFn={() => getAvailableTimeSlots(selectedDate, selectedHost.id, selectedBookingType.id)}
                              render={(slots: BookableSlot[]) => (
                                <>
                                  {slots.length > 0 ? (
                                    slots.map(slot => (
                                      <div
                                        key={slot.startTime.toISOString()}
                                        className={`p-2 border rounded-md cursor-pointer hover:border-primary transition-all ${
                                          selectedTimeSlot && 
                                          slot.startTime.toISOString() === selectedTimeSlot.startTime.toISOString() 
                                            ? 'ring-2 ring-primary bg-primary/5' 
                                            : ''
                                        }`}
                                        onClick={() => handleTimeSlotSelect(slot)}
                                      >
                                        <div className="font-medium">
                                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center p-6">
                                      <p className="text-neutral-500 dark:text-neutral-400">
                                        No available time slots for this date
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                              loadingFallback={
                                <div className="h-32 flex items-center justify-center">
                                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                              }
                              errorFallback={(error) => (
                                <div className="text-center p-6">
                                  <p className="text-red-500">
                                    Error loading time slots: {error.message}
                                  </p>
                                </div>
                              )}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {selectedTimeSlot && (
                      <div className="text-sm text-center">
                        Selected time: <span className="font-medium">{formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 border rounded-md">
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Please select a booking type and date first
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step 4: Enter Details */}
            {selectedTimeSlot && (
              <div className="mt-6">
                <Separator className="mb-6" />
                <h3 className="text-sm font-medium mb-3">4. Enter Your Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="participantName">Name</Label>
                      <Input
                        id="participantName"
                        name="name"
                        value={participantDetails.name || ''}
                        onChange={handleParticipantDetailsChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="participantEmail">Email</Label>
                      <Input
                        id="participantEmail"
                        name="email"
                        type="email"
                        value={participantDetails.email || ''}
                        onChange={handleParticipantDetailsChange}
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    
                    {selectedBookingType?.location.type === 'phone' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="participantPhone">Phone Number</Label>
                        <Input
                          id="participantPhone"
                          name="phone"
                          type="tel"
                          value={participantDetails.phone || ''}
                          onChange={handleParticipantDetailsChange}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Questions */}
                  {selectedBookingType?.customQuestions.length! > 0 && (
                    <div className="space-y-4 mt-4">
                      <h4 className="font-medium">Additional Information</h4>
                      {selectedBookingType?.customQuestions.map(question => (
                        <div key={question.id} className="space-y-2">
                          <Label htmlFor={`question-${question.id}`}>
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          
                          {question.type === 'text' && (
                            <Input
                              id={`question-${question.id}`}
                              value={responseValues[question.id] as string || ''}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              required={question.required}
                            />
                          )}
                          
                          {question.type === 'longText' && (
                            <Textarea
                              id={`question-${question.id}`}
                              value={responseValues[question.id] as string || ''}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              placeholder="Your answer"
                              required={question.required}
                            />
                          )}
                          
                          {question.type === 'singleChoice' && question.options && (
                            <RadioGroup
                              value={responseValues[question.id] as string || ''}
                              onValueChange={(value) => handleResponseChange(question.id, value)}
                            >
                              <div className="space-y-2">
                                {question.options.map(option => (
                                  <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`option-${question.id}-${option}`} />
                                    <Label htmlFor={`option-${question.id}-${option}`}>{option}</Label>
                                  </div>
                                ))}
                              </div>
                            </RadioGroup>
                          )}
                          
                          {question.type === 'multipleChoice' && question.options && (
                            <div className="space-y-2">
                              {question.options.map(option => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`option-${question.id}-${option}`}
                                    checked={(responseValues[question.id] as string[] || []).includes(option)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = responseValues[question.id] as string[] || [];
                                      if (checked) {
                                        handleResponseChange(question.id, [...currentValues, option]);
                                      } else {
                                        handleResponseChange(
                                          question.id,
                                          currentValues.filter(v => v !== option)
                                        );
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`option-${question.id}-${option}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-6 pt-0">
            {selectedTimeSlot ? (
              <Button onClick={handleCreateBooking} disabled={isCreatingBooking}>
                {isCreatingBooking ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Scheduling...
                  </>
                ) : (
                  <>Schedule Booking</>
                )}
              </Button>
            ) : (
              <Button disabled>Schedule Booking</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Booking Details Dialog */}
      <Dialog open={openDialogs.bookingDetails} onOpenChange={(open) => setOpenDialogs({ ...openDialogs, bookingDetails: open })}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle>{selectedBooking.title}</DialogTitle>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <DialogDescription>
                  <div className="flex items-center gap-1">
                    {getLocationIcon(selectedBooking.location.type)}
                    <span>{selectedBooking.location.details}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Date & Time</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-neutral-500" />
                        <span>{formatDate(selectedBooking.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-neutral-500" />
                        <span>{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-neutral-500" />
                        <span>{selectedBooking.timeZone.replace(/_/g, ' ')}</span>
                      </div>
                      {getRecurrenceText(selectedBooking) && (
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-neutral-500" />
                          <span>{getRecurrenceText(selectedBooking)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Participant</h3>
                    {getParticipantDetails(selectedBooking)}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Booking Details</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-500" />
                      <span>Host: {hosts.find(h => h.id === selectedBooking.hostId)?.name}</span>
                    </div>
                    
                    {selectedBooking.participants[0].responses && selectedBooking.participants[0].responses.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <h4 className="text-sm font-medium">Responses</h4>
                        <div className="space-y-2">
                          {selectedBooking.participants[0].responses.map(response => {
                            // Find the question
                            const host = hosts.find(h => h.id === selectedBooking.hostId);
                            const bookingType = host?.bookingTypes.find(t => t.id === selectedBooking.typeId);
                            const question = bookingType?.customQuestions.find(q => q.id === response.questionId);
                            
                            return (
                              <div key={response.questionId} className="space-y-1">
                                <div className="text-sm font-medium">{question?.question}</div>
                                <div className="text-sm">
                                  {Array.isArray(response.answer) 
                                    ? response.answer.join(', ') 
                                    : response.answer}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                {selectedBooking.status === 'scheduled' && (
                  <div className="flex justify-between w-full">
                    <Button
                      variant="outline"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => setOpenDialogs({ ...openDialogs, cancelBooking: true, bookingDetails: false })}
                    >
                      <X className="h-4 w-4" />
                      Cancel Booking
                    </Button>
                    
                    <Button>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Cancel Booking Dialog */}
      <Dialog open={openDialogs.cancelBooking} onOpenChange={(open) => setOpenDialogs({ ...openDialogs, cancelBooking: open })}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">Cancelling this booking will remove it from your schedule and notify all participants.</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 border rounded-md">
                  <div className="font-medium">{selectedBooking.title}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {formatDate(selectedBooking.startTime)} at {formatTime(selectedBooking.startTime)}
                  </div>
                  {selectedBooking.participants.length > 0 && (
                    <div className="text-sm mt-1">
                      Participant: {selectedBooking.participants[0].name}
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDialogs({ ...openDialogs, cancelBooking: false, bookingDetails: true })}
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                >
                  Cancel Booking
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={openDialogs.confirmBooking} onOpenChange={(open) => setOpenDialogs({ ...openDialogs, confirmBooking: open })}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">Booking Confirmed!</h3>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                Your booking has been successfully scheduled. You will receive a confirmation email shortly.
              </p>
              <Button className="mt-6" onClick={() => setOpenDialogs({ ...openDialogs, confirmBooking: false })}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Async Content component for loading data
interface AsyncContentProps<T> {
  asyncFn: () => Promise<T>;
  render: (data: T) => React.ReactNode;
  loadingFallback: React.ReactNode;
  errorFallback: (error: Error) => React.ReactNode;
}

function AsyncContent<T>({ asyncFn, render, loadingFallback, errorFallback }: AsyncContentProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    asyncFn()
      .then(result => {
        if (mounted) {
          setData(result);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setData(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [asyncFn]);

  if (loading) return loadingFallback;
  if (error) return errorFallback(error);
  if (data) return render(data);
  
  return null;
}