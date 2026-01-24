'use client';
import { AlertTriangle, Clock, Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ProblemSection() {
  const t = useTranslations('LandingPageProblemSection');
  return (
    <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('problem_title')}</h2>
                <p className="text-lg md:text-xl text-gray-600">{t('problem_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-red-50 p-6 md:p-8 rounded-xl border-l-4 border-red-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="text-red-500 text-3xl mb-4">
                        <AlertTriangle size={36} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{t('problem_1_title')}</h3>
                    <p className="text-gray-700">{t('problem_1_desc')}</p>
                </div>
                <div className="bg-orange-50 p-6 md:p-8 rounded-xl border-l-4 border-orange-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="text-orange-500 text-3xl mb-4">
                        <Clock size={36} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{t('problem_2_title')}</h3>
                    <p className="text-gray-700">{t('problem_2_desc')}</p>
                </div>
                <div className="bg-yellow-50 p-6 md:p-8 rounded-xl border-l-4 border-yellow-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="text-yellow-600 text-3xl mb-4">
                        <Languages size={36} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{t('problem_3_title')}</h3>
                    <p className="text-gray-700">{t('problem_3_desc')}</p>
                </div>
            </div>
        </div>
    </section>
  );
}
