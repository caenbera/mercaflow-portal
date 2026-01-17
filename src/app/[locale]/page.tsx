import { LandingHeader } from '@/components/landing/landing-header';
import { Hero } from '@/components/landing/hero';
import { ProblemSection } from '@/components/landing/problem-section';
import { AgitationSection } from '@/components/landing/agitation-section';
import { BridgeSection } from '@/components/landing/bridge-section';
import { SolutionSection } from '@/components/landing/solution-section';
import { Testimonials } from '@/components/landing/testimonials';
import { ProductsSection } from '@/components/landing/products-section';
import { SpecialOffer } from '@/components/landing/special-offer';
import { ContactForms } from '@/components/landing/contact-forms';
import { ContactInfo } from '@/components/landing/contact-info';
import { Footer } from '@/components/landing/footer';


export default function LandingPage() {
  return (
    <div className="bg-gray-50">
      <LandingHeader />
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
