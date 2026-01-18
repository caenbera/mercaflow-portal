import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from './i18n-config';

// This function now dynamically imports all message files for a given locale
// and combines them into a single object.
async function getMessages(locale: string) {
  try {
    const authMessages = (await import(`./messages/${locale}/Auth.json`)).default;
    const dashboardMessages = (await import(`./messages/${locale}/Dashboard.json`)).default;
    const landingPageAgitationSectionMessages = (await import(`./messages/${locale}/LandingPageAgitationSection.json`)).default;
    const landingPageBridgeSectionMessages = (await import(`./messages/${locale}/LandingPageBridgeSection.json`)).default;
    const landingPageContactFormsMessages = (await import(`./messages/${locale}/LandingPageContactForms.json`)).default;
    const landingPageContactInfoMessages = (await import(`./messages/${locale}/LandingPageContactInfo.json`)).default;
    const landingPageFooterMessages = (await import(`./messages/${locale}/LandingPageFooter.json`)).default;
    const landingPageHeaderMessages = (await import(`./messages/${locale}/LandingPageHeader.json`)).default;
    const landingPageHeroMessages = (await import(`./messages/${locale}/LandingPageHero.json`)).default;
    const landingPageProblemSectionMessages = (await import(`./messages/${locale}/LandingPageProblemSection.json`)).default;
    const landingPageProductsSectionMessages = (await import(`./messages/${locale}/LandingPageProductsSection.json`)).default;
    const landingPageSolutionSectionMessages = (await import(`./messages/${locale}/LandingPageSolutionSection.json`)).default;
    const landingPageSpecialOfferMessages = (await import(`./messages/${locale}/LandingPageSpecialOffer.json`)).default;
    const landingPageTestimonialsMessages = (await import(`./messages/${locale}/LandingPageTestimonials.json`)).default;
    const navigationBarMessages = (await import(`./messages/${locale}/NavigationBar.json`)).default;

    return {
      Auth: authMessages,
      Dashboard: dashboardMessages,
      LandingPageAgitationSection: landingPageAgitationSectionMessages,
      LandingPageBridgeSection: landingPageBridgeSectionMessages,
      LandingPageContactForms: landingPageContactFormsMessages,
      LandingPageContactInfo: landingPageContactInfoMessages,
      LandingPageFooter: landingPageFooterMessages,
      LandingPageHeader: landingPageHeaderMessages,
      LandingPageHero: landingPageHeroMessages,
      LandingPageProblemSection: landingPageProblemSectionMessages,
      LandingPageProductsSection: landingPageProductsSectionMessages,
      LandingPageSolutionSection: landingPageSolutionSectionMessages,
      LandingPageSpecialOffer: landingPageSpecialOfferMessages,
      LandingPageTestimonials: landingPageTestimonialsMessages,
      NavigationBar: navigationBarMessages,
    };
  } catch (error) {
    notFound();
  }
}

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }
 
  return {
    locale,
    messages: await getMessages(locale)
  };
});
