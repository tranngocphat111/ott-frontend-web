import { useEffect } from 'react';
import Navbar from '../components/LandingPage/Navbar';
import HeroSection from '../components/LandingPage/HeroSection';
import FeaturesSection from '../components/LandingPage/FeaturesSection';
import SecuritySection from '../components/LandingPage/SecuritySection';
import DownloadSection from '../components/LandingPage/DownloadSection';
import Footer from '../components/LandingPage/Footer';

const LandingPage = () => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflowY: html.style.overflowY,
      htmlScrollBehavior: html.style.scrollBehavior,
      bodyOverflowY: body.style.overflowY,
      bodyOverscrollBehaviorY: body.style.overscrollBehaviorY,
      bodyHeight: body.style.height,
    };

    html.style.overflowY = 'auto';
    html.style.scrollBehavior = 'smooth';
    body.style.overflowY = 'auto';
    body.style.overscrollBehaviorY = 'auto';
    body.style.height = 'auto';

    return () => {
      html.style.overflowY = previous.htmlOverflowY;
      html.style.scrollBehavior = previous.htmlScrollBehavior;
      body.style.overflowY = previous.bodyOverflowY;
      body.style.overscrollBehaviorY = previous.bodyOverscrollBehaviorY;
      body.style.height = previous.bodyHeight;
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#fbf6f1]"
      style={{ fontFamily: 'var(--font-body)', touchAction: 'pan-y' }}
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <DownloadSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
