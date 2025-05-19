type SubscriptionCardProps = {
  plan: string;
  renewalDate: Date;
  credits: {
    used: number;
    total: number;
  };
  onUpgrade: () => void;
};

export default function SubscriptionCard({
  plan,
  renewalDate,
  credits,
  onUpgrade
}: SubscriptionCardProps) {
  // Format the renewal date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(renewalDate);

  // Calculate the percentage of credits used
  const creditPercentage = Math.round((credits.used / credits.total) * 100);
  
  return (
    <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{plan}</h3>
          <p className="opacity-90 text-sm mt-1">
            Your subscription renews on {formattedDate}
          </p>
        </div>
        <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
          Active
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span>AI Credits</span>
          <span>{credits.used} / {credits.total}</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2 mt-1">
          <div
            className="bg-white h-2 rounded-full"
            style={{ width: `${creditPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <button
        onClick={onUpgrade}
        className="w-full mt-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-sm font-medium rounded-md transition-colors"
      >
        Upgrade to EchoMax
      </button>
    </div>
  );
}
