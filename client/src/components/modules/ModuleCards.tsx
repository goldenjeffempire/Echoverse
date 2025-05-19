import { useState } from 'react';

type Module = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'rose';
  href: string;
};

type ModuleCardsProps = {
  modules: Module[];
};

export default function ModuleCards({ modules }: ModuleCardsProps) {
  const [displayCount, setDisplayCount] = useState(4);
  
  const handleViewAll = () => {
    setDisplayCount(modules.length);
  };
  
  // Show only the first few modules
  const displayedModules = modules.slice(0, displayCount);
  
  const getColorClasses = (color: Module['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300';
      case 'green':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'rose':
        return 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300';
      default:
        return 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300';
    }
  };
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
      <h2 className="font-semibold mb-4">AI Modules</h2>
      
      <div className="space-y-4">
        {displayedModules.map(module => (
          <a 
            key={module.id}
            href={module.href} 
            className="block p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${getColorClasses(module.color)}`}>
                <span className="material-icons">{module.icon}</span>
              </div>
              <div>
                <h3 className="font-medium">{module.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{module.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {displayCount < modules.length && (
        <button 
          className="w-full mt-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          onClick={handleViewAll}
        >
          View All Modules
        </button>
      )}
    </div>
  );
}
