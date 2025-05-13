
import { useState } from 'react';
import { ChevronRight, PlayCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Chapter {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
}

interface CourseContentProps {
  courseId: number;
  title: string;
  chapters: Chapter[];
  progress: number;
}

export default function CourseContent({ courseId, title, chapters, progress }: CourseContentProps) {
  const [activeChapter, setActiveChapter] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Progress value={progress} className="w-32" />
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <Card 
              key={chapter.id}
              className={`cursor-pointer transition-colors ${
                activeChapter === chapter.id ? 'border-primary' : ''
              }`}
              onClick={() => setActiveChapter(chapter.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {chapter.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  )}
                  <span>{chapter.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-light-base/50" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="md:col-span-2">
          {activeChapter !== null && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  {chapters.find(c => c.id === activeChapter)?.title}
                </h3>
                <div className="prose prose-light max-w-none">
                  {chapters.find(c => c.id === activeChapter)?.content}
                </div>
                <Button className="mt-6">Mark as Complete</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
