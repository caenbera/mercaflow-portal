'use client';

import { Leaf, MessageCircle, Clock, Shield, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SolutionSection() {
  const t = useTranslations('LandingPageSolutionSection');
  return (
    <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-6" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{t('solution_title')}</h2>
                <p className="text-xl text-green-100">{t('solution_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <Leaf className="text-4xl text-yellow-300 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold mb-4">{t('solution_1_title')}</h3>
                    <p className="text-green-100">{t('solution_1_desc')}</p>
                </div>
                <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <MessageCircle className="text-4xl text-yellow-300 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold mb-4">{t('solution_2_title')}</h3>
                    <p className="text-green-100">{t('solution_2_desc')}</p>
                </div>
                <div className="bg-white bg-opacity-10 p-8 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <Clock className="text-4xl text-yellow-300 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold mb-4">{t('solution_3_title')}</h3>
                    <p className="text-green-100">{t('solution_3_desc')}</p>
                </div>
            </div>
            <div className="bg-white bg-opacity-20 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-center mb-6">{t('solution_promise_title')}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                        <Shield className="text-yellow-300" size={24} />
                        <span className="text-lg">{t('solution_promise_1')}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Users className="text-yellow-300" size={24} />
                        <span className="text-lg">{t('solution_promise_2')}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
