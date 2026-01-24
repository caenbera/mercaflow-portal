'use client';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactInfo() {
  const t = useTranslations('LandingPageContactInfo');

  return (
    <section id="contacto" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('contact_info_title')}</h2>
                <p className="text-lg md:text-xl text-gray-300">{t('contact_info_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                    <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Phone size={28} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2">{t('contact_info_call_title')}</h3>
                    <p className="text-gray-300 mb-4">{t('contact_info_call_desc')}</p>
                    <a href="tel:+1-555-FRESH" className="text-green-400 text-xl font-bold hover:text-green-300">
                        (555) FRESH-HUB
                    </a>
                </div>
                <div className="text-center">
                    <div className="bg-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Mail size={28} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2">{t('contact_info_email_title')}</h3>
                    <p className="text-gray-300 mb-4">{t('contact_info_email_desc')}</p>
                    <a href="mailto:hola@thefreshhub.com" className="text-orange-400 text-lg hover:text-orange-300">
                        hola@thefreshhub.com
                    </a>
                </div>
                <div className="text-center">
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MapPin size={28} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2">{t('contact_info_location_title')}</h3>
                    <p className="text-gray-300 mb-4">{t('contact_info_location_desc')}</p>
                    <p className="text-blue-400">{t('contact_info_location_hours')}</p>
                </div>
            </div>
            <div className="text-center mt-12 pt-8 border-t border-gray-700">
                <p className="text-lg text-gray-300 mb-4">{t('contact_info_callback_prompt')}</p>
                <Button asChild size="lg" className="w-full md:w-auto bg-primary text-primary-foreground px-8 py-3 text-base md:text-lg font-semibold hover:bg-green-700 transition">
                  <a href="#cotizacion">
                    {t('contact_info_callback_button')}
                  </a>
                </Button>
            </div>
        </div>
    </section>
  );
}
