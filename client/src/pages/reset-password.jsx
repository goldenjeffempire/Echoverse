import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
export default function ResetPasswordPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
        try {
            await api.post('/auth/request-password-reset', { email });
            setSuccess(true);
            toast({
                title: 'Reset email sent',
                description: 'Check your email for password reset instructions.',
            });
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to send reset email. Please try again.';
            setError(errorMessage);
            toast({
                title: 'Request failed',
                description: errorMessage,
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <Mail className="w-8 h-8"/>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        {success ? (<CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-center">
                If an account exists with this email, a password reset link has been sent to your email address.
                Please check your inbox and spam folder.
              </AlertDescription>
            </Alert>
          </CardContent>) : (<form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (<Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>)}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email"/>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Sending...
                  </>) : ('Send Reset Link')}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setLocation('/login')}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Back to Sign In
              </Button>
            </CardFooter>
          </form>)}
        {success && (<CardFooter>
            <Button type="button" variant="outline" className="w-full" onClick={() => setLocation('/login')}>
              <ArrowLeft className="mr-2 h-4 w-4"/>
              Back to Sign In
            </Button>
          </CardFooter>)}
      </Card>
    </div>);
}
