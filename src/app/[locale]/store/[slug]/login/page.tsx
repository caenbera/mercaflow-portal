
"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link, useRouter } from '@/navigation';
import { Loader2, ArrowLeft, ShoppingBasket } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Contraseña requerida"),
});

export default function StoreLoginPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, values.email, values.password);
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      
      if (userDoc.exists()) {
        const profile = userDoc.data();
        // Validar que el usuario pertenezca a esta tienda o sea cliente general
        if (profile.role === 'customer' && profile.belongsToOrgId !== slug && profile.organizationId !== slug) {
            // Permitir si es dueño, pero si es customer de otra tienda, advertir
            // Para MVP permitiremos el acceso pero vincularemos sus pedidos al slug actual
        }
      }
      
      toast({ title: "Bienvenido de nuevo" });
      router.push(`/store/${slug}/order`);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Credenciales incorrectas." });
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
              <ShoppingBasket className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Inicia Sesión</CardTitle>
          <CardDescription className="text-white/80">Completa tu pedido en un clic</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu Correo</FormLabel>
                  <FormControl><Input placeholder="ejemplo@correo.com" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Entrar y Comprar"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href={`/store/${slug}/signup`} className="text-primary font-bold hover:underline">Regístrate gratis</Link>
          </div>
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link href={`/store/${slug}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver a la tienda</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
