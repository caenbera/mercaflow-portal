'use client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Truck, Handshake, Calculator, Gift } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                    Calidad y Frescura para tu 
                    <span className="text-yellow-300"> Negocio Latino</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                    El Sabor Auténtico que tu Negocio en Chicago Exige<br/>
                    <span className="text-yellow-200">Delivered with Reliability • Entregado con Confiabilidad</span>
                </p>
                <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-12">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="text-yellow-300" />
                        <span>Productos Frescos de Calidad</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Truck className="text-yellow-300" />
                        <span>Entregas Puntuales</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Handshake className="text-yellow-300" />
                        <span>Somos tu Parcero</span>
                    </div>
                </div>
                <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex justify-center">
                    <Button asChild size="lg" className="bg-accent text-white px-8 py-4 text-lg font-bold hover:bg-orange-600 transition animate-pulse h-auto">
                      <a href="#cotizacion">
                          <Calculator className="mr-2" />Pide una Cotización GRATIS
                      </a>
                    </Button>
                    <Button asChild size="lg" className="bg-yellow-400 text-gray-900 px-8 py-4 text-lg font-bold hover:bg-yellow-300 transition h-auto">
                      <a href="#muestra">
                          <Gift className="mr-2" />Solicita Caja de Muestra
                      </a>
                    </Button>
                </div>
            </div>
        </div>
    </section>
  );
}
