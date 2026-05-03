const TermsConditions = () => {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 5vw 100px' }}>
      <div style={{
        display: 'inline-block',
        background: 'rgba(245,166,35,0.10)',
        color: '#f5a623',
        border: '1px solid rgba(245,166,35,0.25)',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 14px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: 18
      }}>Legal</div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.5px', color: 'var(--text)' }}>
        Terms &amp; Conditions
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        Last updated: May 2025 · Please read these terms carefully before using Zerofy.
      </p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Zerofy ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services. Zerofy is owned and operated by <strong>Piyush Sharma</strong>, Jaipur, Rajasthan, India.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>Zerofy is an online productivity platform that provides tools including unlimited invoice generation, file processing, PDF tools, and more. Access is available via subscription plans.</p>
      </Section>

      <Section title="3. Subscription Plans & Pricing">
        <p>We offer the following paid plans (in Indian Rupees, inclusive of taxes):</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, margin: '20px 0 24px' }}>
          {[
            { name: 'Monthly', price: '₹19', desc: 'per month · cancel anytime' },
            { name: 'Quarterly', price: '₹49', desc: 'every 3 months · most popular' },
            { name: 'Yearly', price: '₹199', desc: 'per year · best value' },
          ].map(plan => (
            <div key={plan.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#7b6ef6', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{plan.desc}</div>
            </div>
          ))}
        </div>
        <p>All plans include: Unlimited invoice generation, all tools unlocked, unlimited file processing, max 100MB file size, no watermarks, and priority support.</p>
      </Section>

      <Section title="4. Account Registration & Login">
        <ul>
          <li>Create an account using a valid email address and password</li>
          <li>Keep your login credentials confidential and secure</li>
          <li>Not share your account with others</li>
          <li>Be at least 18 years of age or have parental consent</li>
        </ul>
        <div style={{ background: 'rgba(123,110,246,0.06)', border: '1px solid rgba(123,110,246,0.18)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#b0b0c8' }}>
          <strong style={{ color: '#7b6ef6' }}>Account Security:</strong> You are responsible for all activity that occurs under your account. If you suspect unauthorized access, notify us immediately at <a href="mailto:support@zerofy.co.in" style={{ color: '#7b6ef6' }}>support@zerofy.co.in</a>.
        </div>
      </Section>

      <Section title="5. Payment & Billing">
        <p>Payments are processed securely via <strong>Razorpay</strong> and we accept UPI, Credit/Debit Cards, and Net Banking. Subscriptions automatically renew at the end of each billing cycle unless cancelled.</p>
        <p>Zerofy reserves the right to change pricing with 30 days' advance notice to existing subscribers.</p>
      </Section>

      <Section title="6. Refund Policy">
        <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#c8b890' }}>
          <strong style={{ color: '#f5a623' }}>Refund Window: 7 Days</strong><br />
          You may request a full refund within <strong>7 days</strong> of your initial purchase if you are unsatisfied with our service. Refund requests after 7 days will not be entertained. Renewals are non-refundable. To request a refund, email <a href="mailto:support@zerofy.co.in" style={{ color: '#7b6ef6' }}>support@zerofy.co.in</a> with your payment details.
        </div>
      </Section>

      <Section title="7. Cancellation">
        <p>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — you retain access until then. We do not prorate partial months.</p>
      </Section>

      <Section title="8. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use Zerofy for any unlawful purpose or in violation of Indian law</li>
          <li>Upload malicious files or attempt to hack our systems</li>
          <li>Resell or redistribute Zerofy's tools without written permission</li>
          <li>Use automated bots or scrapers on the platform</li>
          <li>Share your subscription account credentials with others</li>
        </ul>
      </Section>

      <Section title="9. Intellectual Property">
        <p>All content, branding, and tools on Zerofy are the intellectual property of Piyush Sharma / Zerofy. You may not copy, reproduce, or redistribute any part of the platform without explicit written consent.</p>
        <p>Files you upload and generate on Zerofy remain your property. We claim no ownership over your content.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>Zerofy is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our maximum liability shall not exceed the amount paid by you in the last 30 days.</p>
      </Section>

      <Section title="11. Service Availability">
        <p>We strive for 99%+ uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance. We are not liable for downtime caused by third-party services or force majeure events.</p>
      </Section>

      <Section title="12. Governing Law">
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan, India.</p>
      </Section>

      <Section title="13. Changes to Terms">
        <p>We may update these Terms at any time. Continued use of Zerofy after changes constitutes acceptance of the revised terms. We will notify users of material changes via email.</p>
      </Section>

      <Section title="14. Contact">
        <p>
          <strong>Piyush Sharma</strong><br />
          Zerofy, Jaipur, Rajasthan, India<br />
          Email: <a href="mailto:support@zerofy.co.in" style={{ color: '#7b6ef6' }}>support@zerofy.co.in</a><br />
          Website: <a href="https://www.zerofy.co.in" style={{ color: '#7b6ef6' }}>www.zerofy.co.in</a>
        </p>
      </Section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 8 }}>
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      fontWeight: 600,
      color: 'var(--text)',
      margin: '40px 0 10px',
      paddingLeft: 14,
      borderLeft: '3px solid #f5a623'
    }}>{title}</h2>
    <div style={{ color: '#c0c0d0', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default TermsConditions;
