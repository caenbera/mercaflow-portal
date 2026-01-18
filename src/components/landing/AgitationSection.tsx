'use client';
import { DollarSign, Users, Phone, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AgitationSection() {
  const t = useTranslations('LandingPageAgitationSection');

  return (
    <section className="py-16 bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-6" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{t('agitation_title')}</h2>
                <p className="text-xl text-red-100">{t('agitation_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                        <div className="bg-red-500 rounded-full p-3 mt-1">
                            <DollarSign className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t('agitation_point1_title')}</h3>
                            <p className="text-red-100">{t('agitation_point1_desc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4">
                        <div className="bg-red-500 rounded-full p-3 mt-1">
                            <Users className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t('agitation_point2_title')}</h3>
                            <p className="text-red-100">{t('agitation_point2_desc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4">
                        <div className="bg-red-500 rounded-full p-3 mt-1">
                            <Phone className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">{t('agitation_point3_title')}</h3>
                            <p className="text-red-100">{t('agitation_point3_desc')}</p>
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="bg-white bg-opacity-10 p-8 rounded-xl">
                        <TrendingUp className="text-6xl text-yellow-300 mb-4 mx-auto" />
                        <h3 className="text-2xl font-bold mb-4">{t('agitation_box_title')}</h3>
                        <p className="text-red-100 text-lg">{t('agitation_box_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
