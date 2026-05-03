const PrivacyPolicy = () => {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 5vw 100px' }}>
      <div style={{
        display: 'inline-block',
        background: 'rgba(123,110,246,0.12)',
        color: '#7b6ef6',
        border: '1px solid rgba(123,110,246,0.25)',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 14px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: 18
      }}>Legal</div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.5px', color: 'var(--text)' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        Last updated: May 2025 · Effective immediately upon use of Zerofy services.
      </p>

      <Section title="1. Introduction">
        <p>Welcome to Zerofy ("we", "our", or "us"), a product owned and operated by <strong>Piyush Sharma</strong>, based in Jaipur, Rajasthan, India. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our platform at <a href="https://www.zerofy.co.in" style={{ color: '#7b6ef6' }}>www.zerofy.co.in</a>.</p>
        <p>By using Zerofy, you agree to the collection and use of information in accordance with this policy.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
          <li><strong>Billing Information:</strong> Payment details processed securely via Razorpay (UPI, Cards, Net Banking). We do not store your card details.</li>
          <li><strong>Usage Data:</strong> Pages visited, tools used, file uploads, timestamps, and browser/device information.</li>
          <li><strong>Files & Documents:</strong> Files you upload for processing (e.g., PDFs, images). These are processed and not permanently stored beyond your session unless you choose to save them.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul>
          <li>To provide and maintain our services</li>
          <li>To process your subscription and billing</li>
          <li>To send service-related emails (receipts, updates, support)</li>
          <li>To improve our tools and user experience</li>
          <li>To detect and prevent fraud or abuse</li>
        </ul>
      </Section>

      <Section title="4. Data Sharing">
        <p>We do <strong>not</strong> sell your personal data. We may share data only with:</p>
        <ul>
          <li><strong>Razorpay</strong> – for secure payment processing</li>
          <li><strong>Hosting & infrastructure providers</strong> – to run our platform</li>
          <li><strong>Legal authorities</strong> – if required by Indian law</li>
        </ul>
      </Section>

      <Section title="5. File Processing & Storage">
        <div style={{ background: 'rgba(123,110,246,0.06)', border: '1px solid rgba(123,110,246,0.18)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#b0b0c8' }}>
          <strong style={{ color: '#7b6ef6' }}>Important:</strong> Files you upload are used solely to provide the requested tool output. We do not read, share, or permanently store your files. Uploaded files are deleted automatically after processing.
        </div>
      </Section>

      <Section title="6. Cookies">
        <p>We use essential cookies to keep you logged in and remember your session. We do not use third-party advertising cookies.</p>
      </Section>

      <Section title="7. Data Security">
        <p>We implement industry-standard security measures including HTTPS encryption and access controls. However, no method of transmission over the Internet is 100% secure.</p>
      </Section>

      <Section title="8. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction or deletion of your data</li>
          <li>Cancel your subscription at any time</li>
          <li>Request a data export</li>
        </ul>
        <p>To exercise these rights, email us at <a href="mailto:support@zerofy.co.in" style={{ color: '#7b6ef6' }}>support@zerofy.co.in</a>.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>Zerofy is not intended for users under the age of 13. We do not knowingly collect information from children.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this policy from time to time. We will notify you of any significant changes via email or a prominent notice on our website.</p>
      </Section>

      <Section title="11. Contact Us">
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
      borderLeft: '3px solid #7b6ef6'
    }}>{title}</h2>
    <div style={{ color: '#c0c0d0', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default PrivacyPolicy;
