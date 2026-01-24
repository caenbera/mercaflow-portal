'use client';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslations } from 'next-intl';


export function Testimonials() {
  const t = useTranslations('LandingPageTestimonials');

  const testimonials = [
    { text: t('testimonial_1_text'), name: t('testimonial_1_name'), location: t('testimonial_1_location'), initial: "M", color: "bg-green-500" },
    { text: t('testimonial_2_text'), name: t('testimonial_2_name'), location: t('testimonial_2_location'), initial: "C", color: "bg-accent" },
    { text: t('testimonial_3_text'), name: t('testimonial_3_name'), location: t('testimonial_3_location'), initial: "R", color: "bg-red-500" },
  ];

  return (
    <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('testimonials_title')}</h2>
                <p className="text-lg md:text-xl text-gray-600">{t('testimonials_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-gray-50 p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <CardContent className="p-0">
                      <div className="flex items-center mb-4">
                          <div className="flex text-yellow-400 mr-2">
                              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-5 h-5"/>)}
                          </div>
                      </div>
                      <p className="text-gray-700 mb-6 italic">{testimonial.text}</p>
                      <div className="flex items-center">
                          <Avatar className={`w-12 h-12 mr-4 ${testimonial.color}`}>
                            <AvatarFallback className="text-white font-bold bg-transparent">{testimonial.initial}</AvatarFallback>
                          </Avatar>
                          <div>
                              <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                              <p className="text-gray-600">{testimonial.location}</p>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
        </div>
    </section>
  );
}
