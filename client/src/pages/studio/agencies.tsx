import React from "react";
import { Link } from "wouter";
import { PageTemplate } from "@/components/page-template";
import { 
  Users, 
  GanttChart, 
  Rocket, 
  Briefcase, 
  BarChart3, 
  Globe, 
  Lightbulb,
  CheckCircle
} from "lucide-react";

// Agency benefits
const benefits = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Powerful tools for seamless teamwork and client communication."
  },
  {
    icon: GanttChart,
    title: "Project Management",
    description: "Streamlined workflows for managing multiple client projects."
  },
  {
    icon: Rocket,
    title: "White Label Solutions",
    description: "Rebrand Echo as your own to strengthen your agency identity."
  },
  {
    icon: Briefcase,
    title: "Client Portal",
    description: "Share progress and gather feedback through dedicated client dashboards."
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Detailed reporting on all your client websites and campaigns."
  },
  {
    icon: Globe,
    title: "Multi-Site Management",
    description: "Manage unlimited client websites from a central dashboard."
  },
];

// Agency case studies/testimonials
const caseStudies = [
  {
    name: "Pixel Perfect Agency",
    quote: "Echo Studio has transformed our agency operations. We've reduced development time by 60% and can now manage 3x more client projects with the same team size.",
    author: "Sarah Miller",
    role: "Creative Director",
    logo: "/assets/agency-logo-1.svg"
  },
  {
    name: "Web Wizards Co.",
    quote: "The white-label capabilities allow us to deliver custom client solutions under our own brand. Our clients love the results, and we love the efficiency.",
    author: "James Chen",
    role: "Founder & CEO",
    logo: "/assets/agency-logo-2.svg"
  },
  {
    name: "Digital Forge",
    quote: "Since moving to Echo Studio, we've seen a 45% increase in client retention. The client portal gives our customers visibility that keeps them engaged and happy.",
    author: "Alicia Ruiz",
    role: "Operations Manager",
    logo: "/assets/agency-logo-3.svg"
  }
];

// Agency plans
const agencyPlans = [
  {
    name: "Starter Agency",
    price: "$99",
    period: "per month",
    description: "Perfect for small agencies just getting started with client work.",
    features: [
      "5 client projects",
      "Basic client portal",
      "Team collaboration (3 team members)",
      "Standard templates library",
      "Email support"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Pro Agency",
    price: "$299",
    period: "per month",
    description: "For growing agencies managing multiple clients and projects.",
    features: [
      "20 client projects",
      "Advanced client portal",
      "Team collaboration (10 team members)",
      "Full template library",
      "White labeling",
      "Priority support",
      "API access",
      "Advanced analytics"
    ],
    popular: true,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise Agency",
    price: "Custom",
    period: "pricing",
    description: "For large agencies with complex needs and numerous clients.",
    features: [
      "Unlimited client projects",
      "Premium client portal",
      "Unlimited team members",
      "Full template library",
      "Advanced white labeling",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom integrations",
      "Agency growth consulting"
    ],
    cta: "Contact Sales"
  }
];

export default function AgencyStudio() {
  return (
    <PageTemplate
      title="Echo Studio for Agencies"
      description="Powerful tools to help agencies design, build, and manage client websites at scale"
      breadcrumbs={[
        { label: "Studio", href: "/studio" },
        { label: "Agencies", href: "/studio/agencies" }
      ]}
    >
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-purple-800/30 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-white">
              Scale Your Agency with Echo Studio
            </h2>
            <p className="text-gray-300 mb-6">
              A comprehensive platform built specifically for web design agencies. 
              Create beautiful client websites faster, collaborate more effectively, 
              and manage all your projects from a central dashboard.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup?plan=agency"
                className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/studio/agencies/demo"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-1">
            <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <Briefcase className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
                <div className="text-sm text-gray-400">Agency Dashboard Illustration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefit Cards */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-10 text-white text-center">
          Designed for Agency Success
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* White Label Section */}
      <section className="mb-16">
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-8 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-900/60 rounded-full flex items-center justify-center mr-3">
                        <Lightbulb className="h-4 w-4 text-purple-300" />
                      </div>
                      <span className="text-white font-medium">Your Agency Brand</span>
                    </div>
                    <div className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full">Premium</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Custom domain for client portal</span>
                    </div>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Your logo and branding</span>
                    </div>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Custom email notifications</span>
                    </div>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Branded client reports</span>
                    </div>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Remove Echo branding</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl font-bold mb-4 text-white">
                White Label Solutions
              </h2>
              <p className="text-gray-300 mb-6">
                Present Echo Studio as your own proprietary platform. Our white label solution lets you rebrand the entire experience, from the dashboard to client communications, strengthening your agency's brand identity.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Custom domain for client portal",
                  "Your logo and colors throughout",
                  "Branded client reports and dashboards",
                  "Custom email templates with your branding",
                  "No Echo branding visible to clients"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/studio/white-label"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Learn More About White Labeling
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-10 text-white text-center">
          Trusted by Leading Agencies
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <div 
              key={index} 
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20"
            >
              <div className="h-14 flex items-center mb-6">
                <div className="bg-gray-700 h-10 w-32 rounded animate-pulse"></div>
              </div>
              <blockquote className="text-gray-300 mb-6">
                "{study.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <div className="text-white font-medium">{study.author}</div>
                  <div className="text-gray-400 text-sm">{study.role}, {study.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          Agency Plans
        </h2>
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          Flexible plans designed to scale with your agency. All plans include a 14-day free trial.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agencyPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-gray-800/40 backdrop-blur-sm border ${
                plan.popular ? 'border-purple-500' : 'border-gray-700'
              } rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-purple-900/20 relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 bg-purple-600 text-white text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}
              <div className={`p-6 ${plan.popular ? 'pt-9' : ''}`}>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={index === 2 ? "/contact-sales" : "/signup?plan=agency"}
                  className={`block text-center py-3 ${
                    plan.popular 
                      ? 'bg-purple-700 hover:bg-purple-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white font-medium rounded-lg transition-colors w-full`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-purple-800/30 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Elevate Your Agency Today
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join hundreds of successful agencies that use Echo Studio to streamline their workflow,
            impress clients, and grow their business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup?plan=agency"
              className="px-6 py-3 bg-white text-purple-900 hover:bg-gray-100 font-medium rounded-lg transition-colors"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/studio/agencies/case-studies"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              View Success Stories
            </Link>
          </div>
        </div>
      </section>
    </PageTemplate>
  );
}