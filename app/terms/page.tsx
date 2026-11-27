import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, APP_DOMAIN, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service · ${APP_NAME}`,
  description: `Terms governing use of the ${APP_NAME} school management platform.`,
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      description={`These Terms of Service (“Terms”) govern access to and use of ${APP_NAME} at ${APP_DOMAIN}. By creating an account or using the service, you agree to these Terms.`}
    >
      <LegalSection title="1. Service description">
        <p>
          {APP_NAME} is a school management platform that helps educational institutions manage
          operations such as admissions, students, staff, attendance, fees, academics, communications,
          and online classes. Optional Google integration lets authorized users create and manage
          Google Meet links for online sessions.
        </p>
        <p>
          Features may vary by subscription plan. We may improve, add, or discontinue features with
          reasonable notice where practical.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and accounts">
        <p>
          You must be authorized to act for a school or educational organization when registering.
          You are responsible for maintaining accurate account information, safeguarding login
          credentials, and all activity under your school&apos;s accounts.
        </p>
        <p>
          Schools are responsible for obtaining any consents required to enter student, parent, or
          staff personal data into {APP_NAME}.
        </p>
      </LegalSection>

      <LegalSection title="3. User responsibilities">
        <p>When using {APP_NAME}, you agree to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Use the service only for lawful educational and administrative purposes.</li>
          <li>Not attempt to breach security, abuse rate limits, or disrupt the platform.</li>
          <li>Not upload unlawful, harmful, or infringing content.</li>
          <li>Respect student and staff privacy and apply appropriate access controls within your school.</li>
          <li>
            Use any Google / Meet integration only in accordance with Google&apos;s terms and solely
            for creating and managing online-class Meet links for your school.
          </li>
          <li>Keep subscription payments current where a paid plan applies.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. School data and intellectual property">
        <p>
          Schools retain ownership of the content and records they submit to {APP_NAME}. You grant us
          a limited license to host, process, and display that content solely to provide the service.
        </p>
        <p>
          {APP_NAME}, including its software, branding, and documentation, remains our intellectual
          property. You may not copy, reverse engineer, or resell the platform except as allowed by
          law or a written agreement with us.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-party services">
        <p>
          {APP_NAME} may integrate with third-party services such as Google (for Meet). Your use of
          those services is also subject to the third party&apos;s terms and privacy policies. We are
          not responsible for outages or changes made by third-party providers.
        </p>
      </LegalSection>

      <LegalSection title="6. Account suspension and termination">
        <p>
          We may suspend or terminate access if you violate these Terms, fail to pay applicable fees,
          misuse the service, or create risk to other users or the platform. Schools may stop using
          {APP_NAME} at any time and may request account closure by contacting{" "}
          <a className="font-medium text-[var(--theme-primary)] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p>
          Upon termination, access to the service ends. We may delete school data according to our
          Privacy Policy and any applicable legal retention requirements.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimer of warranties">
        <p>
          {APP_NAME} is provided on an “as is” and “as available” basis. To the fullest extent
          permitted by law, we disclaim warranties of merchantability, fitness for a particular
          purpose, and non-infringement. We do not guarantee uninterrupted or error-free operation,
          or that Meet links or other integrations will always be available.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          To the fullest extent permitted by applicable law, {APP_NAME} and its operators shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages, or any
          loss of profits, data, or goodwill, arising from your use of the service. Our total
          aggregate liability for claims relating to the service shall not exceed the fees paid by
          your school to us for the service in the three (3) months preceding the claim (or PKR 0 if
          you are on a free trial with no fees paid).
        </p>
      </LegalSection>

      <LegalSection title="9. Governing law">
        <p>
          These Terms are governed by the laws of the Islamic Republic of Pakistan, without regard to
          conflict-of-law principles. Courts in Pakistan shall have exclusive jurisdiction over
          disputes arising from these Terms or use of {APP_NAME}, unless mandatory law provides
          otherwise.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to these Terms">
        <p>
          We may update these Terms from time to time. The “Last updated” date at the top of this
          page will reflect changes. Continued use of the service after updates constitutes
          acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions about these Terms:{" "}
          <a className="font-medium text-[var(--theme-primary)] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          <br />
          Service: {APP_NAME} · {APP_DOMAIN}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
