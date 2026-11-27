import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import {
  APP_NAME,
  APP_DOMAIN,
  GOOGLE_SCOPES,
  GOOGLE_USER_DATA_POLICY_URL,
  SUPPORT_EMAIL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy · ${APP_NAME}`,
  description: `How ${APP_NAME} collects, uses, and protects school and Google account data.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`${APP_NAME} (${APP_DOMAIN}) is a school management platform. This policy explains what information we collect, how we use Google user data to create and manage Google Meet links, and how you can request access or deletion.`}
    >
      <LegalSection title="1. Who we are">
        <p>
          {APP_NAME} helps schools manage academics, admissions, attendance, fees, staff, and online
          classes. Our service is available at <strong className="text-[var(--theme-text)]">{APP_DOMAIN}</strong>.
          For privacy questions, email{" "}
          <a className="font-medium text-[var(--theme-primary)] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>Depending on how your school uses {APP_NAME}, we may process:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-[var(--theme-text)]">Account data:</strong> name, email address,
            phone number, role, and login credentials (stored as secure password hashes).
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">School / institute data:</strong> school name,
            branches, branding, settings, and subscription details.
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Student and parent data:</strong> student
            profiles, guardian contact details, admissions, attendance, fees, exams, and related
            academic records entered by authorized school staff.
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Staff data:</strong> employee profiles,
            timetables, leave, and teaching assignments as configured by the school.
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Usage and technical data:</strong> IP address,
            browser type, and basic server logs needed to operate and secure the service.
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Google account data (when connected):</strong>{" "}
            Google account email/profile identifiers and OAuth tokens required to create and manage
            Google Meet spaces for online classes. We request only the scopes listed below.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use Google user data">
        <p>
          {APP_NAME} integrates with Google so school staff can schedule online classes with Google
          Meet links. We use Google user data <strong className="text-[var(--theme-text)]">only</strong> to:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Authenticate the Google account that a school admin or teacher connects.</li>
          <li>Create, read, and manage Google Meet meeting spaces / links for online classes.</li>
          <li>Display connection status and the Google account email inside {APP_NAME} settings.</li>
        </ul>
        <p>
          We do <strong className="text-[var(--theme-text)]">not</strong> use Google user data for
          advertising, selling data, credit scoring, or unrelated AI/ML training. Google user data is
          not transferred to other apps except as needed to provide the Meet-link feature to your school.
        </p>
        <p className="text-[14px]">
          OAuth scopes we may request:
        </p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-[12px] text-[var(--theme-text)]">
          {GOOGLE_SCOPES.map((scope) => (
            <li key={scope}>{scope}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="4. Google API Services User Data Policy &amp; Limited Use">
        <p>
          {APP_NAME}&apos;s use and transfer to any other app of information received from Google APIs
          will adhere to the{" "}
          <a
            href={GOOGLE_USER_DATA_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--theme-primary)] hover:underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          In particular, Google user data obtained through Google APIs is used only to provide or
          improve user-facing features that are prominent in the requesting application&apos;s user
          interface (creating and managing Google Meet links for online classes). We do not allow
          humans to read this data unless you give us permission, it is necessary for security /
          compliance / legal reasons, or the use is limited to aggregate internal operations with
          your consent where required.
        </p>
      </LegalSection>

      <LegalSection title="5. Data storage and retention">
        <p>
          School and account data are stored on our application databases and hosting providers used
          to run {APP_NAME}. Google OAuth refresh/access tokens are stored securely (encrypted at
          rest where implemented) and used only to call Google Meet APIs on behalf of the connected
          account.
        </p>
        <p>
          We retain school data for as long as the school&apos;s account remains active or as needed
          to provide the service, comply with legal obligations, resolve disputes, and enforce our
          agreements. When a school closes its account or requests deletion, we delete or anonymize
          personal data within a reasonable period, except where retention is required by law.
        </p>
      </LegalSection>

      <LegalSection title="6. Sharing and selling of data">
        <p>
          We do <strong className="text-[var(--theme-text)]">not sell</strong> personal data or Google
          user data. We do not share personal data with third parties for their advertising or
          marketing. We may share limited data with infrastructure providers (hosting, email delivery,
          error monitoring) solely to operate {APP_NAME}, under appropriate contractual safeguards.
        </p>
        <p>
          Authorized users within a school (for example admins and teachers) can see the school data
          their role permits. We may disclose information if required by law or to protect the rights,
          safety, and security of users and {APP_NAME}.
        </p>
      </LegalSection>

      <LegalSection title="7. Access, deletion, and revoking Google access">
        <p>You can control your data in these ways:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-[var(--theme-text)]">In-app disconnect:</strong> school staff can
            disconnect the Google account from Online Classes / Google settings inside {APP_NAME},
            which stops further Meet API use and removes stored OAuth tokens for that connection.
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Google Account permissions:</strong> revoke{" "}
            {APP_NAME}&apos;s access at any time from your Google Account&apos;s third-party app
            settings (
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--theme-primary)] hover:underline"
            >
              myaccount.google.com/permissions
            </a>
            ).
          </li>
          <li>
            <strong className="text-[var(--theme-text)]">Access or deletion requests:</strong> email{" "}
            <a className="font-medium text-[var(--theme-primary)] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            from your school admin address to request a copy of your personal data or deletion of
            account data. We may need to verify your identity and school affiliation before acting.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use industry-standard measures such as encrypted transport (HTTPS), access controls, and
          hashed passwords to protect data. No method of transmission or storage is 100% secure; if
          you suspect unauthorized access, contact us immediately at {SUPPORT_EMAIL}.
        </p>
      </LegalSection>

      <LegalSection title="9. Children&apos;s data">
        <p>
          {APP_NAME} is used by schools and authorized staff. Student records may include information
          about minors and are processed on behalf of the school as the data controller / educational
          institution. Parents or guardians should contact their school first for student-record
          requests; we will assist the school as needed.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The “Last updated” date at the top of
          this page will change when we do. Continued use of {APP_NAME} after an update means you
          acknowledge the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Privacy requests and questions:{" "}
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
