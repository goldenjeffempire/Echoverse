// src/data/help-center-data.ts

export const featuredArticles = [
  { id: 1, title: "Getting Started", description: "Learn how to get up and running quickly.", href: "#getting-started" },
  { id: 2, title: "Account Management", description: "Manage your account settings and preferences.", href: "#account-management" },
  { id: 3, title: "Security", description: "Understand our security practices and tips.", href: "#security" },
];

export const categories = [
  { id: 1, name: "Getting Started", icon: "Book", description: "Set up your account and begin.", href: "#getting-started" },
  { id: 2, name: "Account", icon: "UserCircle", description: "Update personal info, password.", href: "#account-management" },
  { id: 3, name: "Security", icon: "ShieldCheck", description: "Secure your account and data.", href: "#security" },
];

export const faqCategories = [
  {
    title: "General Questions",
    faqs: [
      { question: "What is this platform?", answer: "An AI-enhanced productivity suite for real humans." },
      { question: "Is my data private?", answer: "Yes. We don’t sell your data. Ever." },
    ],
  },
  {
    title: "Account",
    faqs: [
      { question: "How do I change my email?", answer: "Navigate to Settings → Account." },
      { question: "Can I delete my account?", answer: "Yes. Contact support and we’ll handle it." },
    ],
  },
];
