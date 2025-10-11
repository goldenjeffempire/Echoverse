/**
 * LOW-049: Cookie Consent Banner (GDPR Compliance)
 */
import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const COOKIE_CONSENT_KEY = 'cookie-consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    
    // Initialize analytics/marketing based on preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      console.log('Analytics enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing cookies
      console.log('Marketing cookies enabled');
    }
    
    setIsVisible(false);
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptNecessary = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
      <Card className="max-w-4xl mx-auto p-6 shadow-2xl border-2">
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Cookie Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.
            </p>

            {showDetails && (
              <div className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="necessary"
                    checked={preferences.necessary}
                    disabled
                  />
                  <div className="flex-1">
                    <label htmlFor="necessary" className="text-sm font-medium">
                      Necessary Cookies (Required)
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Essential for the website to function properly. These cannot be disabled.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, analytics: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="analytics" className="text-sm font-medium">
                      Analytics Cookies
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, marketing: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="marketing" className="text-sm font-medium">
                      Marketing Cookies
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used to deliver relevant advertisements and track campaign performance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!showDetails ? (
                <>
                  <Button onClick={acceptAll} size="sm">
                    Accept All
                  </Button>
                  <Button onClick={acceptNecessary} variant="outline" size="sm">
                    Necessary Only
                  </Button>
                  <Button
                    onClick={() => setShowDetails(true)}
                    variant="ghost"
                    size="sm"
                  >
                    Customize
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={saveCustomPreferences} size="sm">
                    Save Preferences
                  </Button>
                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="outline"
                    size="sm"
                  >
                    Back
                  </Button>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={acceptNecessary}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Hook to check if cookie type is consented
export function useCookieConsent(type: keyof CookiePreferences): boolean {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        setHasConsent(parsed[type] === true);
      } catch {
        setHasConsent(false);
      }
    }
  }, [type]);

  return hasConsent;
}
