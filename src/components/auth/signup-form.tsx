"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, WithFieldValue } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/types';

const SUPER_ADMIN_EMAIL = 'superadmin@thefreshhub.com';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine(data => {
  if (data.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return !!data.businessName && data.businessName.length >= 2;
  }
  return true;
}, {
  message: "Business name must be at least 2 characters.",
  path: ["businessName"],
}).refine(data => {
  if (data.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return !!data.phone && data.phone.length >= 10;
  }
  return true;
}, {
  message: "Please enter a valid phone number.",
  path: ["phone"],
}).refine(data => {
  if (data.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return !!data.address && data.address.length >= 5;
  }
  return true;
}, {
  message: "Please enter a valid address.",
  path: ["address"],
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const t = useTranslations('Auth');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });

  const watchedEmail = form.watch("email");

  useEffect(() => {
    setIsSuperAdmin(watchedEmail.toLowerCase() === SUPER_ADMIN_EMAIL);
  }, [watchedEmail]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userData: WithFieldValue<Partial<UserProfile>> = {
        uid: user.uid,
        email: values.email,
        createdAt: serverTimestamp(),
      };

      if (values.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
        userData.role = 'superadmin';
        userData.businessName = 'Super Admin';
      } else {
        userData.role = 'client';
        userData.businessName = values.businessName;
        userData.phone = values.phone;
        userData.address = values.address;
      }
      
      await setDoc(doc(db, "users", user.uid), userData);

      toast({
        title: "Account Created",
        description: "Welcome to The Fresh Hub! You can now log in.",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="text-center">
         <div className="flex justify-center items-center gap-2 mb-4">
          <Sprout className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">Fresh Hub Portal</h1>
        </div>
        <CardTitle className="text-2xl font-headline">{t('signup_title')}</CardTitle>
        <CardDescription>{t('signup_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
            {!isSuperAdmin && (
              <>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 555-5555" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Chicago, IL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mt-4" disabled={isLoading}>
              {isLoading ? t('creating_account') : t('create_account')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('has_account')}{' '}
          <Link href="/login" className="underline">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
