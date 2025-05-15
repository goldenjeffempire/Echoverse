import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function JobsPage() {
  const jobs = [
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Job Board</h1>
          <p className="text-xl text-light-base/70 mb-12">
            Find your next opportunity
          </p>

          <div className="space-y-6">
            {jobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="bg-dark-card hover:bg-dark-card/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <p className="text-light-base/70">{job.company}</p>
                      </div>
                      <Button variant="outline">Apply Now</Button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-light-base/70">{job.location}</span>
                      <span className="text-light-base/70">{job.type}</span>
                    </div>
                    <div className="flex gap-2">
                      {job.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}