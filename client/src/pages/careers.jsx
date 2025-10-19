import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, Clock, Users, Rocket, Heart, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
const positions = [
    {
        title: "Senior Full-Stack Engineer",
        department: "Engineering",
        location: "Remote / San Francisco",
        type: "Full-time",
        salary: "$150K - $200K",
        description: "Build the future of AI-powered web development. Work with React, Node.js, and cutting-edge AI technologies."
    },
    {
        title: "AI/ML Engineer",
        department: "AI Research",
        location: "Remote / New York",
        type: "Full-time",
        salary: "$160K - $220K",
        description: "Develop advanced AI models for website generation, content creation, and intelligent automation."
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Remote",
        type: "Full-time",
        salary: "$120K - $160K",
        description: "Create beautiful, intuitive user experiences that delight millions of users worldwide."
    },
    {
        title: "DevOps Engineer",
        department: "Infrastructure",
        location: "Remote / Austin",
        type: "Full-time",
        salary: "$140K - $180K",
        description: "Scale our platform to serve millions while maintaining 99.99% uptime and exceptional performance."
    }
];
const benefits = [
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive medical, dental, and vision coverage" },
    { icon: Globe, title: "Remote First", description: "Work from anywhere in the world" },
    { icon: DollarSign, title: "Competitive Salary", description: "Top-tier compensation and equity" },
    { icon: Rocket, title: "Growth", description: "Unlimited learning and development budget" },
    { icon: Clock, title: "Flexibility", description: "Flexible hours and unlimited PTO" },
    { icon: Users, title: "Culture", description: "Inclusive, diverse, and supportive team" }
];
export default function CareersPage() {
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-6 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Briefcase className="w-4 h-4 mr-2"/>
              Join Our Team
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
              Build the Future with Us
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Join a team of passionate innovators creating the next generation of AI-powered digital tools
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-12 text-center">Why EchoVerse?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (<motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-8 h-8 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-12 text-center">Open Positions</h2>
          <div className="space-y-6">
            {positions.map((position, index) => (<motion.div key={index} initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold">{position.title}</h3>
                          <Badge className="bg-purple-100 text-purple-700">{position.department}</Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">{position.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4"/>
                            <span>{position.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4"/>
                            <span>{position.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4"/>
                            <span>{position.salary}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
        </div>
      </section>
    </div>);
}
