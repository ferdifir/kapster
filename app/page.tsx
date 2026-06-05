import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksPricingSection from "@/components/HowItWorksPricingSection";
import Testimonials from "@/components/Testimonials";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AffiliateFloatingBadge from "@/components/AffiliateFloatingBadge";

const cvStyle = { contentVisibility: "auto" } as React.CSSProperties;

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <div style={cvStyle}><ProblemSection /></div>
        <div style={cvStyle}><FeaturesSection /></div>
        <div style={cvStyle}><HowItWorksPricingSection /></div>
        <div style={cvStyle}><Testimonials /></div>
        <div style={cvStyle}><FAQSection /></div>
        <div style={cvStyle}><CTASection /></div>
      </main>
      <AffiliateFloatingBadge />
      <Footer />
    </>
  );
}
