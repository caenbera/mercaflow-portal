"use client";

import { useTranslations } from 'next-intl';

export function BridgeSection() {
    const t = useTranslations('Landing');
    return (
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 gradient-text">{t('bridge_title')}</h2>
                    <p className="text-xl text-gray-300">{t('bridge_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Before */}
                    <div className="bg-red-900 bg-opacity-50 p-8 rounded-xl border border-red-500">
                        <div className="text-center mb-6">
                            <i className="fas fa-frown text-4xl text-red-400 mb-4"></i>
                            <h3 className="text-2xl font-bold text-red-300">{t('bridge_before_title')}</h3>
                        </div>
                        <ul className="space-y-4 text-red-100">
                            <li className="flex items-start space-x-3"><i className="fas fa-times text-red-400 mt-1"></i><span>{t('bridge_before_1')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-times text-red-400 mt-1"></i><span>{t('bridge_before_2')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-times text-red-400 mt-1"></i><span>{t('bridge_before_3')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-times text-red-400 mt-1"></i><span>{t('bridge_before_4')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-times text-red-400 mt-1"></i><span>{t('bridge_before_5')}</span></li>
                        </ul>
                    </div>
                    {/* After */}
                    <div className="bg-green-900 bg-opacity-50 p-8 rounded-xl border border-green-500">
                        <div className="text-center mb-6">
                            <i className="fas fa-smile text-4xl text-green-400 mb-4"></i>
                            <h3 className="text-2xl font-bold text-green-300">{t('bridge_after_title')}</h3>
                        </div>
                        <ul className="space-y-4 text-green-100">
                            <li className="flex items-start space-x-3"><i className="fas fa-check text-green-400 mt-1"></i><span>{t('bridge_after_1')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-check text-green-400 mt-1"></i><span>{t('bridge_after_2')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-check text-green-400 mt-1"></i><span>{t('bridge_after_3')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-check text-green-400 mt-1"></i><span>{t('bridge_after_4')}</span></li>
                            <li className="flex items-start space-x-3"><i className="fas fa-check text-green-400 mt-1"></i><span>{t('bridge_after_5')}</span></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-12">
                    <div className="bg-accent-orange p-6 rounded-xl inline-block">
                        <h3 className="text-2xl font-bold mb-2">{t('bridge_the_bridge_title')}</h3>
                        <p className="text-lg">{t('bridge_the_bridge_desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
