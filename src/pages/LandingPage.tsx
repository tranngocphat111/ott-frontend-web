import Navbar from '../components/LandingPage/Navbar';
import HeroSection from '../components/LandingPage/HeroSection';
import FeaturesSection from '../components/LandingPage/FeaturesSection';
import SecuritySection from '../components/LandingPage/SecuritySection';
import DownloadSection from '../components/LandingPage/DownloadSection';
import Footer from '../components/LandingPage/Footer';

const LandingPage = () => (
  <div className="min-h-screen" style={{ fontFamily: 'var(--font-body)' }}>
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <SecuritySection />
    <DownloadSection />
    <Footer />
  </div>
);

export default LandingPage;
