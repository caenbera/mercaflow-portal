'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Gift, Send, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactForms() {
  const { toast } = useToast();
  const t = useTranslations('LandingPageContactForms');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    toast({
      title: t('form_submit_alert_title'),
      description: t('form_submit_alert_desc'),
    });
    form.reset();
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                        <Calculator className="text-green-600" />
                        {t('quote_form_title')}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="q-name" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_name_label')}</Label>
                            <Input id="q-name" type="text" placeholder={t('form_name_placeholder_es')} />
                        </div>
                        <div>
                            <Label htmlFor="q-business" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_business_name_label')}</Label>
                            <Input id="q-business" type="text" placeholder={t('form_business_name_placeholder')} />
                        </div>
                        <div>
                            <Label htmlFor="q-phone" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_phone_label')}</Label>
                            <Input id="q-phone" type="tel" placeholder="(773) 555-0123" />
                        </div>
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">{t('form_products_interest_label')}</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('form_select_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="veg">{t('form_product_option_1')}</SelectItem>
                                    <SelectItem value="spice">{t('form_product_option_2')}</SelectItem>
                                    <SelectItem value="fruit">{t('form_product_option_3')}</SelectItem>
                                    <SelectItem value="all">{t('form_product_option_4')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-primary text-primary-foreground py-4 text-lg font-bold hover:bg-green-700 transition h-auto">
                            <Send className="mr-2" />{t('quote_form_button')}
                        </Button>
                    </form>
                </div>

                {/* Muestra Form */}
                <div id="formulario-muestra" className="bg-orange-50 p-8 rounded-xl border border-orange-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                        <Gift className="text-accent" />
                        {t('sample_form_title')}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="s-name" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_name_label')}</Label>
                            <Input id="s-name" type="text" placeholder={t('form_name_placeholder')} />
                        </div>
                        <div>
                            <Label htmlFor="s-business" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_business_name_label')}</Label>
                            <Input id="s-business" type="text" placeholder={t('form_business_name_placeholder_sample')} />
                        </div>
                        <div>
                            <Label htmlFor="s-phone" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_phone_label')}</Label>
                            <Input id="s-phone" type="tel" placeholder={t('form_phone_placeholder')} />
                        </div>
                        <div>
                            <Label htmlFor="s-address" className="block text-sm font-semibold text-gray-700 mb-2">{t('form_address_label')}</Label>
                            <Textarea id="s-address" rows={3} placeholder={t('form_address_placeholder')} />
                        </div>
                        <Button type="submit" className="w-full bg-accent text-accent-foreground py-4 text-lg font-bold hover:bg-orange-600 transition h-auto">
                            <Truck className="mr-2" />{t('sample_form_button')}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </section>
  );
}
