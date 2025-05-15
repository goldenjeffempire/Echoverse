
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@shared/schema';

const questions = {
  [UserRole.GENERAL]: [
    {
      id: 'intent',
      question: 'What brings you to Echoverse today?',
      type: 'select',
      options: ['Explore', 'Create', 'Sell', 'Learn', 'Connect', 'Other'],
    },
    {
      id: 'firstAction',
      question: 'What do you plan to do first?',
      type: 'radio',
      options: [
        'Build a website or blog',
        'Try AI tools',
        'Start a side hustle',
        'Customize my dashboard',
      ],
    },
    {
      id: 'techLevel',
      question: 'How tech-savvy are you?',
      type: 'radio',
      options: ['Newbie', 'Comfortable', 'Advanced user/dev'],
    },
    {
      id: 'showTutorials',
      question: 'Would you like to see beginner-friendly tutorials in your dashboard?',
      type: 'boolean',
    },
    {
      id: 'theme',
      question: 'What kind of themes or aesthetics do you prefer?',
      type: 'select',
      options: ['Minimalist', 'Colorful', 'Professional', 'Fun', 'Dark'],
    },
  ],
  [UserRole.WORK]: [
    {
      id: 'workUseCase',
      question: 'What best describes your work use case?',
      type: 'select',
      options: ['Freelancer', 'Startup', 'SMB', 'Corporate', 'Agency', 'Consultant'],
    },
    {
      id: 'primaryGoal',
      question: "What's your primary goal here?",
      type: 'radio',
      options: [
        'Build a business site or store',
        'Automate operations',
        'Manage clients or CRM',
        'Marketing & content creation',
        'Collaboration with teammates',
      ],
    },
    {
      id: 'aiTools',
      question: 'Which AI tools are most valuable to your workflow?',
      type: 'checkbox',
      options: ['EchoWriter', 'EchoSeller', 'EchoMarketer', 'EnterpriseOps'],
    },
    {
      id: 'teamSize',
      question: 'Are you managing a team or solo?',
      type: 'radio',
      options: ['Solo', 'Small team (2-5)', 'Medium team (6-15)', 'Large team (15+)'],
    },
    {
      id: 'needsIntegrations',
      question: 'Do you need integrations?',
      type: 'boolean',
    },
  ],
  // Add other role questions...
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { state, dispatch } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  
  const currentQuestions = questions[state.role] || questions[UserRole.GENERAL];
  const currentQuestion = currentQuestions[currentStep];

  const handleNext = () => {
    if (currentStep < currentQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save onboarding data and redirect
      navigate('/dashboard');
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'select':
        return (
          <Select
            value={state[currentQuestion.id]}
            onValueChange={(value) => 
              dispatch({ type: 'SET_FIELD', field: currentQuestion.id, value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <RadioGroup
            value={state[currentQuestion.id]}
            onValueChange={(value) =>
              dispatch({ type: 'SET_FIELD', field: currentQuestion.id, value })
            }
          >
            {currentQuestion.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={state[currentQuestion.id]?.includes(option)}
                  onCheckedChange={(checked) => {
                    const current = state[currentQuestion.id] || [];
                    const newValue = checked
                      ? [...current, option]
                      : current.filter((item) => item !== option);
                    dispatch({ type: 'SET_FIELD', field: currentQuestion.id, value: newValue });
                  }}
                />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={currentQuestion.id}
              checked={state[currentQuestion.id]}
              onCheckedChange={(checked) =>
                dispatch({ type: 'SET_FIELD', field: currentQuestion.id, value: checked })
              }
            />
            <Label htmlFor={currentQuestion.id}>Yes</Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full mx-4 p-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentQuestion.question}
          </h2>
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className="h-2 bg-purple-600 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / currentQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {renderQuestion()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === currentQuestions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
