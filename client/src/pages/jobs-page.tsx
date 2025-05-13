
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, MapPin, Clock, Filter, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  posted: string;
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  return (
    <DashboardLayout>
      <div className="container py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
            <p className="text-muted-foreground">Find and post job opportunities</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>

                <div>
                  <label className="text-sm font-medium mb-2 block">Job Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((job) => (
                <Card key={job} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg mb-1">Senior Software Engineer</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            Tech Corp
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Remote
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Posted 2d ago
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Full-time</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      We are seeking an experienced software engineer to join our growing team...
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">$120k - $150k</div>
                      <div className="space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Schedule Interview
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Schedule Interview</DialogTitle>
                              <DialogDescription>
                                Pick a date and time for your interview
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Calendar
                                mode="single"
                                selected={new Date()}
                                onSelect={(date) => console.log(date)}
                                className="rounded-md border"
                              />
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="9">9:00 AM</SelectItem>
                                  <SelectItem value="10">10:00 AM</SelectItem>
                                  <SelectItem value="11">11:00 AM</SelectItem>
                                  <SelectItem value="13">1:00 PM</SelectItem>
                                  <SelectItem value="14">2:00 PM</SelectItem>
                                  <SelectItem value="15">3:00 PM</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={() => console.log("Schedule confirmed")}>
                                Confirm Schedule
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="default">Apply Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
