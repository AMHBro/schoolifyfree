import React from "react";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import AdvancedFeaturesSection from "./AdvancedFeaturesSection";
import Footer from "./Footer";

const Home: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <AdvancedFeaturesSection />
      <Footer />
    </div>
  );
};

export default Home;
