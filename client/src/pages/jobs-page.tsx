// client/src/pages/jobs-page.tsx

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { motion, useReducedMotion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Job {
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
}

export default function JobsPage() {
  const shouldReduceMotion = useReducedMotion();

  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Simulate fetching jobs from an API or mockData
    const fetchJobs = async () => {
      const mockJobs: Job[] = [
        {
          title: "Senior Frontend Developer",
          company: "TechCorp",
          location: "Remote",
          type: "Full-time",
          tags: ["React", "TypeScript", "UI/UX"]
        },
        {
          title: "AI Engineer",
          company: "AI Solutions",
          location: "New York",
          type: "Full-time",
          tags: ["Python", "TensorFlow", "ML"]
        }
      ];
      setJobs(mockJobs);
    };

    fetchJobs();
  }, []);

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Job Board</h1>
          <p className="text-xl text-light-base/70 mb-12">
            Find your next opportunity
          </p>

          <div className="space-y-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.title + index}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card
                  className="bg-dark-card hover:bg-dark-card/80 transition-colors"
                  aria-label={`${job.title} at ${job.company}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <p className="text-light-base/70">{job.company}</p>
                      </div>
                      <Button variant="outline" aria-label={`Apply to ${job.title}`}>
                        Apply Now
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 mb-4 text-light-base/70">
                      <span>{job.location}</span>
                      <span>{job.type}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {job.tags.map((tag, i) => (
                        <Badge key={tag + i} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
}
