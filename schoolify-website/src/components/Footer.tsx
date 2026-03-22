import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SocialIcon } from "react-social-icons";
import { useLanguage } from "../contexts/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleComingSoon = (appName: string) => {
    setPopupMessage(`${appName} ${t('footer.comingSoon')}`);
    setShowPopup(true);

    // Auto-hide popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{t('footer.connectWithUs')}</h3>
            <div className="social-links">
              <div className="social-link-wrapper">
                <SocialIcon 
                  url="https://www.facebook.com/share/16jvuAXNct/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  label={t('footer.facebook')}
                  style={{ height: 40, width: 40 }}
                  className="modern-social-icon"
                />
                <span className="social-label">{t('footer.facebook')}</span>
              </div>
              <div className="social-link-wrapper">
                <SocialIcon 
                  url="https://www.instagram.com/schoolify1?igsh=bGU2bW85MTk1OG9y" 
                  target="_blank"
                  rel="noopener noreferrer"
                  label={t('footer.instagram')}
                  style={{ height: 40, width: 40 }}
                  className="modern-social-icon"
                />
                <span className="social-label">{t('footer.instagram')}</span>
              </div>
              <div className="social-link-wrapper">
                <SocialIcon 
                  url="https://www.linkedin.com/in/schooli-fy-ab27b5378" 
                  target="_blank"
                  rel="noopener noreferrer"
                  label={t('footer.linkedin')}
                  style={{ height: 40, width: 40 }}
                  className="modern-social-icon"
                />
                <span className="social-label">{t('footer.linkedin')}</span>
              </div>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <strong>{t('footer.phone')}</strong>
                <span className="phone-number">{t('footer.phoneNumber')}</span>
              </div>
              <div className="contact-item">
                <strong>{t('footer.email')}</strong>
                <span className="email-address">{t('footer.emailAddress')}</span>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h3>{t('footer.quickLinks')}</h3>
            <div className="quick-links">
              <Link to="/privacy-policy" className="footer-link">
                {t('footer.privacyPolicy')}
              </Link>
              <Link to="/terms-of-service" className="footer-link">
                {t('footer.termsOfService')}
              </Link>
              <a
                href="mailto:support@schoolify.academy"
                className="footer-link"
              >
                {t('footer.support')}
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>{t('footer.downloadApps')}</h3>
            <div className="app-links">
              <button
                className="app-link"
                onClick={() => handleComingSoon(t('footer.teacherApp'))}
              >
                <span className="app-icon">📱</span>
                {t('footer.teacherApp')}
              </button>
              <button
                className="app-link"
                onClick={() => handleComingSoon(t('footer.studentApp'))}
              >
                <span className="app-icon">👨‍🎓</span>
                {t('footer.studentApp')}
              </button>
              <a
                href="https://sms-coral-eight.vercel.app/"
                className="app-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="app-icon">💻</span>
                {t('footer.adminDashboard')}
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.madeWithLove')}</p>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>

      {/* Coming Soon Popup */}
      {showPopup && (
        <div className="coming-soon-popup">
          <div className="popup-content">
            <div className="popup-icon">🚀</div>
            <p>{popupMessage}</p>
            <button className="popup-close" onClick={() => setShowPopup(false)}>
              ×
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
