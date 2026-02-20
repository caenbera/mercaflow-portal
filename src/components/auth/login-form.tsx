
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { UserRole, UserProfile, User, Organization } from '@/types';
import { Link, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard';
    case 'driver':
      return '/driver';
    case 'client':
    default:
      return '/client/new-order';
  }
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [contextOrg, setContextOrg] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(false);
  
  const t = useTranslations('Auth');
  const locale = useLocale();

  // Carga dinámica de la marca del edificio
  useEffect(() => {
    async function fetchOrgContext() {
      if (!orgSlug) return;
      setIsOrgLoading(true);
      try {
        const q = query(collection(db, 'organizations'), where('slug', '==', orgSlug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setContextOrg({ id: snap.docs[0].id, ...snap.docs[0].data() } as Organization);
        }
      } catch (e) {
        console.error("Error fetching org context:", e);
      } finally {
        setIsOrgLoading(false);
      }
    }
    fetchOrgContext();
  }, [orgSlug]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setUnverifiedUser(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUnverifiedUser(user);
        toast({
          variant: "destructive",
          title: t('email_not_verified_title'),
          description: t('email_not_verified_desc_click'),
        });
        return; 
      }
      
      const userDocRef = doc(db, 'users', user.uid);
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

  async function handleResendVerification() {
    if (!unverifiedUser) return;
    setIsLoading(true);
    try {
        auth.languageCode = locale;
        await sendEmailVerification(unverifiedUser);
        toast({
            title: t('verification_resent_title'),
            description: t('verification_resent_desc'),
        });
        setUnverifiedUser(null); 
    } catch (error: any) {
        toast({ variant: 'destructive', title: t('error_title'), description: error.message || t('unknown_error') });
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
    <Card className="mx-auto max-w-sm w-full border-none shadow-2xl overflow-hidden rounded-3xl">
      <CardHeader className="text-center pb-2">
         <div className="flex flex-col items-center gap-2 mb-2">
          {isOrgLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          ) : contextOrg?.storeConfig?.logoUrl ? (
            <div className="relative h-16 w-32 mb-2">
              <img 
                src={contextOrg.storeConfig.logoUrl} 
                alt={contextOrg.name} 
                className="h-full w-full object-contain" 
              />
            </div>
          ) : (
            <div className="bg-primary/10 p-3 rounded-2xl mb-2">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-headline font-bold text-slate-800">
            {contextOrg ? contextOrg.name : "MercaFlow Portal"}
          </h1>
        </div>
        <CardTitle className="text-xl font-headline mt-2">{t('login_title')}</CardTitle>
        <CardDescription>
          {contextOrg ? `Accede al portal de ${contextOrg.name}` : t('login_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} className="h-11 rounded-xl" />
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
                      className="ml-auto inline-block text-xs underline disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
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
                        className="pr-10 h-11 rounded-xl"
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
            <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg" disabled={isLoading}>
              {isLoading ? t('signing_in') : t('sign_in')}
            </Button>
          </form>
        </Form>
        
        {unverifiedUser && (
          <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">{t('resend_prompt')}</p>
              <Button variant="link" onClick={handleResendVerification} disabled={isLoading} className="text-primary font-bold">
                  {t('resend_button')}
              </Button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t('no_account')}{' '}
          <Link href={`/signup${orgSlug ? `?org=${orgSlug}` : ''}`} className="underline font-bold text-primary">
            {t('sign_up')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
