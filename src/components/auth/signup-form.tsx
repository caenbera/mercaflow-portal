
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Info, ShieldAlert, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, WithFieldValue, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Link, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { UserProfile, AdminInvite, Organization } from '@/types';
import { debounce } from 'lodash';
import { useSearchParams } from 'next/navigation';

const SUPER_ADMIN_EMAIL = 'caenbera@gmail.com';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  contactPerson: z.string().min(2, "Nombre de contacto requerido."),
  businessName: z.string().optional(),
});

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org');
  const invitedEmail = searchParams.get('email');
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inviteData, setInviteData] = useState<AdminInvite | null>(null);
  const [targetOrg, setTargetOrg] = useState<Organization | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const t = useTranslations('Auth');
  const locale = useLocale();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      businessName: "",
      contactPerson: "",
      email: invitedEmail || "",
      password: "",
    },
  });

  const watchedEmail = form.watch("email");

  // Carga del contexto de marca por slug si existe
  useEffect(() => {
    async function fetchOrgContext() {
      if (!orgSlug) return;
      try {
        const q = query(collection(db, 'organizations'), where('slug', '==', orgSlug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const org = { id: snap.docs[0].id, ...snap.docs[0].data() } as Organization;
          setTargetOrg(org);
          form.setValue('businessName', org.name);
        }
      } catch (e) {
        console.error("Error fetching org context:", e);
      }
    }
    fetchOrgContext();
  }, [orgSlug, form]);

  const checkInvite = useCallback(
    debounce(async (email: string) => {
      if (!email || !z.string().email().safeParse(email).success) {
        setInviteData(null);
        // Si hay orgSlug, mantenemos el targetOrg del contexto, si no lo limpiamos
        if (!orgSlug) setTargetOrg(null);
        setInviteError(null);
        return;
      }

      setIsCheckingInvite(true);
      setInviteError(null);
      try {
        if (email.toLowerCase() === SUPER_ADMIN_EMAIL) {
          setIsSuperAdmin(true);
          setInviteData(null);
          setIsCheckingInvite(false);
          return;
        } else {
          setIsSuperAdmin(false);
        }

        const inviteDocRef = doc(db, 'adminInvites', email.toLowerCase());
        const docSnap = await getDoc(inviteDocRef);
        
        if (docSnap.exists() && docSnap.data().status === 'pending') {
          const invite = docSnap.data() as AdminInvite;
          setInviteData(invite);

          if (invite.organizationId) {
            const orgDoc = await getDoc(doc(db, 'organizations', invite.organizationId));
            if (orgDoc.exists()) {
              const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
              setTargetOrg(orgData);
              form.setValue('businessName', orgData.name);
            }
          }
        } else {
          setInviteData(null);
          if (!orgSlug) setTargetOrg(null);
          setInviteError("Este correo no tiene una invitación activa. Por favor, contacta al administrador.");
        }
      } catch (error) {
        console.error("Error checking for invite:", error);
        setInviteError("Ocurrió un error al validar tu acceso.");
      } finally {
        setIsCheckingInvite(false);
      }
    }, 500),
    [form, orgSlug]
  );

  useEffect(() => {
    checkInvite(watchedEmail);
  }, [watchedEmail, checkInvite]);

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    if (!inviteData && !isSuperAdmin) {
      toast({ variant: 'destructive', title: "Acceso denegado", description: "Necesitas una invitación para registrarte." });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userData: WithFieldValue<Partial<UserProfile>> = {
        uid: user.uid,
        email: values.email,
        createdAt: serverTimestamp(),
        contactPerson: values.contactPerson,
        status: 'active',
      };
      
      if (inviteData) {
        userData.role = inviteData.role;
        userData.organizationId = inviteData.organizationId;
        userData.businessName = values.businessName || targetOrg?.name || 'Personal MercaFlow';
        
        if (inviteData.role === 'client' && inviteData.organizationId) {
          const orgRef = doc(db, 'organizations', inviteData.organizationId);
          await updateDoc(orgRef, { ownerId: user.uid }).catch(e => console.error("Error updating org owner", e));
        }

        const inviteDocRef = doc(db, 'adminInvites', inviteData.email.toLowerCase());
        await updateDoc(inviteDocRef, { status: 'claimed' });

      } else if (isSuperAdmin) {
        userData.role = 'superadmin';
        userData.businessName = 'Super Admin Principal';
      }
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, userData);
      
      auth.languageCode = locale;
      await sendEmailVerification(user);

      toast({
        title: t('signup_success_title'),
        description: t('signup_success_desc'),
      });
      router.push(`/login${orgSlug ? `?org=${orgSlug}` : ''}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Card className="mx-auto max-w-sm w-full border-none shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-2">
         <div className="flex flex-col items-center gap-2 mb-2">
          {targetOrg?.storeConfig?.logoUrl ? (
            <div className="relative h-16 w-32 mb-2">
              <img 
                src={targetOrg.storeConfig.logoUrl} 
                alt={targetOrg.name} 
                className="h-full w-full object-contain" 
              />
            </div>
          ) : (
            <div className="bg-primary/10 p-3 rounded-2xl mb-2">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-headline font-bold">
            {targetOrg ? targetOrg.name : "MercaFlow"}
          </h1>
        </div>
        <CardTitle className="text-xl font-headline mt-2">{t('signup_title')}</CardTitle>
        <CardDescription>
          {targetOrg ? `Únete al equipo de ${targetOrg.name}` : "El registro requiere invitación previa."}
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
                  <FormLabel>Email Invitado</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="tu@empresa.com" {...field} className="h-11 rounded-xl" />
                      {isCheckingInvite && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {inviteError && (
              <Alert variant="destructive" className="bg-red-50 rounded-xl border-red-100">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">{inviteError}</AlertDescription>
              </Alert>
            )}

            {(inviteData || isSuperAdmin) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Alert className="bg-green-50 border-green-100 text-green-800 rounded-xl">
                  <Info className="h-4 w-4 !text-green-700" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Invitación Validada</AlertTitle>
                  <AlertDescription className="text-xs">
                    {isSuperAdmin 
                      ? "Identidad de Administrador confirmada." 
                      : `Acceso autorizado para ${targetOrg?.name || 'el edificio'}.`}
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} className="h-11 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isSuperAdmin && targetOrg && (
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negocio / Edificio</FormLabel>
                        <FormControl>
                          <Input readOnly className="bg-muted h-11 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crea tu Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg !mt-4" disabled={isLoading}>
                  {isLoading ? t('creating_account') : t('create_account')}
                </Button>
              </div>
            )}
          </form>
        </Form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t('has_account')}{' '}
          <Link href={`/login${orgSlug ? `?org=${orgSlug}` : ''}`} className="underline font-bold text-primary">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
