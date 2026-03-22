import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const PrivacyPolicyTranslated: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="legal-page">
      <Link to="/" className="back-to-home">
        {t('privacy.backToHome')}
      </Link>
      <div className="container">
        <div className="legal-content">
          <h1>{t('privacy.title')}</h1>
          <p className="last-updated">{t('privacy.lastUpdated')}</p>

          {/* Introduction */}
          <div className="legal-section">
            <h2>{t('privacy.introduction.title')}</h2>
            <p>{t('privacy.introduction.content')}</p>
          </div>

          {/* Information We Collect */}
          <div className="legal-section">
            <h2>{t('privacy.informationWeCollect.title')}</h2>
            <h3>{t('privacy.informationWeCollect.personalInfo.title')}</h3>
            <p>{t('privacy.informationWeCollect.personalInfo.intro')}</p>
            <ul>
              <li><strong>{t('privacy.informationWeCollect.personalInfo.studentInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.studentInfo').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationWeCollect.personalInfo.parentInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.parentInfo').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationWeCollect.personalInfo.teacherInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.teacherInfo').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationWeCollect.personalInfo.adminInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.adminInfo').split(':').slice(1).join(':')}</li>
            </ul>

            <h3>{t('privacy.informationWeCollect.technicalInfo.title')}</h3>
            <p>{t('privacy.informationWeCollect.technicalInfo.intro')}</p>
            <ul>
              <li>{t('privacy.informationWeCollect.technicalInfo.deviceInfo')}</li>
              <li>{t('privacy.informationWeCollect.technicalInfo.ipAddresses')}</li>
              <li>{t('privacy.informationWeCollect.technicalInfo.usageStats')}</li>
              <li>{t('privacy.informationWeCollect.technicalInfo.logFiles')}</li>
            </ul>
          </div>

          {/* How We Use Your Information */}
          <div className="legal-section">
            <h2>{t('privacy.howWeUseInfo.title')}</h2>
            <p>{t('privacy.howWeUseInfo.intro')}</p>
            <ul>
              <li>{t('privacy.howWeUseInfo.providingServices')}</li>
              <li>{t('privacy.howWeUseInfo.managingEnrollment')}</li>
              <li>{t('privacy.howWeUseInfo.facilitatingCommunication')}</li>
              <li>{t('privacy.howWeUseInfo.generatingReports')}</li>
              <li>{t('privacy.howWeUseInfo.ensuringSecurity')}</li>
              <li>{t('privacy.howWeUseInfo.legalCompliance')}</li>
              <li>{t('privacy.howWeUseInfo.improvingServices')}</li>
            </ul>
          </div>

          {/* Information Sharing and Disclosure */}
          <div className="legal-section">
            <h2>{t('privacy.informationSharing.title')}</h2>
            <p>{t('privacy.informationSharing.intro')}</p>
            <ul>
              <li><strong>{t('privacy.informationSharing.educationalPartners').split(':')[0]}:</strong> {t('privacy.informationSharing.educationalPartners').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationSharing.legalCompliance').split(':')[0]}:</strong> {t('privacy.informationSharing.legalCompliance').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationSharing.safetyAndSecurity').split(':')[0]}:</strong> {t('privacy.informationSharing.safetyAndSecurity').split(':').slice(1).join(':')}</li>
              <li><strong>{t('privacy.informationSharing.serviceProviders').split(':')[0]}:</strong> {t('privacy.informationSharing.serviceProviders').split(':').slice(1).join(':')}</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="legal-section">
            <h2>{t('privacy.dataSecurity.title')}</h2>
            <p>{t('privacy.dataSecurity.intro')}</p>
            <ul>
              <li>{t('privacy.dataSecurity.encryption')}</li>
              <li>{t('privacy.dataSecurity.localBackup')}</li>
              <li>{t('privacy.dataSecurity.securityAudits')}</li>
              <li>{t('privacy.dataSecurity.accessControls')}</li>
              <li>{t('privacy.dataSecurity.employeeTraining')}</li>
            </ul>
          </div>

          {/* Data Retention */}
          <div className="legal-section">
            <h2>{t('privacy.dataRetention.title')}</h2>
            <p>{t('privacy.dataRetention.content')}</p>
          </div>

          {/* Your Rights and Choices */}
          <div className="legal-section">
            <h2>{t('privacy.yourRights.title')}</h2>
            <p>{t('privacy.yourRights.intro')}</p>
            <ul>
              <li>{t('privacy.yourRights.accessInfo')}</li>
              <li>{t('privacy.yourRights.correctionInfo')}</li>
              <li>{t('privacy.yourRights.deletionInfo')}</li>
              <li>{t('privacy.yourRights.restrictionProcessing')}</li>
              <li>{t('privacy.yourRights.dataPortability')}</li>
              <li>{t('privacy.yourRights.objectionProcessing')}</li>
            </ul>
            <p>
              {t('privacy.yourRights.contactUs')} {" "}
              <a href="mailto:support@schoolify.academy" className="email-address">
                {t('privacy.yourRights.supportEmail')}
              </a>
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="legal-section">
            <h2>{t('privacy.childrensPrivacy.title')}</h2>
            <p>{t('privacy.childrensPrivacy.content')}</p>
          </div>

          {/* International Data Transfers */}
          <div className="legal-section">
            <h2>{t('privacy.internationalDataTransfers.title')}</h2>
            <p>{t('privacy.internationalDataTransfers.content')}</p>
          </div>

          {/* Changes to This Privacy Policy */}
          <div className="legal-section">
            <h2>{t('privacy.policyChanges.title')}</h2>
            <p>{t('privacy.policyChanges.content')}</p>
          </div>

          {/* Contact Information */}
          <div className="legal-section">
            <h2>{t('privacy.contactInfo.title')}</h2>
            <p>{t('privacy.contactInfo.intro')}</p>
            <div className="contact-info">
              <p>
                <strong>{t('privacy.contactInfo.support')}</strong>{" "}
                <a href="mailto:support@schoolify.academy" className="email-address">
                  {t('privacy.contactInfo.supportEmail')}
                </a>
              </p>
              <p>
                <strong>{t('privacy.contactInfo.phone')}</strong> <span className="phone-number">{t('privacy.contactInfo.phoneNumber')}</span>
              </p>
            </div>
          </div>

          {/* Compliance */}
          <div className="legal-section">
            <h2>{t('privacy.compliance.title')}</h2>
            <p>{t('privacy.compliance.intro')}</p>
            <ul>
              <li>{t('privacy.compliance.gdpr')}</li>
              <li>{t('privacy.compliance.ccpa')}</li>
              <li>{t('privacy.compliance.ferpa')}</li>
              <li>{t('privacy.compliance.coppa')}</li>
              <li>{t('privacy.compliance.pipeda')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyTranslated;