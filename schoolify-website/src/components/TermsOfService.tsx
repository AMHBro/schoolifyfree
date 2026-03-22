import React from "react";
import { Link } from "react-router-dom";

const TermsOfService: React.FC = () => {
  return (
    <div className="legal-page">
      <Link to="/" className="back-to-home">
        ← Back to Home
      </Link>
      <div className="container">
        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 2025</p>

          <div className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to Schoolify. These Terms of Service ("Terms") govern your
              use of our school management system platform and related services
              (collectively, the "Service"). By accessing or using our Service,
              you agree to be bound by these Terms. If you do not agree to these
              Terms, please do not use our Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Schoolify provides a comprehensive school management system that
              includes:
            </p>
            <ul>
              <li>Student information management</li>
              <li>Teacher and staff management tools</li>
              <li>Attendance tracking and reporting</li>
              <li>Grade management and analytics</li>
              <li>
                Communication tools for schools, teachers, parents, and students
              </li>
              <li>Administrative dashboard and reporting</li>
              <li>Mobile applications for various user types</li>
              <li>Local backup and data management</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>3. User Accounts and Registration</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              To use certain features of our Service, you must create an
              account. You agree to provide accurate, complete, and up-to-date
              information during the registration process.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You must notify us immediately of any unauthorized use of
              your account.
            </p>

            <h3>3.3 User Types</h3>
            <p>
              Our Service supports different user types with varying access
              levels:
            </p>
            <ul>
              <li>
                <strong>School Administrators:</strong> Full system access and
                management
              </li>
              <li>
                <strong>Teachers:</strong> Classroom and student management
                tools
              </li>
              <li>
                <strong>Students:</strong> Access to personal academic
                information
              </li>
              <li>
                <strong>Parents/Guardians:</strong> Access to their children's
                information
              </li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>4. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>
                Upload, post, or transmit harmful, offensive, or inappropriate
                content
              </li>
              <li>
                Attempt to gain unauthorized access to other accounts or systems
              </li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>
                Use the Service for any commercial purpose without authorization
              </li>
              <li>Share login credentials with unauthorized individuals</li>
              <li>
                Reverse engineer, decompile, or attempt to extract source code
              </li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>5. Educational Use and FERPA Compliance</h2>
            <p>
              Our Service is designed for educational purposes and complies with
              the Family Educational Rights and Privacy Act (FERPA) and other
              applicable educational privacy laws. Educational institutions
              using our Service maintain ownership and control of student
              educational records.
            </p>
          </div>

          <div className="legal-section">
            <h2>6. Data Ownership and Privacy</h2>
            <h3>6.1 Your Data</h3>
            <p>
              You retain ownership of all data you input into the Service. We do
              not claim ownership of your educational data, student records, or
              other information you store in our system.
            </p>

            <h3>6.2 Data Processing</h3>
            <p>
              We process your data solely to provide and improve our Service.
              Our data processing practices are detailed in our Privacy Policy,
              which is incorporated into these Terms by reference.
            </p>

            <h3>6.3 Local Backup</h3>
            <p>
              We provide local backup capabilities to ensure your data security
              and availability. You are responsible for maintaining appropriate
              backup procedures for your critical data.
            </p>
          </div>

          <div className="legal-section">
            <h2>7. Subscription and Payment</h2>
            <h3>7.1 Service Plans</h3>
            <p>
              We offer various service plans with different features and
              pricing. Details of available plans are provided on our website
              and may be updated from time to time.
            </p>

            <h3>7.2 Payment Terms</h3>
            <p>
              Payment is due according to the billing cycle selected for your
              subscription. All fees are non-refundable unless otherwise
              specified or required by law.
            </p>

            <h3>7.3 Free Trial</h3>
            <p>
              We may offer free trial periods for new users. Trial terms and
              limitations will be clearly communicated during signup.
            </p>
          </div>

          <div className="legal-section">
            <h2>8. Intellectual Property</h2>
            <h3>8.1 Our Rights</h3>
            <p>
              The Service, including its software, design, text, graphics, and
              other content, is owned by Schoolify and protected by intellectual
              property laws. You may not copy, modify, or distribute our
              intellectual property without permission.
            </p>

            <h3>8.2 Your Rights</h3>
            <p>
              Subject to these Terms, we grant you a limited, non-exclusive,
              non-transferable license to use the Service for your educational
              purposes.
            </p>
          </div>

          <div className="legal-section">
            <h2>9. Service Availability and Modifications</h2>
            <h3>9.1 Service Availability</h3>
            <p>
              We strive to maintain high service availability but cannot
              guarantee uninterrupted access. We may perform maintenance,
              updates, or modifications that temporarily affect service
              availability.
            </p>

            <h3>9.2 Service Modifications</h3>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect
              of the Service at any time. We will provide reasonable notice of
              material changes when possible.
            </p>
          </div>

          <div className="legal-section">
            <h2>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Schoolify shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service. Our total
              liability shall not exceed the amount paid by you for the Service
              in the twelve months preceding the claim.
            </p>
          </div>

          <div className="legal-section">
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Schoolify from any
              claims, damages, or expenses arising from your use of the Service,
              violation of these Terms, or infringement of any third-party
              rights.
            </p>
          </div>

          <div className="legal-section">
            <h2>12. Termination</h2>
            <h3>12.1 Termination by You</h3>
            <p>
              You may terminate your account at any time by contacting our
              support team. Upon termination, your access to the Service will
              cease.
            </p>

            <h3>12.2 Termination by Us</h3>
            <p>
              We may terminate your account if you violate these Terms or for
              any other reason with appropriate notice. We reserve the right to
              immediately terminate accounts for serious violations.
            </p>

            <h3>12.3 Data After Termination</h3>
            <p>
              Following termination, we will provide you with a reasonable
              opportunity to export your data. After this period, your data may
              be deleted in accordance with our data retention policies.
            </p>
          </div>

          <div className="legal-section">
            <h2>13. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              applicable laws. Any disputes arising from these Terms or your use
              of the Service shall be resolved through binding arbitration or in
              the courts of competent jurisdiction.
            </p>
          </div>

          <div className="legal-section">
            <h2>14. Updates to Terms</h2>
            <p>
              We may update these Terms from time to time to reflect changes in
              our Service or legal requirements. We will notify you of material
              changes by posting the updated Terms on our website and updating
              the "Last updated" date above. Your continued use of the Service
              after such changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div className="legal-section">
            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us:
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
            <h2>16. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will continue to be valid and enforceable to
              the fullest extent permitted by law.
            </p>
          </div>

          <div className="legal-section">
            <h2>17. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and Schoolify regarding your use of
              the Service and supersede all prior agreements and understandings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
