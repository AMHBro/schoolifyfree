import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const PrivacyPolicy: React.FC = () => {
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

          <div className="legal-section">
            <h2>{t('privacy.introduction.title')}</h2>
            <p>
              {t('privacy.introduction.content')}
            </p>
          </div>

          <div className="legal-section">
            <h2>{t('privacy.informationWeCollect.title')}</h2>
            <h3>{t('privacy.informationWeCollect.personalInfo.title')}</h3>
            <p>{t('privacy.informationWeCollect.personalInfo.intro')}</p>
            <ul>
              <li>
                <strong>{t('privacy.informationWeCollect.personalInfo.studentInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.studentInfo').split(':')[1]}
              </li>
              <li>
                <strong>{t('privacy.informationWeCollect.personalInfo.parentInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.parentInfo').split(':')[1]}
              </li>
              <li>
                <strong>{t('privacy.informationWeCollect.personalInfo.teacherInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.teacherInfo').split(':')[1]}
              </li>
              <li>
                <strong>{t('privacy.informationWeCollect.personalInfo.adminInfo').split(':')[0]}:</strong> {t('privacy.informationWeCollect.personalInfo.adminInfo').split(':')[1]}
              </li>
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

          <div className="legal-section">
            <h2>4. Information Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties except in the following
              circumstances:
            </p>
            <ul>
              <li>
                <strong>Educational Partners:</strong> With authorized
                educational service providers who assist in delivering
                educational services
              </li>
              <li>
                <strong>Legal Compliance:</strong> When required by law, court
                order, or regulatory requirements
              </li>
              <li>
                <strong>Safety and Security:</strong> To protect the safety of
                students, staff, or the general public
              </li>
              <li>
                <strong>Service Providers:</strong> With trusted third-party
                service providers who assist in operating our platform
              </li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>5. Data Security</h2>
            <p>
              We implement comprehensive security measures to protect your
              information:
            </p>
            <ul>
              <li>End-to-end encryption for data transmission</li>
              <li>Secure local backup systems</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and user authentication protocols</li>
              <li>Employee training on data protection practices</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>6. Data Retention</h2>
            <p>
              We retain personal information for as long as necessary to fulfill
              the purposes outlined in this Privacy Policy, unless a longer
              retention period is required or permitted by law. Student academic
              records may be retained according to educational regulations and
              institutional policies.
            </p>
          </div>

          <div className="legal-section">
            <h2>7. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have the following rights:
            </p>
            <ul>
              <li>Access to your personal information</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>
                Deletion of your personal information (subject to legal
                requirements)
              </li>
              <li>Restriction of processing in certain circumstances</li>
              <li>Data portability rights</li>
              <li>Objection to certain processing activities</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{" "}
              <a href="mailto:support@schoolify.academy" className="email-address">
                support@schoolify.academy
              </a>
            </p>
          </div>

          <div className="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Our services are designed for educational institutions and may
              involve the collection of information from students under the age
              of 18. We comply with applicable laws regarding children's
              privacy, including FERPA (Family Educational Rights and Privacy
              Act) and COPPA (Children's Online Privacy Protection Act) where
              applicable. We obtain appropriate consent from parents or
              educational institutions before collecting information from
              minors.
            </p>
          </div>

          <div className="legal-section">
            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your country of residence. We ensure that such
              transfers comply with applicable data protection laws and
              implement appropriate safeguards to protect your information.
            </p>
          </div>

          <div className="legal-section">
            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or legal requirements. We will notify you
              of any material changes by posting the updated policy on our
              website and updating the "Last updated" date above. Your continued
              use of our services after such modifications constitutes
              acceptance of the updated Privacy Policy.
            </p>
          </div>

          <div className="legal-section">
            <h2>11. Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="contact-info">
              <p>
                <strong>Support:</strong>{" "}
                <a href="mailto:support@schoolify.academy" className="email-address">
                  support@schoolify.academy
                </a>
              </p>
              <p>
                <strong>Phone:</strong> <span className="phone-number">+964 776 0612 021</span>
              </p>
            </div>
          </div>

          <div className="legal-section">
            <h2>12. Compliance</h2>
            <p>
              This Privacy Policy is designed to comply with applicable privacy
              laws and regulations, including but not limited to:
            </p>
            <ul>
              <li>General Data Protection Regulation (GDPR)</li>
              <li>California Consumer Privacy Act (CCPA)</li>
              <li>Family Educational Rights and Privacy Act (FERPA)</li>
              <li>Children's Online Privacy Protection Act (COPPA)</li>
              <li>
                Personal Information Protection and Electronic Documents Act
                (PIPEDA)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
