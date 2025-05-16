import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { 
  CheckCircle, Sparkles, Shield, PlusCircle, Lock, Eye, EyeOff, 
  ArrowRight, AlertCircle, Mail, User, Key, Calendar, Briefcase, RefreshCw
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from "@/components/ui/card";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, UserRole } from "@shared/schema";
import { isMinor } from "@/lib/age-verification";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { AIVideoBackground, GradientOverlay } from "@/components/ui/video-background";
import { GlowingText, FadeInElement, FloatingElement } from "@/components/ui/animated-card";
import { AIBrain, AIAnimation } from "@/components/ui/ai-animation";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must include uppercase, lowercase, and number"),
  confirmPassword: z.string(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  role: z.enum([UserRole.GENERAL, UserRole.SCHOOL, UserRole.PERSONAL, UserRole.WORK]),
  parentEmail: z.string().email("Please enter a valid email").optional(),
  acceptTerms: z.boolean().refine((val) => val, "You must accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("sign-in");
  const { login, signup, loginWithGoogle, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showParentalConsent, setShowParentalConsent] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      role: UserRole.GENERAL,
      parentEmail: "",
      acceptTerms: false,
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = new Date(e.target.value);
    setShowParentalConsent(isMinor(dob));
    registerForm.setValue("dateOfBirth", e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset functionality will be implemented soon.",
    });
  };

  const onLoginSubmit = async (data: any) => {
    setFormError(null);
    try {
      setIsLoading(true);
      await login(data.username, data.password);
      toast({ 
        title: "Login successful",
        description: "Welcome back to Echoverse!",
        variant: "default"
      });
      // API endpoint: POST /api/login
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Invalid username or password");
      toast({ 
        title: "Login failed", 
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: any) => {
    setFormError(null);
    const minor = isMinor(new Date(data.dateOfBirth));
    if (minor && !data.parentEmail) {
      registerForm.setError("parentEmail", { 
        type: "manual", 
        message: "Parental email is required for users under 18" 
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await signup({
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        isMinor: minor,
        provider: "local",
        plan: "free",
      });
      // API endpoint: POST /api/register
      
      toast({ 
        title: "Account created successfully", 
        description: minor ? 
          "Your account requires parental approval." : 
          "Welcome to Echoverse! Let's set up your workspace.",
        variant: "default" 
      });
      
      navigate(minor ? "/locked" : "/onboarding");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || "Registration failed. Please try again.";
      setFormError(errorMessage);
      toast({ 
        title: "Registration failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Welcome to Echoverse</title></Helmet>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 z-0">
          <AIVideoBackground opacity={0.1} />
        </div>
        
        {/* Logo in top left */}
        <div className="absolute top-6 left-6 z-20">
          <Logo variant="default" className="hidden md:flex logo-animation" />
        </div>
        
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 min-h-screen relative z-10">
          {/* Left Column - Auth Forms */}
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <FadeInElement direction="down" delay={0.2} className="mb-8">
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-white">Welcome to Echoverse</h1>
              </div>
              <p className="text-gray-400">Sign in to access your AI-powered workspace</p>
            </FadeInElement>

            <div className="w-full max-w-md mx-auto">
              <div className="mb-6">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6 border border-[#333] rounded-md bg-transparent">
                    <TabsTrigger 
                      value="sign-in" 
                      className="text-sm font-medium auth-tab rounded-l-md transition-all"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="create-account" 
                      className="text-sm font-medium auth-tab rounded-r-md transition-all"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Subtle glow effect behind the forms */}
                  <div className="absolute inset-0 w-full h-full max-w-[60%] mx-auto bg-primary/5 blur-3xl rounded-full pointer-events-none" />
                  
                  <TabsContent value="sign-in">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-[#111] border-[#333] relative z-10 shadow-xl">
                        <CardHeader>
                          <CardTitle className="text-xl">Sign In</CardTitle>
                          <CardDescription>Enter your credentials to access your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {formError && (
                          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-400">{formError}</p>
                          </div>
                        )}
                        
                        <Form {...loginForm}>
                          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                            <FormField
                              control={loginForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    Username
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        className="auth-input" 
                                        placeholder="Enter your username"
                                        autoComplete="username"
                                        data-test-id="username-input"
                                        aria-label="Username"
                                        {...field} 
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={loginForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center">
                                    <FormLabel className="flex items-center gap-1.5">
                                      <Lock className="h-4 w-4" />
                                      Password
                                    </FormLabel>
                                    <button
                                      type="button"
                                      onClick={handleForgotPassword}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      Forgot password?
                                    </button>
                                  </div>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showPassword ? "text" : "password"}
                                        className="auth-input pr-10" 
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        data-test-id="password-input"
                                        aria-label="Password"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                      >
                                        {showPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button 
                              type="submit" 
                              className="w-full auth-button hover:bg-primary/90 flex items-center justify-center gap-2"
                              disabled={isLoading}
                              data-test-id="sign-in-button"
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Signing in...</span>
                                </>
                              ) : (
                                <>
                                  <span>Sign In</span>
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-2 px-6 pb-6 pt-0">
                        <div className="relative my-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700"></span>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-900 px-2 text-gray-400">or continue with</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-800 border-gray-700 hover:bg-gray-700 flex items-center gap-2"
                            onClick={loginWithGoogle}
                            data-test-id="google-sign-in"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                              <path fill="none" d="M1 1h22v22H1z" />
                            </svg>
                            <span>Google</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="create-account">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-[#111] border-[#333] relative z-10 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-xl">Create Account</CardTitle>
                        <CardDescription>Fill out the form to create your account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {formError && (
                          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-400">{formError}</p>
                          </div>
                        )}
                        
                        <Form {...registerForm}>
                          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={registerForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                      <User className="h-4 w-4" />
                                      First Name
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        className="bg-gray-800 border-gray-700 focus:border-primary" 
                                        placeholder="John"
                                        autoComplete="given-name"
                                        data-test-id="first-name-input"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registerForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                      <User className="h-4 w-4" />
                                      Last Name
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        className="bg-gray-800 border-gray-700 focus:border-primary" 
                                        placeholder="Doe"
                                        autoComplete="family-name"
                                        data-test-id="last-name-input"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    Username
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      className="bg-gray-800 border-gray-700 focus:border-primary" 
                                      placeholder="johndoe"
                                      autoComplete="username"
                                      data-test-id="register-username-input"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs text-gray-500">
                                    This will be your unique identifier on the platform
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    Email
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email" 
                                      className="bg-gray-800 border-gray-700 focus:border-primary" 
                                      placeholder="john.doe@example.com"
                                      autoComplete="email"
                                      data-test-id="email-input"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <Lock className="h-4 w-4" />
                                    Password
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showPassword ? "text" : "password"}
                                        className="auth-input pr-10" 
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        data-test-id="register-password-input"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                      >
                                        {showPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormDescription className="text-xs text-gray-500">
                                    Password must contain at least 8 characters, including uppercase, lowercase and number
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <Lock className="h-4 w-4" />
                                    Confirm Password
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="auth-input pr-10" 
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        data-test-id="confirm-password-input"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                      >
                                        {showConfirmPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Date of Birth
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      className="bg-gray-800 border-gray-700 focus:border-primary"
                                      data-test-id="dob-input"
                                      aria-label="Date of Birth"
                                      value={field.value}
                                      name={field.name}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      onChange={(e) => {
                                        handleDateOfBirthChange(e);
                                        field.onChange(e);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {showParentalConsent && (
                              <FormField
                                control={registerForm.control}
                                name="parentEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                      <Mail className="h-4 w-4" />
                                      Parent Email
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="email" 
                                        className="bg-gray-800 border-gray-700 focus:border-primary" 
                                        placeholder="parent@example.com"
                                        data-test-id="parent-email-input"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                      Required for users under 18 years old. We'll send a verification email to your parent/guardian.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            
                            <FormField
                              control={registerForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    Account Type
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    data-test-id="account-type-select"
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-gray-800 border-gray-700">
                                        <SelectValue placeholder="Select account type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      <SelectItem value={UserRole.GENERAL}>General</SelectItem>
                                      <SelectItem value={UserRole.SCHOOL}>School</SelectItem>
                                      <SelectItem value={UserRole.PERSONAL}>Personal</SelectItem>
                                      <SelectItem value={UserRole.WORK}>Work</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="acceptTerms"
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-2 pt-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="border-gray-600 mt-1"
                                      data-test-id="terms-checkbox"
                                    />
                                  </FormControl>
                                  <div className="space-y-1">
                                    <FormLabel className="text-sm font-normal">
                                      I accept the <Link href="#" className="text-primary hover:underline">terms of service</Link> and <Link href="#" className="text-primary hover:underline">privacy policy</Link>
                                    </FormLabel>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <Button
                              type="submit"
                              className="w-full auth-button hover:bg-primary/90 flex items-center justify-center gap-2 mt-6"
                              disabled={isLoading}
                              data-test-id="create-account-button"
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Creating account...</span>
                                </>
                              ) : (
                                <>
                                  <span>Create Account</span>
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>

                {/* No "continue with" section since it's moved into the Card component */}
              
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  {activeTab === "sign-in" ? 
                    "Don't have an account? " : 
                    "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === "sign-in" ? "create-account" : "sign-in")}
                    className="text-primary hover:underline"
                    aria-label={activeTab === "sign-in" ? "Switch to create account" : "Switch to sign in"}
                  >
                    {activeTab === "sign-in" ? "Create one" : "Sign in"}
                  </button>
                </p>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} Echoverse. All rights reserved.
                </p>
                <div className="flex justify-center mt-2 gap-4 text-xs text-gray-500">
                  <Link href="/terms" className="hover:text-primary hover:underline">Terms</Link>
                  <Link href="/privacy" className="hover:text-primary hover:underline">Privacy</Link>
                  <Link href="/support" className="hover:text-primary hover:underline">Support</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="hidden lg:flex flex-col justify-center p-12 bg-black relative"
          >
            {/* Gradient overlay */}
            <GradientOverlay opacity={0.05} />
            
            <div className="max-w-lg space-y-8 relative z-10">
              <FadeInElement direction="down" delay={0.4}>
                <GlowingText color="#9572FF" className="text-4xl font-bold block mb-2">
                  Power Your Business with AI
                </GlowingText>
                <p className="text-gray-300 text-lg">
                  Echoverse provides a comprehensive suite of AI-powered tools to streamline your business operations, enhance productivity, and unlock new opportunities.
                </p>
              </FadeInElement>

              <div className="py-6">
                <FloatingElement duration={4} distance={4}>
                  <div className="h-60 w-full relative">
                    <AIBrain />
                  </div>
                </FloatingElement>
              </div>

              <div className="mt-8 space-y-6">
                <FadeInElement direction="left" delay={0.6}>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 bg-primary/10 p-2.5 rounded-md">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white">AI-Powered Tools</h3>
                      <p className="text-gray-400 mt-1.5">
                        Access cutting-edge AI tools for content generation and analytics.
                      </p>
                    </div>
                  </div>
                </FadeInElement>

                <FadeInElement direction="left" delay={0.7}>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 bg-primary/10 p-2.5 rounded-md">
                      <PlusCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white">Marketplace</h3>
                      <p className="text-gray-400 mt-1.5">
                        Discover and purchase specialized AI agents and templates.
                      </p>
                    </div>
                  </div>
                </FadeInElement>

                <FadeInElement direction="left" delay={0.8}>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 bg-primary/10 p-2.5 rounded-md">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white">Enterprise Solutions</h3>
                      <p className="text-gray-400 mt-1.5">
                        Customize and scale AI solutions for your unique business needs.
                      </p>
                    </div>
                  </div>
                </FadeInElement>

                <FadeInElement direction="left" delay={0.9}>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 bg-primary/10 p-2.5 rounded-md">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white">Secure Platform</h3>
                      <p className="text-gray-400 mt-1.5">
                        Enterprise-grade security and data protection for peace of mind.
                      </p>
                    </div>
                  </div>
                </FadeInElement>
              </div>
              
              <FadeInElement direction="up" delay={1}>
                <Link 
                  href="/features" 
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/90 mt-6 font-medium group"
                  aria-label="Learn more about our features"
                >
                  <span>Learn more about our features</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatType: "mirror" 
                    }}
                    className="inline-block"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
              </FadeInElement>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
