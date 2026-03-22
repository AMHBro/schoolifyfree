import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const TermsOfServiceTranslated: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="legal-page">
      <Link to="/" className="back-to-home">
        {t('terms.backToHome')}
      </Link>
      <div className="container">
        <div className="legal-content">
          <h1>{t('terms.title')}</h1>
          <p className="last-updated">{t('terms.lastUpdated')}</p>

          {/* Acceptance of Terms */}
          <div className="legal-section">
            <h2>{t('terms.acceptanceOfTerms.title')}</h2>
            <p>{t('terms.acceptanceOfTerms.content')}</p>
          </div>

          {/* Description of Service */}
          <div className="legal-section">
            <h2>{t('terms.descriptionOfService.title')}</h2>
            <p>{t('terms.descriptionOfService.intro')}</p>
            <ul>
              <li>{t('terms.descriptionOfService.studentManagement')}</li>
              <li>{t('terms.descriptionOfService.teacherManagement')}</li>
              <li>{t('terms.descriptionOfService.attendanceTracking')}</li>
              <li>{t('terms.descriptionOfService.gradeManagement')}</li>
              <li>{t('terms.descriptionOfService.communicationTools')}</li>
              <li>{t('terms.descriptionOfService.adminDashboard')}</li>
              <li>{t('terms.descriptionOfService.mobileApps')}</li>
              <li>{t('terms.descriptionOfService.localBackup')}</li>
            </ul>
          </div>

          {/* User Accounts and Registration */}
          <div className="legal-section">
            <h2>{t('terms.userAccounts.title')}</h2>
            <h3>{t('terms.userAccounts.accountCreation.title')}</h3>
            <p>{t('terms.userAccounts.accountCreation.content')}</p>

            <h3>{t('terms.userAccounts.accountSecurity.title')}</h3>
            <p>{t('terms.userAccounts.accountSecurity.content')}</p>

            <h3>{t('terms.userAccounts.userTypes.title')}</h3>
            <p>{t('terms.userAccounts.userTypes.intro')}</p>
            <ul>
              <li><strong>{t('terms.userAccounts.userTypes.schoolAdmins').split(':')[0]}:</strong> {t('terms.userAccounts.userTypes.schoolAdmins').split(':').slice(1).join(':')}</li>
              <li><strong>{t('terms.userAccounts.userTypes.teachers').split(':')[0]}:</strong> {t('terms.userAccounts.userTypes.teachers').split(':').slice(1).join(':')}</li>
              <li><strong>{t('terms.userAccounts.userTypes.students').split(':')[0]}:</strong> {t('terms.userAccounts.userTypes.students').split(':').slice(1).join(':')}</li>
              <li><strong>{t('terms.userAccounts.userTypes.parents').split(':')[0]}:</strong> {t('terms.userAccounts.userTypes.parents').split(':').slice(1).join(':')}</li>
            </ul>
          </div>

          {/* Acceptable Use Policy */}
          <div className="legal-section">
            <h2>{t('terms.acceptableUse.title')}</h2>
            <p>{t('terms.acceptableUse.intro')}</p>
            <ul>
              <li>{t('terms.acceptableUse.violateLaws')}</li>
              <li>{t('terms.acceptableUse.infringeRights')}</li>
              <li>{t('terms.acceptableUse.uploadHarmful')}</li>
              <li>{t('terms.acceptableUse.unauthorizedAccess')}</li>
              <li>{t('terms.acceptableUse.interfereService')}</li>
              <li>{t('terms.acceptableUse.commercialUse')}</li>
              <li>{t('terms.acceptableUse.shareCredentials')}</li>
              <li>{t('terms.acceptableUse.reverseEngineer')}</li>
            </ul>
          </div>

          {/* Educational Use and FERPA Compliance */}
          <div className="legal-section">
            <h2>{t('terms.educationalUse.title')}</h2>
            <p>{t('terms.educationalUse.content')}</p>
          </div>

          {/* Data Ownership and Privacy */}
          <div className="legal-section">
            <h2>{t('terms.dataOwnership.title')}</h2>
            <h3>{t('terms.dataOwnership.yourData.title')}</h3>
            <p>{t('terms.dataOwnership.yourData.content')}</p>

            <h3>{t('terms.dataOwnership.dataProcessing.title')}</h3>
            <p>{t('terms.dataOwnership.dataProcessing.content')}</p>

            <h3>{t('terms.dataOwnership.localBackup.title')}</h3>
            <p>{t('terms.dataOwnership.localBackup.content')}</p>
          </div>

          {/* Subscription and Payment */}
          <div className="legal-section">
            <h2>{t('terms.subscriptionPayment.title')}</h2>
            <h3>{t('terms.subscriptionPayment.servicePlans.title')}</h3>
            <p>{t('terms.subscriptionPayment.servicePlans.content')}</p>

            <h3>{t('terms.subscriptionPayment.paymentTerms.title')}</h3>
            <p>{t('terms.subscriptionPayment.paymentTerms.content')}</p>

            <h3>{t('terms.subscriptionPayment.freeTrial.title')}</h3>
            <p>{t('terms.subscriptionPayment.freeTrial.content')}</p>
          </div>

          {/* Intellectual Property */}
          <div className="legal-section">
            <h2>{t('terms.intellectualProperty.title')}</h2>
            <h3>{t('terms.intellectualProperty.ourRights.title')}</h3>
            <p>{t('terms.intellectualProperty.ourRights.content')}</p>

            <h3>{t('terms.intellectualProperty.yourRights.title')}</h3>
            <p>{t('terms.intellectualProperty.yourRights.content')}</p>
          </div>

          {/* Service Availability and Modifications */}
          <div className="legal-section">
            <h2>{t('terms.serviceAvailability.title')}</h2>
            <h3>{t('terms.serviceAvailability.availability.title')}</h3>
            <p>{t('terms.serviceAvailability.availability.content')}</p>

            <h3>{t('terms.serviceAvailability.modifications.title')}</h3>
            <p>{t('terms.serviceAvailability.modifications.content')}</p>
          </div>

          {/* Limitation of Liability */}
          <div className="legal-section">
            <h2>{t('terms.limitationOfLiability.title')}</h2>
            <p>{t('terms.limitationOfLiability.content')}</p>
          </div>

          {/* Indemnification */}
          <div className="legal-section">
            <h2>{t('terms.indemnification.title')}</h2>
            <p>{t('terms.indemnification.content')}</p>
          </div>

          {/* Termination */}
          <div className="legal-section">
            <h2>{t('terms.termination.title')}</h2>
            <h3>{t('terms.termination.terminationByYou.title')}</h3>
            <p>{t('terms.termination.terminationByYou.content')}</p>

            <h3>{t('terms.termination.terminationByUs.title')}</h3>
            <p>{t('terms.termination.terminationByUs.content')}</p>

            <h3>{t('terms.termination.dataAfterTermination.title')}</h3>
            <p>{t('terms.termination.dataAfterTermination.content')}</p>
          </div>

          {/* Governing Law and Dispute Resolution */}
          <div className="legal-section">
            <h2>{t('terms.governingLaw.title')}</h2>
            <p>{t('terms.governingLaw.content')}</p>
          </div>

          {/* Updates to Terms */}
          <div className="legal-section">
            <h2>{t('terms.updatesToTerms.title')}</h2>
            <p>{t('terms.updatesToTerms.content')}</p>
          </div>

          {/* Contact Information */}
          <div className="legal-section">
            <h2>{t('terms.contactInfo.title')}</h2>
            <p>{t('terms.contactInfo.intro')}</p>
            <div className="contact-info">
              <p>
                <strong>{t('terms.contactInfo.support')}</strong>{" "}
                <a href="mailto:support@schoolify.academy" className="email-address">
                  {t('terms.contactInfo.supportEmail')}
                </a>
              </p>
              <p>
                <strong>{t('terms.contactInfo.phone')}</strong> <span className="phone-number">{t('terms.contactInfo.phoneNumber')}</span>
              </p>
            </div>
          </div>

          {/* Severability */}
          <div className="legal-section">
            <h2>{t('terms.severability.title')}</h2>
            <p>{t('terms.severability.content')}</p>
          </div>

          {/* Entire Agreement */}
          <div className="legal-section">
            <h2>{t('terms.entireAgreement.title')}</h2>
            <p>{t('terms.entireAgreement.content')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceTranslated;