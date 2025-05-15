
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseContent {
  id: string;
  title: string;
  type: "video" | "quiz" | "reading";
  duration: string;
  completed?: boolean;
}

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:id");
  const [activeTab, setActiveTab] = useState("content");
  const [progress, setProgress] = useState(30);

  const [content] = useState<CourseContent[]>([
    { id: "1", title: "Introduction to Course", type: "video", duration: "10 min", completed: true },
    { id: "2", title: "Core Concepts", type: "reading", duration: "15 min", completed: true },
    { id: "3", title: "Practical Applications", type: "video", duration: "20 min", completed: false },
    { id: "4", title: "Knowledge Check", type: "quiz", duration: "10 min", completed: false }
  ]);

  return (
    <DashboardLayout>
      <div className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/courses"><ArrowLeft className="h-4 w-4" /> Back to Courses</a>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Course: {params?.id}</CardTitle>
                  <p className="text-muted-foreground mt-2">Master the fundamentals and advanced concepts</p>
                </div>
                <Button>Continue Learning</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">6 weeks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">12 lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Certificate</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{progress}% complete</span>
                    <Progress value={progress} className="w-[100px]" />
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="content">Course Content</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    {content.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.completed && (
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                              )}
                              <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">{item.duration}</span>
                              <Button variant="outline" size="sm">
                                {item.completed ? "Review" : "Start"}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="overview">
                    <Card>
                      <CardContent className="prose dark:prose-invert max-w-none py-4">
                        <h3>About this course</h3>
                        <p>
                          This comprehensive course will teach you the essential concepts
                          and practical applications in your chosen field of study.
                        </p>
                        <h3>What you'll learn</h3>
                        <ul>
                          <li>Fundamental concepts and terminology</li>
                          <li>Practical applications and best practices</li>
                          <li>Advanced techniques and strategies</li>
                          <li>Real-world implementation</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="discussion">
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-center text-muted-foreground py-8">
                          Discussion forum will be available soon
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
