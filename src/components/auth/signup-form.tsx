
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, WithFieldValue, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Link, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { UserProfile, AdminInvite, UserRole } from '@/types';
import { debounce } from 'lodash';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const SUPER_ADMIN_EMAIL = 'caenbera@gmail.com';

// Schema is now a function to dynamically adjust validation based on invite status
const createSignupSchema = (isInvited: boolean, isSuperAdmin: boolean) => z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  businessName: z.string().optional(),
  contactPerson: z.string().min(isInvited || isSuperAdmin ? 0 : 2, "Contact person is required."),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine(data => {
  if (isSuperAdmin || isInvited) return true;
  return !!data.businessName && data.businessName.length >= 2;
}, {
  message: "Business name must be at least 2 characters.",
  path: ["businessName"],
}).refine(data => {
  if (isSuperAdmin || isInvited) return true;
  return !!data.phone && data.phone.length >= 10;
}, {
  message: "Please enter a valid phone number.",
  path: ["phone"],
}).refine(data => {
  if (isSuperAdmin || isInvited) return true;
  return !!data.address && data.address.length >= 5;
}, {
  message: "Please enter a valid address.",
  path: ["address"],
});


export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inviteData, setInviteData] = useState<AdminInvite | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);

  const t = useTranslations('Auth');
  const locale = useLocale();

  const formSchema = createSignupSchema(!!inviteData, isSuperAdmin);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });

  const watchedEmail = form.watch("email");

  // Debounced check for invite
  const debouncedCheckInvite = useCallback(
    debounce(async (email: string) => {
      if (!email || !z.string().email().safeParse(email).success) {
        setInviteData(null);
        setIsCheckingInvite(false);
        return;
      }
      setIsCheckingInvite(true);
      try {
        const inviteDocRef = doc(db, 'adminInvites', email.toLowerCase());
        const docSnap = await getDoc(inviteDocRef);
        if (docSnap.exists() && docSnap.data().status === 'pending') {
          setInviteData(docSnap.data() as AdminInvite);
        } else {
          setInviteData(null);
        }
      } catch (error) {
        console.error("Error checking for invite:", error);
        setInviteData(null);
      } finally {
        setIsCheckingInvite(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    setIsSuperAdmin(watchedEmail.toLowerCase() === SUPER_ADMIN_EMAIL);
    debouncedCheckInvite(watchedEmail);
  }, [watchedEmail, debouncedCheckInvite]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userData: WithFieldValue<Partial<UserProfile>> = {
        uid: user.uid,
        email: values.email,
        createdAt: serverTimestamp(),
        contactPerson: values.contactPerson,
        status: 'active', // All new users are active by default now
      };
      
      if (inviteData) {
        // Invited Admin/Picker
        userData.role = inviteData.role;
        userData.businessName = `${values.contactPerson} (${inviteData.role})`; // e.g., "John Doe (admin)"
        // Claim the invite
        const inviteDocRef = doc(db, 'adminInvites', inviteData.email);
        const updateInviteData = { status: 'claimed' };
        updateDoc(inviteDocRef, updateInviteData).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: inviteDocRef.path,
            operation: 'update',
            requestResourceData: updateInviteData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
      } else if (isSuperAdmin) {
        // Super Admin
        userData.role = 'superadmin';
        userData.businessName = 'Super Admin';
      } else {
        // Regular Client
        userData.role = 'client';
        userData.status = 'pending_approval';
        userData.businessName = values.businessName;
        userData.phone = values.phone;
        userData.address = values.address;
        userData.tier = 'standard';
        userData.creditLimit = 0;
        userData.paymentTerms = 'Net 15';
        userData.priceList = 'Standard';
      }
      
      const userDocRef = doc(db, "users", user.uid);
      setDoc(userDocRef, userData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
      auth.languageCode = locale;
      await sendEmailVerification(user);

      toast({
        title: t('signup_success_title'),
        description: t('signup_success_desc'),
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
          <h1 className="text-2xl font-headline font-bold">MercaFlow Portal</h1>
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

            {inviteData && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 !text-blue-700" />
                <AlertDescription className="text-xs">
                  Welcome! You've been invited as a <strong className="capitalize">{inviteData.role}</strong>. Please complete your registration.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{inviteData ? 'Full Name' : 'Contact Person'}</FormLabel>
                  <FormControl>
                    <Input placeholder={inviteData ? 'Your Name' : "Manager's Name"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isSuperAdmin && !inviteData && (
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
            <Button type="submit" className="w-full !mt-4" disabled={isLoading || isCheckingInvite}>
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
