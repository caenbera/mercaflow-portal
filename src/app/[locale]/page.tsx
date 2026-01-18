import { LandingPageHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { AgitationSection } from '@/components/landing/AgitationSection';
import { BridgeSection } from '@/components/landing/BridgeSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { Testimonials } from '@/components/landing/Testimonials';
import { ProductsSection } from '@/components/landing/ProductsSection';
import { SpecialOffer } from '@/components/landing/SpecialOffer';
import { ContactForms } from '@/components/landing/ContactForms';
import { ContactInfo } from '@/components/landing/ContactInfo';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-800 font-body">
      <LandingPageHeader />
      <main>
        <Hero />
        <ProblemSection />
        <AgitationSection />
        <BridgeSection />
        <SolutionSection />
        <Testimonials />
        <ProductsSection />
        <SpecialOffer />
        <ContactForms />
        <ContactInfo />
      </main>
      <Footer />
    </div>
  );
}
