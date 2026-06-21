export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-8">Last updated: June 21, 2026</p>

        <div className="space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              WhatsApp CRM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our customer relationship management platform and related services
              (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By using the Service, you agree to the collection and use of information in accordance
              with this policy. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="font-medium text-white mt-4 mb-2">Account Information</h3>
            <p>
              When you create an account, we collect your name, email address, and password.
              This is necessary to provide you with access to the Service.
            </p>

            <h3 className="font-medium text-white mt-4 mb-2">Messaging Data</h3>
            <p>
              When you connect WhatsApp or Instagram accounts, we access message content, contact
              information, and conversation metadata solely to provide CRM functionality including
              message routing, auto-replies, contact management, and analytics within your workspace.
            </p>

            <h3 className="font-medium text-white mt-4 mb-2">Third-Party API Keys</h3>
            <p>
              If you provide AI provider API keys (e.g., OpenRouter, Groq, Mistral), these are stored
              encrypted and used exclusively to power AI features you enable. We never share your API
              keys with third parties.
            </p>

            <h3 className="font-medium text-white mt-4 mb-2">Usage Data</h3>
            <p>
              We collect anonymized usage data including feature interactions, page views, and error
              logs to improve the Service. This data cannot be used to identify you personally.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and route WhatsApp and Instagram messages on your behalf</li>
              <li>Power AI features (auto-replies, categorization, lead scoring) using your configured providers</li>
              <li>Send service-related communications (account alerts, security notices)</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We share data only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Service Providers:</strong> We use third-party infrastructure providers (hosting, database, CDN) who process data on our behalf under strict contractual obligations.</li>
              <li><strong>Meta Platforms:</strong> When you connect WhatsApp or Instagram, message data is processed through Meta&apos;s APIs in accordance with their terms.</li>
              <li><strong>AI Providers:</strong> When you configure AI providers, message content is sent to those providers solely to generate responses. You control which providers are active.</li>
              <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account,
              we permanently delete all personal data, messages, and configurations within 30 days.
              Anonymized analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted data transmission
              (TLS), encrypted storage for sensitive credentials, access controls, and regular security
              audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 16. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal data,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2 text-white">privacy@whatsappcrm.app</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/" className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← Back to WhatsApp CRM
          </a>
        </div>
      </div>
    </div>
  );
}
