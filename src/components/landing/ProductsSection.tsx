'use client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function ProductsSection() {
  const t = useTranslations('LandingPageProductsSection');
  
  const products = [
    { emoji: '🥑', title: t('product_1_title'), desc: t('product_1_desc'), tag: t('product_1_tag'), tagColor: 'bg-green-100 text-green-800' },
    { emoji: '🌶️', title: t('product_2_title'), desc: t('product_2_desc'), tag: t('product_2_tag'), tagColor: 'bg-red-100 text-red-800' },
    { emoji: '🌿', title: t('product_3_title'), desc: t('product_3_desc'), tag: t('product_3_tag'), tagColor: 'bg-green-100 text-green-800' },
    { emoji: '🍅', title: t('product_4_title'), desc: t('product_4_desc'), tag: t('product_4_tag'), tagColor: 'bg-green-100 text-green-800' },
  ];

  return (
    <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('products_section_title')}</h2>
                <p className="text-xl text-gray-600">{t('products_section_subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.title} className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-center">
                    <div className="text-4xl mb-4">{product.emoji}</div>
                    <CardHeader className="p-0">
                      <CardTitle className="text-xl font-bold mb-3">{product.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-gray-600">{product.desc}</p>
                      <div className="mt-4">
                          <Badge className={product.tagColor}>{product.tag}</Badge>
                      </div>
                    </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
                <p className="text-xl text-gray-700 mb-4">{t('products_section_cta_prompt')}</p>
                <Button asChild size="lg" className="bg-primary text-primary-foreground px-8 py-3 text-lg font-semibold hover:bg-green-700 transition">
                  <a href="#contacto">
                    {t('products_section_cta_button')}
                  </a>
                </Button>
            </div>
        </div>
    </section>
  );
}
