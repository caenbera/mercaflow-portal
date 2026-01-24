'use client';

import { Frown, Smile, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BridgeSection() {
  const t = useTranslations('LandingPageBridgeSection');

  const befores = [
    t('bridge_before_1'),
    t('bridge_before_2'),
    t('bridge_before_3'),
    t('bridge_before_4'),
    t('bridge_before_5'),
  ];

  const afters = [
    t('bridge_after_1'),
    t('bridge_after_2'),
    t('bridge_after_3'),
    t('bridge_after_4'),
    t('bridge_after_5'),
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('bridge_title')}</h2>
                <p className="text-lg md:text-xl text-gray-300">{t('bridge_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                {/* Before */}
                <div className="bg-red-900 bg-opacity-50 p-6 md:p-8 rounded-xl border border-red-500">
                    <div className="text-center mb-6">
                        <Frown className="text-4xl text-red-400 mb-4 mx-auto" />
                        <h3 className="text-xl md:text-2xl font-bold text-red-300">{t('bridge_before_title')}</h3>
                    </div>
                    <ul className="space-y-4 text-red-100">
                      {befores.map((item, i) => (
                        <li key={i} className="flex items-start space-x-3">
                            <X className="text-red-400 mt-1 shrink-0" />
                            <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                </div>
                {/* After */}
                <div className="bg-green-900 bg-opacity-50 p-6 md:p-8 rounded-xl border border-green-500">
                    <div className="text-center mb-6">
                        <Smile className="text-4xl text-green-400 mb-4 mx-auto" />
                        <h3 className="text-xl md:text-2xl font-bold text-green-300">{t('bridge_after_title')}</h3>
                    </div>
                    <ul className="space-y-4 text-green-100">
                        {afters.map((item, i) => (
                          <li key={i} className="flex items-start space-x-3">
                              <Check className="text-green-400 mt-1 shrink-0" />
                              <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="text-center mt-12">
                <div className="bg-accent p-6 rounded-xl inline-block">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{t('bridge_the_bridge_title')}</h3>
                    <p className="text-base md:text-lg">{t('bridge_the_bridge_desc')}</p>
                </div>
            </div>
        </div>
    </section>
  );
}
