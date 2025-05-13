import { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, CheckCircle, Play, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import CourseContent from '@/components/learning/course-content';
import QuizInterface from '@/components/learning/quiz-interface';
import AITutor from '@/components/learning/ai-tutor';

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const courses = [
    {
      id: 1,
      title: 'Web Development Fundamentals',
      progress: 65,
      chapters: 12,
      duration: '6 hours',
      image: '/course-web.jpg'
    },
    {
      id: 2,
      title: 'AI & Machine Learning Basics',
      progress: 30,
      chapters: 8,
      duration: '4 hours',
      image: '/course-ai.jpg'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Learning Portal</h1>
        <p className="text-light-base/70">Continue your learning journey with AI-powered courses</p>
      </motion.div>

      <Tabs defaultValue="courses" className="space-y-8">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="ai-tutor">AI Tutor</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {selectedCourse === null ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <div className="h-40 bg-gradient-to-r from-primary to-accent-purple"></div>
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
                    <Button className="w-full">
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
              title={courses.find(c => c.id === selectedCourse)?.title || ''}
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

        <TabsContent value="quizzes">
          <QuizInterface
            title="Web Development Fundamentals Quiz"
            questions={[
              {
                id: 1,
                text: 'What does HTML stand for?',
                options: [
                  'Hyper Text Markup Language',
                  'High Tech Modern Language',
                  'Hyper Transfer Markup Language',
                  'Home Tool Markup Language'
                ],
                correctAnswer: 0
              },
              {
                id: 2,
                text: 'Which CSS property is used to change the text color?',
                options: [
                  'text-style',
                  'font-color',
                  'color',
                  'text-color'
                ],
                correctAnswer: 2
              }
            ]}
          />
        </TabsContent>

        <TabsContent value="ai-tutor">
            <AITutor />
          </TabsContent>
      </Tabs>
    </div>
  );
}