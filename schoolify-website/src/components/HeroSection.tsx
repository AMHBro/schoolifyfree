import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const HeroSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          {t('hero.title')}
          <br />
          {t('hero.titleSecondLine').includes('Next Era') ? (
            <>
              to the <span className="hero-gradient-text">Next Era</span>
            </>
          ) : (
            <>
              إلى <span className="hero-gradient-text">العصر القادم</span>
            </>
          )}
        </h1>
        <p className="hero-subtitle">
          {t('hero.subtitle')}
        </p>
        <div className="hero-cta">
          <button
            className="download-btn"
            onClick={() =>
              window.open("https://sms-coral-eight.vercel.app/", '_blank')
            }
          >
            <span className="download-icon">🚀</span>
            {t('hero.startNow')}
          </button>
        </div>
      </div>

      <div className="hero-demo">
        <div className="demo-window">
          <div className="demo-header">
            <div className="demo-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
            <div className="demo-title">{t('demo.title')}</div>
          </div>
          <div className="demo-content">
            <div className="demo-sidebar">
              <div className="demo-nav-item active">📊 {t('demo.dashboard')}</div>
              <div className="demo-nav-item">👨‍🏫 {t('demo.teachers')}</div>
              <div className="demo-nav-item">👨‍🎓 {t('demo.students')}</div>
              <div className="demo-nav-item">📚 {t('demo.subjects')}</div>
              <div className="demo-nav-item">📅 {t('demo.schedule')}</div>
              <div className="demo-nav-item">📋 {t('demo.attendance')}</div>
            </div>
            <div className="demo-main">
              <div className="demo-stats">
                <div className="stat-card">
                  <span className="stat-number">1,234</span>
                  <span className="stat-label">{t('demo.stats.students')}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">89</span>
                  <span className="stat-label">{t('demo.stats.teachers')}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">24</span>
                  <span className="stat-label">{t('demo.stats.subjects')}</span>
                </div>
              </div>
              <div className="demo-chart">
                <div className="chart-bars">
                  <div className="bar" style={{ height: "40%" }}></div>
                  <div className="bar" style={{ height: "70%" }}></div>
                  <div className="bar" style={{ height: "55%" }}></div>
                  <div className="bar" style={{ height: "85%" }}></div>
                  <div className="bar" style={{ height: "65%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
