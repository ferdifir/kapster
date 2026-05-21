import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandLogos from "@/components/BrandLogos";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const cvStyle = { contentVisibility: "auto" } as React.CSSProperties;

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <div style={cvStyle}><BrandLogos /></div>
        <div style={cvStyle}><ProblemSection /></div>
        <div style={cvStyle}><FeaturesSection /></div>
        <div style={cvStyle}><HowItWorks /></div>
        <div style={cvStyle}><PricingSection /></div>
        <div style={cvStyle}><Testimonials /></div>
        <div style={cvStyle}><CTASection /></div>
      </main>
      <Footer />
    </>
  );
}
