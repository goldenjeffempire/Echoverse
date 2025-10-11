import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { register } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });
    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
        { label: 'Contains number', met: /\d/.test(formData.password) },
    ];
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
    const allRequirementsMet = passwordRequirements.every(req => req.met);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!allRequirementsMet) {
            setError('Please meet all password requirements');
            return;
        }
        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { confirmPassword, ...registrationData } = formData;
            await register(registrationData);
            toast({
                title: 'Account created successfully',
                description: 'Welcome to EchoVerse!',
            });
            setLocation('/dashboard');
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
            setError(errorMessage);
            toast({
                title: 'Registration failed',
                description: errorMessage,
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join EchoVerse and start building
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (<Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>)}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" type="text" placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={loading} autoComplete="given-name"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={loading} autoComplete="family-name"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="johndoe" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={loading} autoComplete="username"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={loading} autoComplete="email"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a strong password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required disabled={loading} autoComplete="new-password"/>
              {formData.password && (<div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (<div key={index} className="flex items-center text-xs">
                      {req.met ? (<Check className="h-3 w-3 text-green-600 mr-2"/>) : (<X className="h-3 w-3 text-gray-400 mr-2"/>)}
                      <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
                        {req.label}
                      </span>
                    </div>))}
                </div>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required disabled={loading} autoComplete="new-password"/>
              {formData.confirmPassword && (<div className="flex items-center text-xs">
                  {passwordsMatch ? (<>
                      <Check className="h-3 w-3 text-green-600 mr-2"/>
                      <span className="text-green-600">Passwords match</span>
                    </>) : (<>
                      <X className="h-3 w-3 text-red-600 mr-2"/>
                      <span className="text-red-600">Passwords do not match</span>
                    </>)}
                </div>)}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || !allRequirementsMet || !passwordsMatch}>
              {loading ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Creating account...
                </>) : ('Create Account')}
            </Button>
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={() => setLocation('/login')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                Sign in
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>);
}
