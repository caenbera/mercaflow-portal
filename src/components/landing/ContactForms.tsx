'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Gift, Send, Truck } from 'lucide-react';

export function ContactForms() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    toast({
      title: "¡Gracias!",
      description: "Nos pondremos en contacto contigo muy pronto. ¡Que tengas un excelente día, compadre!",
    });
    form.reset();
  };

  return (
    <section id="cotizacion" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Listo para Ser tu Propio Jefe del Sabor?</h2>
                <p className="text-xl text-gray-600">Habla con un especialista ahora - Te atendemos en español</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                {/* Cotización Form */}
                <div className="bg-green-50 p-8 rounded-xl border border-green-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                        <Calculator className="text-green-600" />
                        Cotización Personalizada
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="q-name" className="block text-sm font-semibold text-gray-700 mb-2">Tu Nombre</Label>
                            <Input id="q-name" type="text" placeholder="Como te llamas, compadre" />
                        </div>
                        <div>
                            <Label htmlFor="q-business" className="block text-sm font-semibold text-gray-700 mb-2">Nombre de tu Negocio</Label>
                            <Input id="q-business" type="text" placeholder="Taquería La Guadalupana, Supermercado Mi Pueblo, etc." />
                        </div>
                        <div>
                            <Label htmlFor="q-phone" className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</Label>
                            <Input id="q-phone" type="tel" placeholder="(773) 555-0123" />
                        </div>
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">¿Qué productos te interesan más?</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="veg">Aguacates y Verduras</SelectItem>
                                    <SelectItem value="spice">Chiles y Especias</SelectItem>
                                    <SelectItem value="fruit">Frutas Tropicales</SelectItem>
                                    <SelectItem value="all">Todo - Surtido Completo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-primary text-primary-foreground py-4 text-lg font-bold hover:bg-green-700 transition h-auto">
                            <Send className="mr-2" />Enviar Solicitud
                        </Button>
                    </form>
                </div>

                {/* Muestra Form */}
                <div id="formulario-muestra" className="bg-orange-50 p-8 rounded-xl border border-orange-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                        <Gift className="text-accent" />
                        Caja de Muestra Gratis
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="s-name" className="block text-sm font-semibold text-gray-700 mb-2">Tu Nombre</Label>
                            <Input id="s-name" type="text" placeholder="Como te llamas" />
                        </div>
                        <div>
                            <Label htmlFor="s-business" className="block text-sm font-semibold text-gray-700 mb-2">Nombre de tu Negocio</Label>
                            <Input id="s-business" type="text" placeholder="Nombre de tu restaurante/supermercado" />
                        </div>
                        <div>
                            <Label htmlFor="s-phone" className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</Label>
                            <Input id="s-phone" type="tel" placeholder="Tu número de teléfono" />
                        </div>
                        <div>
                            <Label htmlFor="s-address" className="block text-sm font-semibold text-gray-700 mb-2">Dirección de Entrega</Label>
                            <Textarea id="s-address" rows={3} placeholder="Dónde te entregamos la muestra gratis" />
                        </div>
                        <Button type="submit" className="w-full bg-accent text-accent-foreground py-4 text-lg font-bold hover:bg-orange-600 transition h-auto">
                            <Truck className="mr-2" />Solicitar Entrega Gratis
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </section>
  );
}
