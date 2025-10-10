/**
 * Password Strength Meter Component
 * Issue #65: Add password strength meter with zxcvbn
 */

import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (score: number) => void;
}

export function PasswordStrengthMeter({ password, onStrengthChange }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<ReturnType<typeof zxcvbn> | null>(null);

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setStrength(result);
      onStrengthChange?.(result.score);
    } else {
      setStrength(null);
      onStrengthChange?.(0);
    }
  }, [password, onStrengthChange]);

  if (!password) return null;

  const getStrengthColor = (score: number) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    return colors[score] || 'bg-gray-300';
  };

  const getStrengthText = (score: number) => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[score] || 'Unknown';
  };

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /[0-9]/.test(password) },
    { text: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) }
  ];

  const score = strength?.score ?? 0;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
          <span className={`font-medium ${score >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
            {getStrengthText(score)}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= score ? getStrengthColor(score) : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-gray-400" />
            )}
            <span className={req.met ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>

      {strength?.feedback.warning && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{strength.feedback.warning}</p>
        </div>
      )}

      {strength?.feedback.suggestions && strength.feedback.suggestions.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.suggestions.map((suggestion, idx) => (
            <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
              <span>•</span>
              <span>{suggestion}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
