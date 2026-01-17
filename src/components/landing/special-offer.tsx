"use client";

import { useTranslations } from 'next-intl';

export function SpecialOffer() {
    const t = useTranslations('Landing');
    return (
        <section id="muestra" className="py-16 bg-accent-orange text-white">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold mb-6">{t('offer_title')}</h2>
                <div className="bg-white bg-opacity-20 p-8 rounded-xl mb-8">
                    <h3 className="text-3xl font-bold mb-4">{t('offer_subtitle')}</h3>
                    <p className="text-xl mb-6">{t('offer_desc')}</p>
                    <ul className="text-lg space-y-2 mb-6">
                        <li>✅ {t('offer_item_1')}</li>
                        <li>✅ {t('offer_item_2')}</li>
                        <li>✅ {t('offer_item_3')}</li>
                        <li>✅ {t('offer_item_4')}</li>
                    </ul>
                    <p className="text-2xl font-bold mb-4">{t('offer_value')}</p>
                </div>
                <a href="#formulario-muestra" className="bg-white text-orange-600 px-10 py-4 rounded-lg text-xl font-bold hover:bg-gray-100 transition pulse-custom">
                    <i className="fas fa-gift mr-2"></i>{t('offer_cta')}
                </a>
            </div>
        </section>
    );
}
