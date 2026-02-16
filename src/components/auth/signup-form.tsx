
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, WithFieldValue, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Link, useRouter, usePathname } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { UserProfile, AdminInvite, Organization } from '@/types';
import { debounce } from 'lodash';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
      email: searchParams.get('email') || "",
      password: "",
    },
  });

  const watchedEmail = form.watch("email");

  const checkInvite = useCallback(
    debounce(async (email: string) => {
      if (!email || !z.string().email().safeParse(email).success) {
        setInviteData(null);
        setTargetOrg(null);
        setInviteError(null);
        return;
      }

      setIsCheckingInvite(true);
      setInviteError(null);
      try {
        // 1. Verificar si el correo es el del Super Admin
        if (email.toLowerCase() === SUPER_ADMIN_EMAIL) {
          setIsSuperAdmin(true);
          setInviteData(null);
          setIsCheckingInvite(false);
          return;
        } else {
          setIsSuperAdmin(false);
        }

        // 2. Buscar invitación en la colección adminInvites
        const inviteDocRef = doc(db, 'adminInvites', email.toLowerCase());
        const docSnap = await getDoc(inviteDocRef);
        
        if (docSnap.exists() && docSnap.data().status === 'pending') {
          const invite = docSnap.data() as AdminInvite;
          setInviteData(invite);

          // Si la invitación tiene un organizationId, cargamos los datos del edificio
          if (invite.organizationId) {
            const orgDoc = await getDoc(doc(db, 'organizations', invite.organizationId));
            if (orgDoc.exists()) {
              setTargetOrg({ id: orgDoc.id, ...orgDoc.data() } as Organization);
              form.setValue('businessName', orgDoc.data().name);
            }
          }
        } else {
          // Bloqueo estricto: Si no hay invitación ni es superadmin, no puede registrarse
          setInviteData(null);
          setTargetOrg(null);
          setInviteError("Este correo no tiene una invitación activa. Por favor, contacta al administrador.");
        }
      } catch (error) {
        console.error("Error checking for invite:", error);
        setInviteError("Ocurrió un error al validar tu acceso.");
      } finally {
        setIsCheckingInvite(false);
      }
    }, 500),
    [form]
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
        userData.businessName = values.businessName || targetOrg?.name || 'Cliente MercaFlow';
        
        // Si el rol es el del dueño del edificio, actualizamos el ownerId de la organización
        if (inviteData.role === 'client' && inviteData.organizationId) {
          const orgRef = doc(db, 'organizations', inviteData.organizationId);
          await updateDoc(orgRef, { ownerId: user.uid }).catch(e => console.error("Error updating org owner", e));
        }

        // Marcar invitación como reclamada
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
      router.push('/login');
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
    <Card className="mx-auto max-w-sm w-full border-none shadow-2xl">
      <CardHeader className="text-center">
         <div className="flex justify-center items-center gap-2 mb-4">
          <Sprout className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">MercaFlow</h1>
        </div>
        <CardTitle className="text-2xl font-headline">{t('signup_title')}</CardTitle>
        <CardDescription>El registro requiere invitación previa del administrador.</CardDescription>
      </CardHeader>
      <CardContent>
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
                      <Input placeholder="tu@empresa.com" {...field} />
                      {isCheckingInvite && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {inviteError && (
              <Alert variant="destructive" className="bg-red-50">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">{inviteError}</AlertDescription>
              </Alert>
            )}

            {(inviteData || isSuperAdmin) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <Info className="h-4 w-4 !text-green-700" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-wider">Invitación Validada</AlertTitle>
                  <AlertDescription className="text-xs">
                    {isSuperAdmin 
                      ? "Identidad de Administrador confirmada." 
                      : `Acceso autorizado para gestionar "${targetOrg?.name || 'tu edificio'}".`}
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
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
                        <FormLabel>Nombre del Negocio</FormLabel>
                        <FormControl>
                          <Input readOnly className="bg-muted" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full !mt-4" disabled={isLoading}>
                  {isLoading ? t('creating_account') : t('create_account')}
                </Button>
              </div>
            )}
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          {t('has_account')}{' '}
          <Link href="/login" className="underline font-bold text-primary">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
