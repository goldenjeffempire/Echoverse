
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, BookOpen } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
}

export default function CoursesPage() {
  const [courses] = useState<Course[]>([
    {
      id: "ai-fundamentals",
      title: "AI Fundamentals",
      description: "Learn the basics of artificial intelligence and machine learning",
      duration: "6 weeks",
      lessons: 12
    },
    {
      id: "web-development",
      title: "Web Development",
      description: "Master modern web development with React and Node.js",
      duration: "8 weeks",
      lessons: 16
    },
    {
      id: "data-science",
      title: "Data Science Essentials",
      description: "Understanding data analysis and visualization",
      duration: "10 weeks",
      lessons: 20
    }
  ]);

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground mt-1">Expand your knowledge with our curated courses</p>
          </div>
          <Button asChild>
            <Link href="/courses/new">Create Course</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessons} lessons</span>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/courses/${course.id}`}>View Course</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function CoursesPage() {
  const courses = [
    {
      title: "AI Development Fundamentals",
      description: "Learn the basics of AI development",
      duration: "8 weeks"
    },
    {
      title: "Advanced Machine Learning",
      description: "Deep dive into machine learning concepts",
      duration: "12 weeks"
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Courses</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {courses.map((course, index) => (
              <Card key={index} className="bg-dark-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-light-base/70 mb-4">{course.description}</p>
                  <p className="text-sm text-primary">Duration: {course.duration}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
