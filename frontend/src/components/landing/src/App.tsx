import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import GuestDashboard from './components/GuestDashboard';
import Footer from './components/Footer';

function App() {
  const [showGuestDashboard, setShowGuestDashboard] = useState(false);

  const handleExploreClick = () => {
    setShowGuestDashboard(true);
  };

  const handleBackClick = () => {
    setShowGuestDashboard(false);
  };

  if (showGuestDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <Header isGuestMode={true} />
        <GuestDashboard onBackClick={handleBackClick} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header onExploreClick={handleExploreClick} />
      <Hero onExploreClick={handleExploreClick} />
      <Features />
      <Footer />
    </div>
  );
}

export default App;