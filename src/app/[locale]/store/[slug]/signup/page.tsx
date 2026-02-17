
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link, useRouter } from '@/navigation';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  address: z.string().min(10, "Dirección completa requerida para delivery"),
});

export default function StoreSignupPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState<string | null>(null);

  // Buscar el orgId real del slug al cargar
  useEffect(() => {
    async function getOrgId() {
        const q = query(collection(db, 'organizations'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setTargetOrgId(snap.docs[0].id);
    }
    getOrgId();
  }, [slug]);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', address: '' },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    if (!targetOrgId) return;
    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: values.email,
        businessName: values.name,
        contactPerson: values.name,
        address: values.address,
        role: 'customer',
        belongsToOrgId: targetOrgId,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      toast({ title: "Cuenta creada con éxito", description: "Ya puedes finalizar tu pedido." });
      router.push(`/store/${slug}/order`);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error", description: e.message || "No se pudo crear la cuenta." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-none rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary text-white text-center pb-8 pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <UserPlus className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Crea tu Cuenta</CardTitle>
          <CardDescription className="text-white/80">Recibe tus productos frescos en casa</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl><Input placeholder="Tu nombre" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl><Input placeholder="tu@correo.com" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección de Entrega</FormLabel>
                  <FormControl><Input placeholder="Calle, Apto, Ciudad..." {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Crea una Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Crear Cuenta y Continuar"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href={`/store/${slug}/login`} className="text-primary font-bold hover:underline">Inicia sesión</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
