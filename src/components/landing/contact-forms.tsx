"use client";

import { useTranslations } from 'next-intl';

export function ContactForms() {
    const t = useTranslations('Landing');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert(t('form_submit_alert'));
    };

    return (
        <section id="cotizacion" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('contact_forms_title')}</h2>
                    <p className="text-xl text-gray-600">{t('contact_forms_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Cotización Form */}
                    <div className="bg-green-50 p-8 rounded-xl border border-green-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            <i className="fas fa-calculator text-green-600 mr-2"></i>
                            {t('quote_form_title')}
                        </h3>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_name_label')}</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder={t('form_name_placeholder_es')} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_business_name_label')}</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder={t('form_business_name_placeholder')} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_phone_label')}</label>
                                <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="(773) 555-0123" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_products_interest_label')}</label>
                                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                    <option>{t('form_product_option_1')}</option>
                                    <option>{t('form_product_option_2')}</option>
                                    <option>{t('form_product_option_3')}</option>
                                    <option>{t('form_product_option_4')}</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition">
                                <i className="fas fa-paper-plane mr-2"></i>{t('quote_form_button')}
                            </button>
                        </form>
                    </div>

                    {/* Muestra Form */}
                    <div id="formulario-muestra" className="bg-orange-50 p-8 rounded-xl border border-orange-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            <i className="fas fa-gift text-accent-orange mr-2"></i>
                            {t('sample_form_title')}
                        </h3>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_name_label')}</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder={t('form_name_placeholder')} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_business_name_label')}</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder={t('form_business_name_placeholder_sample')} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_phone_label')}</label>
                                <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder={t('form_phone_placeholder')} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_address_label')}</label>
                                <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" rows={3} placeholder={t('form_address_placeholder')}></textarea>
                            </div>
                            <button type="submit" className="w-full bg-accent-orange text-white py-4 rounded-lg text-lg font-bold hover:bg-orange-600 transition">
                                <i className="fas fa-truck mr-2"></i>{t('sample_form_button')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
