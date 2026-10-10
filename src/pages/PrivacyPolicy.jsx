const PrivacyPolicy = () => {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 5vw 100px' }}>
      <div style={{
        display: 'inline-block',
        background: 'rgba(123,110,246,0.12)',
        color: '#EFA02F',
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
        Last updated: October 2026 · Applies whenever you use Zerofy.
      </p>

      <Section title="1. Introduction">
        <p>Zerofy ("we", "our", "us") is a GST billing and invoicing app owned and operated by <strong>KumKum Sharma</strong>, Jaipur, Rajasthan, India. This Privacy Policy explains what information we collect when you use <a href="https://www.zerofy.co.in" style={{ color: '#EFA02F' }}>www.zerofy.co.in</a>, how we use it, and the choices you have.</p>
        <p>By using Zerofy, you agree to this policy.</p>
      </Section>

      <Section title="2. Information We Collect">
        <ul>
          <li><strong>Account details:</strong> your email address and your password. Passwords are stored in encrypted (hashed) form — we cannot read them. If you sign in with Google, we receive your email address and Google account ID from Google; we never receive your Google password.</li>
          <li><strong>Business details you enter:</strong> business name, address, phone, email, GSTIN, logo, bank details, UPI ID, terms and signatory name. These are printed on your documents.</li>
          <li><strong>Your clients' details:</strong> the names, addresses, phone numbers, email addresses and GSTINs you save.</li>
          <li><strong>Your documents and records:</strong> invoices, quotations, credit notes, saved items and the payments you record.</li>
          <li><strong>Subscription details:</strong> your plan, its start and end dates, and the payment and subscription reference numbers from Razorpay. Card numbers, UPI PINs and bank passwords are entered on Razorpay's own screen. We never see or store them.</li>
          <li><strong>Technical data:</strong> basic details such as IP address, browser type and time of request, which our hosting provider logs to keep the service running and secure.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul>
          <li>To run the app — create, save and show your documents, clients and reports</li>
          <li>To manage your plan and payments</li>
          <li>To send service emails, such as a password reset code or a reply to your support request</li>
          <li>To fix problems, improve the app and prevent misuse</li>
        </ul>
        <p>We do not sell your data, and we do not use it for advertising.</p>
      </Section>

      <Section title="4. Your Clients' Information">
        <div style={{ background: 'rgba(239,160,47,0.07)', border: '1px solid rgba(239,160,47,0.25)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#c8c2b0' }}>
          <strong style={{ color: '#EFA02F' }}>Important:</strong> The client details and documents in your account belong to you. We use them only to provide the app to you. We do not contact your clients, and we do not share or sell their details.
        </div>
        <p>When you share a document by WhatsApp or email, the PDF is made in your own browser and sent from your own WhatsApp or email app. We do not send messages to your clients for you.</p>
      </Section>

      <Section title="5. Who We Share Data With">
        <p>We share data only with the services needed to run Zerofy:</p>
        <ul>
          <li><strong>Razorpay</strong> — to process payments</li>
          <li><strong>Google</strong> — if you choose "Sign in with Google", and for the fonts used in the app</li>
          <li><strong>Hosting and database providers</strong> — where the app runs and your data is stored</li>
          <li><strong>Email service provider</strong> — to deliver password reset codes</li>
          <li><strong>Government or legal authorities</strong> — only when Indian law requires it</li>
        </ul>
        <p>Some of these providers may store data on servers outside India.</p>
      </Section>

      <Section title="6. Cookies and Browser Storage">
        <p>Zerofy keeps a few things in your browser's storage so that the app works: your login session, an unsaved invoice you were still typing, and small preferences such as whether you have seen the guided tour. We do not use advertising or tracking cookies. Razorpay and Google may set their own cookies when you pay or sign in with them.</p>
      </Section>

      <Section title="7. Data Security">
        <p>All traffic to Zerofy is encrypted with HTTPS, passwords are stored in hashed form, and each account can only reach its own data. No online service can be made completely secure, so please use a strong password and keep it private.</p>
      </Section>

      <Section title="8. How Long We Keep Data">
        <p>We keep your data for as long as your account is open, including after a Pro plan ends. If you ask us to delete your account, we delete your account, business details, clients and documents within 30 days. We may keep payment records for longer where tax or other laws require it.</p>
      </Section>

      <Section title="9. Your Rights">
        <p>You can:</p>
        <ul>
          <li>See and correct your business and client details in the app at any time</li>
          <li>Download your documents as PDF and your GST report as CSV</li>
          <li>Ask us for a copy of the personal data we hold about you</li>
          <li>Ask us to delete your account and data</li>
          <li>Withdraw your consent by closing your account</li>
        </ul>
        <p>To use these rights, write to <a href="mailto:support@zerofy.co.in" style={{ color: '#EFA02F' }}>support@zerofy.co.in</a> from your registered email address.</p>
      </Section>

      <Section title="10. Children">
        <p>Zerofy is meant for businesses and is not intended for anyone under 18. We do not knowingly collect information from children.</p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this policy. We will tell you about important changes by email or by a notice in the app.</p>
      </Section>

      <Section title="12. Contact and Grievances">
        <p>For any question or complaint about your data, contact:</p>
        <p>
          <strong>KumKum Sharma</strong><br />
          Zerofy, Jaipur, Rajasthan, India<br />
          Email: <a href="mailto:support@zerofy.co.in" style={{ color: '#EFA02F' }}>support@zerofy.co.in</a><br />
          Website: <a href="https://www.zerofy.co.in" style={{ color: '#EFA02F' }}>www.zerofy.co.in</a>
        </p>
        <p>We aim to reply within 48 hours and to resolve complaints within 30 days.</p>
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
      borderLeft: '3px solid #EFA02F'
    }}>{title}</h2>
    <div style={{ color: '#c0c0d0', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default PrivacyPolicy;
