'use client';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                    <Image src="https://i.postimg.cc/y86gF4Cp/the-fresh-hub-noback.png" alt="The Fresh Hub" width={32} height={32} className="h-8 w-auto" />
                    <div>
                        <h3 className="text-lg font-bold font-headline">The Fresh Hub</h3>
                        <p className="text-gray-400 text-sm">Tu socio de confianza en Chicago</p>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <p className="text-gray-400 text-sm mb-2">© 2024 The Fresh Hub. Todos los derechos reservados.</p>
                    <p className="text-gray-400 text-sm">Sirviendo a la comunidad latina con orgullo</p>
                </div>
            </div>
        </div>
    </footer>
  );
}
