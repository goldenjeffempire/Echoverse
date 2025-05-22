// client/src/pages/learning-page.tsx

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Book, Play } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import CourseContent from '@/components/learning/course-content';
import QuizInterface from '@/components/learning/quiz-interface';
import AITutor from '@/components/learning/ai-tutor';

import { coursesMock } from '@/data/mock-courses';
import { webDevQuiz } from '@/data/mock-quizzes';

interface Course {
  id: number;
  title: string;
  progress: number;
  chapters: number;
  duration: string;
  image?: string;
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Learning Portal</h1>
        <p className="text-light-base/70">Continue your learning journey with AI-powered courses</p>
      </motion.div>

      <Tabs defaultValue={activeTab} className="space-y-8" onValueChange={setActiveTab}>
        <TabsList aria-label="Learning Tabs">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="ai-tutor">AI Tutor</TabsTrigger>
        </TabsList>

        {/* Courses Section */}
        <TabsContent value="courses">
          {selectedCourse === null ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesMock.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCourseSelect(course.id)}
                  aria-label={`Select ${course.title} course`}
                >
                  <div className="h-40 bg-gradient-to-r from-primary to-accent-purple" />
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-light-base/70 mb-4">
                      <Book className="w-4 h-4" />
                      <span>{course.chapters} chapters</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                    </div>
                    <Progress value={course.progress} className="mb-2" />
                    <div className="text-sm text-light-base/70 mb-4">
                      {course.progress}% complete
                    </div>
                    <Button className="w-full" aria-label="Continue learning">
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <CourseContent
              courseId={selectedCourse}
              title={coursesMock.find((c) => c.id === selectedCourse)?.title || ''}
              chapters={[
                {
                  id: 1,
                  title: 'Introduction to Web Development',
                  duration: '15 mins',
                  completed: true,
                  content: 'Learn the basics of HTML, CSS, and JavaScript...'
                },
                {
                  id: 2,
                  title: 'Building Your First Website',
                  duration: '30 mins',
                  completed: false,
                  content: 'Step by step guide to creating a website...'
                }
              ]}
              progress={65}
            />
          )}
        </TabsContent>

        {/* Quizzes Section */}
        <TabsContent value="quizzes">
          <QuizInterface
            title={webDevQuiz.title}
            questions={webDevQuiz.questions}
          />
        </TabsContent>

        {/* AI Tutor Section */}
        <TabsContent value="ai-tutor">
          <AITutor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
