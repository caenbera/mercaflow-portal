"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole, UserProfile } from '@/types';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard';
    case 'client':
    default:
      return '/client/new-order';
  }
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations('Auth');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }
      
      const userProfile = userDoc.data() as UserProfile;
      const userRole = userProfile.role || 'client';

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      const redirectPath = getRedirectPath(userRole);
      router.replace(redirectPath);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
      form.setError("email", { type: "manual", message: "Please enter your email to reset the password." });
      return;
    }
    const emailState = form.getFieldState('email');
    if (emailState.invalid) {
        toast({
            variant: "destructive",
            title: "Invalid Email",
            description: "Please enter a valid email address.",
        });
        return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: `Check your ${email} inbox for a link to reset your password.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="text-center">
         <div className="flex justify-center items-center gap-2 mb-4">
          <Sprout className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">Fresh Hub Portal</h1>
        </div>
        <CardTitle className="text-2xl font-headline">{t('login_title')}</CardTitle>
        <CardDescription>{t('login_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="ml-auto inline-block text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('forgot_password')}
                    </button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signing_in') : t('sign_in')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('no_account')}{' '}
          <Link href="/signup" className="underline">
            {t('sign_up')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
