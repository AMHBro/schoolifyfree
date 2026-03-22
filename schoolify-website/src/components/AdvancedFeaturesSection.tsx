import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const AdvancedFeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: "👥",
      titleKey: "advancedFeatures.userFriendly.title",
      descriptionKey: "advancedFeatures.userFriendly.description",
    },
    {
      icon: "🎨",
      titleKey: "advancedFeatures.modernUIFeature.title",
      descriptionKey: "advancedFeatures.modernUIFeature.description",
    },
    {
      icon: "⚡",
      titleKey: "advancedFeatures.lightningFast.title",
      descriptionKey: "advancedFeatures.lightningFast.description",
    },
    {
      icon: "🔧",
      titleKey: "advancedFeatures.flexibleSystem.title",
      descriptionKey: "advancedFeatures.flexibleSystem.description",
    },
    {
      icon: "🎯",
      titleKey: "advancedFeatures.schoolDashboard.title",
      descriptionKey: "advancedFeatures.schoolDashboard.description",
    },
    {
      icon: "👨‍🎓",
      titleKey: "advancedFeatures.studentApp.title",
      descriptionKey: "advancedFeatures.studentApp.description",
    },
    {
      icon: "👨‍🏫",
      titleKey: "advancedFeatures.teacherApp.title",
      descriptionKey: "advancedFeatures.teacherApp.description",
    },
    {
      icon: "🔄",
      titleKey: "advancedFeatures.continuousUpdates.title",
      descriptionKey: "advancedFeatures.continuousUpdates.description",
    },
    {
      icon: "💾",
      titleKey: "advancedFeatures.localBackup.title",
      descriptionKey: "advancedFeatures.localBackup.description",
    },
    {
      icon: "💬",
      titleKey: "advancedFeatures.builtInChats.title",
      descriptionKey: "advancedFeatures.builtInChats.description",
    },
    {
      icon: "📊",
      titleKey: "advancedFeatures.advancedAnalytics.title",
      descriptionKey: "advancedFeatures.advancedAnalytics.description",
    },
    {
      icon: "🚀",
      titleKey: "advancedFeatures.advancedTechnology.title",
      descriptionKey: "advancedFeatures.advancedTechnology.description",
    },
    {
      icon: "🎯",
      titleKey: "advancedFeatures.easyToUse.title",
      descriptionKey: "advancedFeatures.easyToUse.description",
    },
  ];

  return (
    <section className="advanced-features-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('advancedFeatures.title')}</h2>
          <p>
            {t('advancedFeatures.subtitle')}
          </p>
        </div>

        <div className="advanced-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="advanced-feature-card">
              <div className="advanced-feature-icon">{feature.icon}</div>
              <h3>{t(feature.titleKey)}</h3>
              <p>{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeaturesSection;
