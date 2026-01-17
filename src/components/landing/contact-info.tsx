"use client";

import { useTranslations } from 'next-intl';

export function ContactInfo() {
    const t = useTranslations('Landing');
    return (
        <section id="contacto" className="py-16 bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">{t('contact_info_title')}</h2>
                    <p className="text-xl text-gray-300">{t('contact_info_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-phone text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('contact_info_call_title')}</h3>
                        <p className="text-gray-300 mb-4">{t('contact_info_call_desc')}</p>
                        <a href="tel:+1-555-FRESH" className="text-green-400 text-xl font-bold hover:text-green-300">
                            (555) FRESH-HUB
                        </a>
                    </div>
                    <div className="text-center">
                        <div className="bg-accent-orange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-envelope text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('contact_info_email_title')}</h3>
                        <p className="text-gray-300 mb-4">{t('contact_info_email_desc')}</p>
                        <a href="mailto:hola@thefreshhub.com" className="text-orange-400 text-lg hover:text-orange-300">
                            hola@thefreshhub.com
                        </a>
                    </div>
                    <div className="text-center">
                        <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-map-marker-alt text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('contact_info_location_title')}</h3>
                        <p className="text-gray-300 mb-4">{t('contact_info_location_desc')}</p>
                        <p className="text-blue-400">{t('contact_info_location_hours')}</p>
                    </div>
                </div>
                <div className="text-center mt-12 pt-8 border-t border-gray-700">
                    <p className="text-lg text-gray-300 mb-4">{t('contact_info_callback_prompt')}</p>
                    <a href="#cotizacion" className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-green-700 transition">
                        {t('contact_info_callback_button')}
                    </a>
                </div>
            </div>
        </section>
    );
}
