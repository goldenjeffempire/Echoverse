import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, UserRole } from "@shared/schema";
import { isMinor } from "@/lib/age-verification";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Meta } from "@/lib/meta";

type FormMode = "login" | "register" | "signup";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Please enter a valid email address"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Include uppercase, lowercase & number"),
  confirmPassword: z.string(),
  dateOfBirth: z.string(),
  role: z.enum([UserRole.GENERAL, UserRole.SCHOOL, UserRole.PERSONAL, UserRole.WORK]).default(UserRole.GENERAL),
  parentEmail: z.string().email().optional(),
  acceptTerms: z.boolean().refine((v) => v, { message: "You must accept the terms." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [formMode, setFormMode] = useState<FormMode>("login");
  const { login, signup, loginWithGoogle, user, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showParentalConsent, setShowParentalConsent] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      role: UserRole.GENERAL,
      acceptTerms: false,
    },
  });

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = new Date(e.target.value);
    setShowParentalConsent(isMinor(dob));
    signupForm.setValue("dateOfBirth", e.target.value);
  };

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      await login(values.username, values.password);
      toast({ title: "Login successful", description: "Welcome back!" });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData, {
      onSuccess: () => {
        toast({ title: "Account created", description: "Welcome to Echoverse" });
        navigate("/dashboard");
      },
    });
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    const userIsMinor = isMinor(new Date(values.dateOfBirth));
    if (userIsMinor && !values.parentEmail) {
      signupForm.setError("parentEmail", { type: "manual", message: "Required for minors" });
      return;
    }

    try {
      setIsLoading(true);
      await signup({ ...values, dateOfBirth: new Date(values.dateOfBirth), isMinor: userIsMinor, provider: "local", plan: "free" });
      navigate(userIsMinor ? "/locked" : "/onboarding");
    } catch (err) {
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Auth | Echoverse</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 p-4">
        <div className="w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <Logo />
            <h1 className="text-3xl font-bold text-white mt-4">Echoverse Auth</h1>
            <p className="text-gray-400">Access your AI-powered workspace</p>
          </motion.div>

          <Tabs value={formMode} onValueChange={(v) => setFormMode(v as FormMode)} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField control={loginForm.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField control={registerForm.control} name="username" render={({ field }) => (
                        <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "Creating..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Signup */}
            <TabsContent value="signup">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Extended Signup</CardTitle></CardHeader>
                <CardContent>
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      {["firstName", "lastName", "username", "password", "confirmPassword"].map((name) => (
                        <FormField key={name} control={signupForm.control} name={name as any} render={({ field }) => (
                          <FormItem>
                            <FormLabel>{name.replace(/([A-Z])/g, " $1")}</FormLabel>
                            <FormControl><Input type={name.toLowerCase().includes("password") ? "password" : "text"} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                      <FormField control={signupForm.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl><Input type="date" onChange={handleDateOfBirthChange} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {showParentalConsent && (
                        <FormField control={signupForm.control} name="parentEmail" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Email</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                      <FormField control={signupForm.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserRole.GENERAL}>General</SelectItem>
                              <SelectItem value={UserRole.SCHOOL}>School</SelectItem>
                              <SelectItem value={UserRole.PERSONAL}>Personal</SelectItem>
                              <SelectItem value={UserRole.WORK}>Work</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={signupForm.control} name="acceptTerms" render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel>I accept the terms and conditions</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-4">
            <Button variant="outline" onClick={loginWithGoogle} className="w-full bg-white text-black hover:bg-gray-200">
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
