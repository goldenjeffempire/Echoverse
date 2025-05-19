import { useState } from 'react';
import RoleSwitch from '@/components/dashboard/RoleSwitch';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TaskList from '@/components/dashboard/TaskList';
import AiAssistant from '@/components/chat/AiAssistant';
import ModuleCards from '@/components/modules/ModuleCards';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { MetricItem, ActivityItem, Task, Module } from '@/types';

export default function GeneralDashboard() {
  // Metrics data for general dashboard
  const metrics: MetricItem[] = [
    {
      id: 'projects',
      title: 'Projects',
      value: 5,
      icon: 'folder',
      change: {
        value: 2,
        isPositive: true,
        text: 'from last month'
      }
    },
    {
      id: 'tasks',
      title: 'Tasks',
      value: 15,
      icon: 'task_alt',
      change: {
        value: 5,
        isPositive: true,
        text: 'completed this week'
      }
    },
    {
      id: 'documents',
      title: 'Documents',
      value: 27,
      icon: 'description',
      change: {
        value: 3,
        isPositive: true,
        text: 'new this month'
      }
    },
    {
      id: 'credits',
      title: 'AI Credits',
      value: 750,
      icon: 'smart_toy',
      change: {
        value: 80,
        isPositive: false,
        text: 'used this week'
      }
    }
  ];

  // Recent activity data for general dashboard
  const activities: ActivityItem[] = [
    {
      id: '1',
      user: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      },
      action: 'created',
      target: 'Personal Blog',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: '2',
      user: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      },
      action: 'updated',
      target: 'Resume',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      id: '3',
      user: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      },
      action: 'generated',
      target: 'Social Media Calendar',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ];

  // Tasks data for general dashboard
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Write blog post about AI',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'medium',
      completed: false,
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      }
    },
    {
      id: '2',
      title: 'Update portfolio website',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'high',
      completed: false,
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      }
    },
    {
      id: '3',
      title: 'Research new productivity tools',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      priority: 'normal',
      completed: false,
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      }
    },
    {
      id: '4',
      title: 'Create content calendar',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'medium',
      completed: false,
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100'
      }
    }
  ];

  // AI Modules data for general dashboard
  const modules: Module[] = [
    {
      id: '1',
      title: 'EchoWriter',
      description: 'Content generation',
      icon: 'edit_note',
      color: 'blue',
      href: '/echowriter'
    },
    {
      id: '2',
      title: 'EchoBuilder',
      description: 'Website builder',
      icon: 'precision_manufacturing',
      color: 'purple',
      href: '/echobuilder'
    },
    {
      id: '3',
      title: 'EchoImage',
      description: 'AI image generation',
      icon: 'image',
      color: 'green',
      href: '/echoimage'
    },
    {
      id: '4',
      title: 'EchoTranslate',
      description: 'Language translation',
      icon: 'translate',
      color: 'rose',
      href: '/echotranslate'
    }
  ];

  // Subscription data
  const subscription = {
    plan: 'Basic Plan',
    renewalDate: new Date(2023, 7, 15), // August 15, 2023
    credits: {
      used: 750,
      total: 1000
    }
  };

  const handleUpgradeSubscription = () => {
    console.log('Upgrade to EchoMax clicked');
    // In a real app, this would open the subscription upgrade flow
  };

  return (
    <>
      <RoleSwitch title="General Dashboard" currentRole="general" />
      
      <MetricsGrid metrics={metrics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity activities={activities} />
          
          <TaskList tasks={tasks} />
        </div>
        
        {/* Right Column - AI Assistant & Modules */}
        <div className="space-y-6">
          <AiAssistant />
          
          <ModuleCards modules={modules} />
          
          <SubscriptionCard
            plan={subscription.plan}
            renewalDate={subscription.renewalDate}
            credits={subscription.credits}
            onUpgrade={handleUpgradeSubscription}
          />
        </div>
      </div>
    </>
  );
}
