'use client';
import { Button } from '@/components/ui/button';
import { Gift, Check } from 'lucide-react';

export function SpecialOffer() {
  const items = [
    "5 Aguacates Hass Premium",
    "2 Manojos de Cilantro Fresco",
    "1 Libra de Tomatillos",
    "Surtido de Chiles Variados",
  ];

  return (
    <section id="muestra" className="py-16 bg-accent text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6 flex items-center justify-center gap-3"><Gift size={40} /> Oferta Especial para Nuevos Socios</h2>
            <div className="bg-white bg-opacity-20 p-8 rounded-xl mb-8">
                <h3 className="text-3xl font-bold mb-4">Caja de Muestra GRATIS</h3>
                <p className="text-xl mb-6">Recibe una selección de nuestros mejores aguacates, cilantro, tomatillos y chiles. Sin compromiso, solo para que compruebes la calidad que ofrecemos.</p>
                <ul className="text-lg space-y-2 mb-6 text-left inline-block">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2"><Check /> {item}</li>
                    ))}
                </ul>
                <p className="text-2xl font-bold mb-4">Valor: $35 - HOY: GRATIS</p>
            </div>
            <Button asChild size="lg" className="bg-white text-orange-600 px-10 py-4 text-xl font-bold hover:bg-gray-100 transition animate-pulse h-auto">
              <a href="#formulario-muestra">
                  <Gift className="mr-2" />Solicitar Mi Caja Gratis
              </a>
            </Button>
        </div>
    </section>
  );
}
