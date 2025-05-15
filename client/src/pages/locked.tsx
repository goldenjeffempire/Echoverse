
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Meta } from "@/lib/meta";

export default function Locked() {
  const { user } = useAuth();
  const [resendingEmail, setResendingEmail] = React.useState(false);

  const handleResendConsent = async () => {
    try {
      setResendingEmail(true);
      // Implement resend consent email logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch (error) {
      console.error("Error resending consent email:", error);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <>
      <Meta
        title="Echoverse Jr - Awaiting Parental Consent"
        description="Welcome to Echoverse Jr! Complete amazing projects while we wait for parental consent."
      />
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Logo className="mx-auto mb-8" />
            <h1 className="text-3xl font-bold mb-4">Welcome to Echoverse Jr!</h1>
            <p className="text-gray-400 mb-8">
              We've sent a consent request to your parent/guardian at {user?.parentEmail}.
              While we wait for their approval, check out these awesome features!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-700">
                <h3 className="text-xl font-semibold mb-2">Learn Web Design</h3>
                <p className="text-gray-400">Start with the basics of HTML and CSS</p>
              </div>
              <div className="p-6 rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-700">
                <h3 className="text-xl font-semibold mb-2">Build Your First Site</h3>
                <p className="text-gray-400">Create a simple webpage about your hobbies</p>
              </div>
            </div>

            <Button
              onClick={handleResendConsent}
              className="bg-purple-700 hover:bg-purple-600"
              disabled={resendingEmail}
            >
              {resendingEmail ? "Sending..." : "Resend Consent Email"}
            </Button>

            <p className="mt-4 text-sm text-gray-400">
              Need help? Contact our support team at support@echoverse.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
