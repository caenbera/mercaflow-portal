
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
    const clientNewOrderPageMessages = (await import(`./messages/${locale}/ClientNewOrderPage.json`)).default;
    const suppliersPageMessages = (await import(`./messages/${locale}/SuppliersPage.json`)).default;
    const purchasingPageMessages = (await import(`./messages/${locale}/PurchasingPage.json`)).default;
    const clientsPageMessages = (await import(`./messages/${locale}/ClientsPage.json`)).default;
    const ordersPageMessages = (await import(`./messages/${locale}/OrdersPage.json`)).default;
    const pickingPageMessages = (await import(`./messages/${locale}/PickingPage.json`)).default;
    const clientDashboardPageMessages = (await import(`./messages/${locale}/ClientDashboardPage.json`)).default;
    const clientHistoryPageMessages = (await import(`./messages/${locale}/ClientHistoryPage.json`)).default;
    const clientAccountPageMessages = (await import(`./messages/${locale}/ClientAccountPage.json`)).default;
    const clientOffersPageMessages = (await import(`./messages/${locale}/ClientOffersPage.json`)).default;
    const clientRewardsPageMessages = (await import(`./messages/${locale}/ClientRewardsPage.json`)).default;
    const supportPageMessages = (await import(`./messages/${locale}/SupportPage.json`)).default;
    const clientInvoicesPageMessages = (await import(`./messages/${locale}/ClientInvoicesPage.json`)).default;
    const productsPageMessages = (await import(`./messages/${locale}/ProductsPage.json`)).default;
    const adminRewardsPageMessages = (await import(`./messages/${locale}/AdminRewardsPage.json`)).default;
    const adminSupportPageMessages = (await import(`./messages/${locale}/AdminSupportPage.json`)).default;
    const adminUsersPageMessages = (await import(`./messages/${locale}/AdminUsersPage.json`)).default;
    const notificationsMessages = (await import(`./messages/${locale}/Notifications.json`)).default;


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
      ClientNewOrderPage: clientNewOrderPageMessages,
      SuppliersPage: suppliersPageMessages,
      PurchasingPage: purchasingPageMessages,
      ClientsPage: clientsPageMessages,
      OrdersPage: ordersPageMessages,
      PickingPage: pickingPageMessages,
      ClientDashboardPage: clientDashboardPageMessages,
      ClientHistoryPage: clientHistoryPageMessages,
      ClientAccountPage: clientAccountPageMessages,
      ClientOffersPage: clientOffersPageMessages,
      ClientRewardsPage: clientRewardsPageMessages,
      SupportPage: supportPageMessages,
      ClientInvoicesPage: clientInvoicesPageMessages,
      ProductsPage: productsPageMessages,
      AdminRewardsPage: adminRewardsPageMessages,
      AdminSupportPage: adminSupportPageMessages,
      AdminUsersPage: adminUsersPageMessages,
      Notifications: notificationsMessages,
    };
  } catch (error) {
    notFound();
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as any)) {
    locale = 'es';
  }
  return {
    locale, // ← incluir esto
    messages: await getMessages(locale),
  };
});
