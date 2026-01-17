"use client";

import { useTranslations } from 'next-intl';

export function Hero() {
    const t = useTranslations('Landing');

    return (
        <section className="hero-bg text-white py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center fade-in">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shadow"
                        dangerouslySetInnerHTML={{ __html: t.raw('hero_title_html') }}
                    />
                    <p className="text-xl md:text-2xl mb-8 text-shadow"
                        dangerouslySetInnerHTML={{ __html: t.raw('hero_subtitle_html') }}
                    />
                    <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-12">
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-check-circle text-yellow-300 text-xl"></i>
                            <span className="text-lg">{t('hero_feature1')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-truck text-yellow-300 text-xl"></i>
                            <span className="text-lg">{t('hero_feature2')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-handshake text-yellow-300 text-xl"></i>
                            <span className="text-lg">{t('hero_feature3')}</span>
                        </div>
                    </div>
                    <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex justify-center">
                        <a href="#cotizacion" className="inline-block bg-accent-orange text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-orange-600 transition pulse-custom">
                            <i className="fas fa-calculator mr-2"></i>{t('hero_cta_quote')}
                        </a>
                        <a href="#muestra" className="inline-block bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition">
                            <i className="fas fa-gift mr-2"></i>{t('hero_cta_sample')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
