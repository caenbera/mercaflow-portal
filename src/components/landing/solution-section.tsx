"use client";

import { useTranslations } from 'next-intl';

export function SolutionSection() {
    const t = useTranslations('Landing');
    return (
        <section className="py-16 bg-green-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-6 text-shadow">{t('solution_title')}</h2>
                    <p className="text-xl text-green-100">{t('solution_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center card-hover">
                        <i className="fas fa-leaf text-4xl text-yellow-300 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">{t('solution_1_title')}</h3>
                        <p className="text-green-100">{t('solution_1_desc')}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center card-hover">
                        <i className="fas fa-comments text-4xl text-yellow-300 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">{t('solution_2_title')}</h3>
                        <p className="text-green-100">{t('solution_2_desc')}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center card-hover">
                        <i className="fas fa-clock text-4xl text-yellow-300 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">{t('solution_3_title')}</h3>
                        <p className="text-green-100">{t('solution_3_desc')}</p>
                    </div>
                </div>
                <div className="bg-white bg-opacity-20 p-8 rounded-xl">
                    <h3 className="text-2xl font-bold text-center mb-6">{t('solution_promise_title')}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-shield-alt text-yellow-300 text-2xl"></i>
                            <span className="text-lg">{t('solution_promise_1')}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-users text-yellow-300 text-2xl"></i>
                            <span className="text-lg">{t('solution_promise_2')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
