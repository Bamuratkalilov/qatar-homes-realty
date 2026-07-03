import { Shield } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — Qatar Homes Realty",
  description: "How Qatar Homes Realty collects, uses, and protects your personal information.",
}

const LAST_UPDATED = "2 July 2026"
const COMPANY     = "Qatar Homes Realty"
const EMAIL       = process.env.NEXT_PUBLIC_AGENCY_EMAIL || "info@qatarhomesrealty.com"
const PHONE       = process.env.NEXT_PUBLIC_AGENCY_PHONE || "+974 XXXX XXXX"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 text-[15px] leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2"><span className="text-slate-400 mt-1 flex-shrink-0">•</span><span>{children}</span></li>
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Legal</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-400 text-sm mb-10">Last updated: {LAST_UPDATED} · Draft</p>

      <div className="prose-none">

        <Section title="1. Who We Are">
          <p>
            <strong className="text-slate-800">{COMPANY}</strong> ("we", "us", "our") is a real estate
            agency based in Doha, Qatar. We operate the website{" "}
            <span className="font-medium text-slate-800">qatar-homes-realty.vercel.app</span> and associated
            services that help people buy, sell, and rent property in Qatar.
          </p>
          <p>
            This Privacy Policy explains what personal data we collect, why we collect it, how we use it,
            and your rights under Qatar's Personal Data Protection Law (Law No. 13 of 2016) and applicable
            international standards.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="space-y-2 mt-2">
            <Li><strong className="text-slate-700">Contact information</strong> — name, email address, phone number, WhatsApp number when you submit an inquiry or contact form.</Li>
            <Li><strong className="text-slate-700">Property search data</strong> — listings you viewed, saved, or enquired about; filters you applied (type, price range, area).</Li>
            <Li><strong className="text-slate-700">WhatsApp conversations</strong> — messages sent to our WhatsApp Business number, processed by our AI assistant to respond to your enquiry.</Li>
            <Li><strong className="text-slate-700">Account data</strong> — email address and password (stored as a secure hash) if you create an account.</Li>
            <Li><strong className="text-slate-700">Usage data</strong> — pages visited, time spent, device type, browser, and approximate location (country/city) via server logs.</Li>
            <Li><strong className="text-slate-700">Photos and documents</strong> — property images uploaded by agents via our dashboard (not from visitors).</Li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use your personal data only for the following purposes:</p>
          <ul className="space-y-2 mt-2">
            <Li>To respond to your property enquiries and connect you with the right agent.</Li>
            <Li>To send you relevant property listings that match your stated preferences (only if you requested this).</Li>
            <Li>To operate and improve our website, fix bugs, and analyse usage patterns.</Li>
            <Li>To train and run our AI assistant (WhatsApp bot) — your conversations are used to generate replies in real time and are stored so our agents can follow up.</Li>
            <Li>To comply with our legal obligations under Qatari law.</Li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-slate-800">not</strong> sell your personal data. We do not use it
            for advertising targeting on third-party platforms.
          </p>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <p>We process your data on the following legal bases:</p>
          <ul className="space-y-2 mt-2">
            <Li><strong className="text-slate-700">Consent</strong> — when you voluntarily submit an enquiry form or start a WhatsApp conversation with us.</Li>
            <Li><strong className="text-slate-700">Legitimate interests</strong> — to operate our business, respond to enquiries, and improve our services.</Li>
            <Li><strong className="text-slate-700">Legal obligation</strong> — to comply with requirements under Qatar law (e.g. real estate regulations).</Li>
          </ul>
        </Section>

        <Section title="5. Third-Party Services">
          <p>We use the following trusted third-party services that may process your data:</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-[13px]">
                <tr>
                  <th className="text-left px-4 py-2.5">Service</th>
                  <th className="text-left px-4 py-2.5">Purpose</th>
                  <th className="text-left px-4 py-2.5">Data shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Vercel", "Website hosting", "Server logs, IP address"],
                  ["Cloudinary", "Property photo storage", "Uploaded images only"],
                  ["Mapbox", "Interactive maps", "Approximate location (map view)"],
                  ["Meta (WhatsApp)", "WhatsApp Business messaging", "Your phone number and messages"],
                  ["Anthropic (Claude AI)", "AI assistant replies", "WhatsApp message content"],
                  ["Neon / PostgreSQL", "Database", "All stored data (encrypted at rest)"],
                ].map(([svc, purpose, data]) => (
                  <tr key={svc} className="text-slate-600">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{svc}</td>
                    <td className="px-4 py-2.5">{purpose}</td>
                    <td className="px-4 py-2.5 text-slate-500">{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="6. WhatsApp & AI Processing">
          <p>
            When you message us on WhatsApp, your messages are received by our WhatsApp Business
            account and processed by an AI assistant (powered by Anthropic's Claude). The AI reads your
            message, checks available property listings, and generates a reply on our behalf.
          </p>
          <p>
            Your phone number and conversation are stored in our database so that our human agents can
            review and follow up. If you share your name and contact details, we may save you as a lead
            in our CRM system and an agent will contact you.
          </p>
          <p>
            You can ask us to delete your WhatsApp conversation history at any time by emailing{" "}
            <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a>.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>We keep your data for as long as necessary to provide our services:</p>
          <ul className="space-y-2 mt-2">
            <Li>Enquiry and contact data — 3 years from last contact.</Li>
            <Li>WhatsApp conversations — 2 years from last message.</Li>
            <Li>Account data — until you delete your account.</Li>
            <Li>Server logs — 90 days.</Li>
          </ul>
        </Section>

        <Section title="8. Your Rights">
          <p>
            Under Qatar's Personal Data Protection Law, you have the right to:
          </p>
          <ul className="space-y-2 mt-2">
            <Li><strong className="text-slate-700">Access</strong> — request a copy of the personal data we hold about you.</Li>
            <Li><strong className="text-slate-700">Correction</strong> — ask us to fix inaccurate data.</Li>
            <Li><strong className="text-slate-700">Deletion</strong> — request that we delete your personal data, subject to legal obligations.</Li>
            <Li><strong className="text-slate-700">Objection</strong> — object to processing of your data for direct marketing.</Li>
            <Li><strong className="text-slate-700">Withdrawal of consent</strong> — you can withdraw consent at any time without affecting the lawfulness of prior processing.</Li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="9. Data Security">
          <p>
            We take reasonable technical and organisational measures to protect your personal data,
            including encrypted database storage, HTTPS-only connections, and access controls
            limiting who can view personal data within our team.
          </p>
          <p>
            No method of transmission over the internet is 100% secure. If you believe your data has
            been compromised, please contact us immediately.
          </p>
        </Section>

        <Section title="10. Cookies">
          <p>
            We use only essential cookies required for the website to function (authentication session
            cookie). We do not use advertising or analytics cookies. No cookie consent banner is
            shown because we do not use non-essential cookies.
          </p>
        </Section>

        <Section title="11. Children's Privacy">
          <p>
            Our services are not directed at children under 18. We do not knowingly collect personal
            data from children. If you believe a child has provided us with personal data, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on
            this page with a new "Last updated" date. Material changes will be communicated via email
            if you have an account with us.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            If you have any questions about this Privacy Policy or how we handle your data, please
            contact:
          </p>
          <div className="mt-3 bg-slate-50 rounded-xl p-5 text-sm space-y-1">
            <p className="font-semibold text-slate-800">{COMPANY}</p>
            <p>Doha, Qatar</p>
            <p>
              Email:{" "}
              <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a>
            </p>
            <p>Phone: {PHONE}</p>
          </div>
        </Section>

      </div>

      {/* Draft notice */}
      <div className="mt-10 border border-amber-200 bg-amber-50 rounded-xl px-5 py-4 text-sm text-amber-700">
        <strong>Note:</strong> This is a draft privacy policy. Please review with a qualified legal
        professional before publishing, particularly to ensure compliance with Qatar's Personal Data
        Protection Law (Law No. 13 of 2016) and any RERA requirements applicable to real estate agencies.
      </div>
    </div>
  )
}
