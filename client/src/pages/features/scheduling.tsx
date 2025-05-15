import React from "react";
import { Link } from "wouter";
import { Calendar, Clock, Users, Globe, Star, BellRing, Phone, Mail } from "lucide-react";
import { Meta } from "@/lib/meta";

const features = [
  {
    icon: Calendar,
    title: "Online Booking System",
    description: "Let clients book appointments 24/7 through your website with a customizable booking widget."
  },
  {
    icon: Clock,
    title: "Automated Reminders",
    description: "Reduce no-shows with automatic email and SMS reminders sent to clients before appointments."
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Manage staff schedules, availability, and permissions with individual calendars."
  },
  {
    icon: Globe,
    title: "Time Zone Support",
    description: "Display available times in your client's time zone to avoid booking confusion."
  },
  {
    icon: Star,
    title: "Client Reviews",
    description: "Automatically collect feedback and reviews after appointments to build your reputation."
  },
  {
    icon: BellRing,
    title: "Notification System",
    description: "Get notified of new bookings, cancellations, and schedule changes instantly."
  }
];

export default function Scheduling() {
  return (
    <>
      <Meta
        title="Online Scheduling & Booking - Echo"
        description="Streamline your appointment booking process with Echo's scheduling tools. Manage staff, appointments, and client relationships effortlessly."
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              Appointment Scheduling Made Easy
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Streamline your booking process, reduce no-shows, and manage your schedule effortlessly
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-lg transition-colors"
              >
                See Features
              </Link>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                How It Works
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                A simple process for you and your clients
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Set Your Availability</h3>
                <p className="text-gray-300">
                  Define your working hours, breaks, and buffer times between appointments.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Share Your Booking Page</h3>
                <p className="text-gray-300">
                  Add the booking widget to your website or share your booking link with clients.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Manage Appointments</h3>
                <p className="text-gray-300">
                  Accept bookings, send reminders, and handle rescheduling through one dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Powerful Scheduling Features
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Everything you need to manage appointments efficiently
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:shadow-purple-900/20 hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Booking Widget Demo */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Booking Widget Preview
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                See how easy it is for clients to book appointments
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-8">
                <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-white mb-4">Book an Appointment</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Service</label>
                      <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>Consultation (30 min)</option>
                        <option>Standard Session (60 min)</option>
                        <option>Premium Session (90 min)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">9:00 AM</button>
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">10:00 AM</button>
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">11:00 AM</button>
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">1:00 PM</button>
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">2:00 PM</button>
                        <button className="px-3 py-2 bg-gray-700 hover:bg-purple-600 text-white text-sm rounded transition-colors">3:00 PM</button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Your Information</label>
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                      />
                      <input 
                        type="email" 
                        placeholder="Email Address"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Multiple Ways to Connect
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Let clients book through their preferred channel
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Website Widget</h3>
                <p className="text-gray-300">
                  Embed our booking widget directly on your website for seamless scheduling.
                </p>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">SMS Booking</h3>
                <p className="text-gray-300">
                  Clients can book, reschedule, or cancel appointments via text message.
                </p>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Email Booking</h3>
                <p className="text-gray-300">
                  Send booking links via email campaigns to drive appointment bookings.
                </p>
              </div>
            </div>
          </section>

          {/* Testimonial */}
          <section className="py-16">
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 border border-purple-800/30 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-purple-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  DH
                </div>
                <div>
                  <p className="text-lg text-gray-300 italic mb-4">
                    "Echo's scheduling system has transformed how I run my practice. I've eliminated the back-and-forth emails trying to find appointment times, reduced no-shows by 80% with automated reminders, and saved hours each week that I can now spend with clients."
                  </p>
                  <div>
                    <h4 className="font-bold text-white">Dr. Helen Parker</h4>
                    <p className="text-sm text-gray-400">Therapist & Life Coach</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-12 border border-purple-800/40">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Streamline Your Scheduling?</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                Start your 14-day free trial today, no credit card required
              </p>
              <Link
                href="/signup"
                className="px-8 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-lg transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}