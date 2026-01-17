"use client";

import { useTranslations } from 'next-intl';

export function ProductsSection() {
    const t = useTranslations('Landing');
    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('products_section_title')}</h2>
                    <p className="text-xl text-gray-600">{t('products_section_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div className="text-4xl mb-4 text-center">🥑</div>
                        <h3 className="text-xl font-bold text-center mb-3">{t('product_1_title')}</h3>
                        <p className="text-gray-600 text-center">{t('product_1_desc')}</p>
                        <div className="mt-4 text-center">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{t('product_1_tag')}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div className="text-4xl mb-4 text-center">🌶️</div>
                        <h3 className="text-xl font-bold text-center mb-3">{t('product_2_title')}</h3>
                        <p className="text-gray-600 text-center">{t('product_2_desc')}</p>
                        <div className="mt-4 text-center">
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">{t('product_2_tag')}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div className="text-4xl mb-4 text-center">🌿</div>
                        <h3 className="text-xl font-bold text-center mb-3">{t('product_3_title')}</h3>
                        <p className="text-gray-600 text-center">{t('product_3_desc')}</p>
                        <div className="mt-4 text-center">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{t('product_3_tag')}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div className="text-4xl mb-4 text-center">🍅</div>
                        <h3 className="text-xl font-bold text-center mb-3">{t('product_4_title')}</h3>
                        <p className="text-gray-600 text-center">{t('product_4_desc')}</p>
                        <div className="mt-4 text-center">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{t('product_4_tag')}</span>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-12">
                    <p className="text-xl text-gray-700 mb-4">{t('products_section_cta_prompt')}</p>
                    <a href="#contacto" className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition">
                        {t('products_section_cta_button')}
                    </a>
                </div>
            </div>
        </section>
    );
}
