"use client";

import { useTranslations } from 'next-intl';

export function Testimonials() {
    const t = useTranslations('Landing');
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('testimonials_title')}</h2>
                    <p className="text-xl text-gray-600">{t('testimonials_subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-gray-50 p-8 rounded-xl card-hover">
                        <div className="flex items-center mb-4">
                            <div className="flex text-yellow-400 mr-2">
                                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6 italic">{t('testimonial_1_text')}</p>
                        <div className="flex items-center">
                            <div className="bg-green-500 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <span className="text-white font-bold">M</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t('testimonial_1_name')}</h4>
                                <p className="text-gray-600">{t('testimonial_1_location')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-xl card-hover">
                        <div className="flex items-center mb-4">
                            <div className="flex text-yellow-400 mr-2">
                                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6 italic">{t('testimonial_2_text')}</p>
                        <div className="flex items-center">
                            <div className="bg-accent-orange rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <span className="text-white font-bold">C</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t('testimonial_2_name')}</h4>
                                <p className="text-gray-600">{t('testimonial_2_location')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-xl card-hover">
                        <div className="flex items-center mb-4">
                            <div className="flex text-yellow-400 mr-2">
                                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6 italic">{t('testimonial_3_text')}</p>
                        <div className="flex items-center">
                            <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <span className="text-white font-bold">R</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t('testimonial_3_name')}</h4>
                                <p className="text-gray-600">{t('testimonial_3_location')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
