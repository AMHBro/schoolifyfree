import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="features-section">
      <div className="container">
        <div className="features-grid">
          <div className="feature-card ai-powered">
            <div className="feature-icon">🎨</div>
            <h3>{t('features.modernUI.title')}</h3>
            <p>
              {t('features.modernUI.description')}
            </p>
            <div className="feature-visual">
              <div className="ai-robot">
                <div className="robot-head">
                  <div className="robot-eyes">
                    <div className="eye"></div>
                    <div className="eye"></div>
                  </div>
                  <div className="robot-mouth"></div>
                </div>
                <div className="robot-body">
                  <div className="robot-screen">
                    <div className="screen-lines">
                      <div className="line"></div>
                      <div className="line"></div>
                      <div className="line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card privacy">
            <div className="feature-icon">🔧</div>
            <h3>{t('features.flexible.title')}</h3>
            <p>
              {t('features.flexible.description')}
            </p>
            <div className="privacy-visual">
              <div className="shield">
                <div className="shield-icon">⚙️</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ease-of-use-section">
          <div className="ease-content">
            <h2>{t('features.easeOfUse.title')}</h2>
            <p>
              {t('features.easeOfUse.description')}
            </p>
          </div>
          <div className="ease-visual">
            <div className="mobile-demo">
              <div className="mobile-frame">
                <div className="mobile-screen">
                  <div className="mobile-header">
                    <div className="mobile-title">{t('demo.teacherApp')}</div>
                    <div className="mobile-user">👨‍🏫</div>
                  </div>
                  <div className="mobile-stats">
                    <div className="mobile-stat">
                      <span className="mobile-stat-number">23</span>
                      <span className="mobile-stat-label">{t('demo.classes')}</span>
                    </div>
                    <div className="mobile-stat">
                      <span className="mobile-stat-number">456</span>
                      <span className="mobile-stat-label">{t('demo.stats.students')}</span>
                    </div>
                  </div>
                  <div className="mobile-chart">
                    <div className="chart-title">{t('demo.weeklyAttendance')}</div>
                    <div className="attendance-bars">
                      <div
                        className="attendance-bar"
                        style={{ height: "80%" }}
                      ></div>
                      <div
                        className="attendance-bar"
                        style={{ height: "95%" }}
                      ></div>
                      <div
                        className="attendance-bar"
                        style={{ height: "88%" }}
                      ></div>
                      <div
                        className="attendance-bar"
                        style={{ height: "92%" }}
                      ></div>
                      <div
                        className="attendance-bar"
                        style={{ height: "97%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
