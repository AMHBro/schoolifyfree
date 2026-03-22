import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import Home from "./components/Home";
import PrivacyPolicyTranslated from "./components/PrivacyPolicyTranslated";
import TermsOfServiceTranslated from "./components/TermsOfServiceTranslated";
import DeleteAccount from "./components/DeleteAccount";
import LanguageSwitcher from "./components/LanguageSwitcher";
import "./App.css";

function AppContent() {
  const { isRTL } = useLanguage();

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", isRTL ? "ar" : "en");
  }, [isRTL]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyTranslated />} />
        <Route
          path="/terms-of-service"
          element={<TermsOfServiceTranslated />}
        />
        <Route path="/delete-account" element={<DeleteAccount />} />
      </Routes>
      <LanguageSwitcher />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
