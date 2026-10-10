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
        Last updated: October 2026 · Please read these terms carefully before using Zerofy.
      </p>

      <Section title="1. Acceptance of Terms">
        <p>By creating an account or using Zerofy ("the Service"), you agree to these Terms &amp; Conditions. If you do not agree, please do not use the Service. Zerofy is owned and operated by <strong>KumKum Sharma</strong>, Jaipur, Rajasthan, India.</p>
      </Section>

      <Section title="2. What Zerofy Is">
        <p>Zerofy is an online GST billing and invoicing app for businesses in India. With it you can create invoices, quotations and credit notes, save your clients and items, record payments, and see reports such as a GST summary. Documents can be printed, downloaded as PDF, or shared by WhatsApp or email.</p>
      </Section>

      <Section title="3. Free Plan and Pro Plan">
        <p><strong>Free plan:</strong> you can create up to 3 invoices. Quotations, credit notes, clients, items, payments and reports are included and do not count towards this limit.</p>
        <p><strong>Pro plan:</strong> unlimited invoices, plus priority support. Pro is one plan with three ways to pay (in Indian Rupees, inclusive of applicable taxes):</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, margin: '20px 0 24px' }}>
          {[
            { name: 'Monthly', price: '₹49', desc: 'for 1 month' },
            { name: 'Quarterly', price: '₹129', desc: 'for 3 months' },
            { name: 'Yearly', price: '₹399', desc: 'for 12 months' },
          ].map(plan => (
            <div key={plan.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#EFA02F', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{plan.desc}</div>
            </div>
          ))}
        </div>
        <p>On every plan, free and Pro, documents made with Zerofy carry a small "Created with Zerofy" line at the bottom.</p>
      </Section>

      <Section title="4. Your Account">
        <ul>
          <li>You can sign up with an email address and password, or with your Google account.</li>
          <li>You must be at least 18 years old and able to enter into a contract.</li>
          <li>Keep your login details private. Do not share your account with people outside your business.</li>
          <li>Give correct information and keep it up to date.</li>
        </ul>
        <div style={{ background: 'rgba(239,160,47,0.07)', border: '1px solid rgba(239,160,47,0.25)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#c8c2b0' }}>
          <strong style={{ color: '#EFA02F' }}>Account security:</strong> You are responsible for everything done from your account. If you think someone else has used it, write to us straight away at <a href="mailto:support@zerofy.co.in" style={{ color: '#EFA02F' }}>support@zerofy.co.in</a>.
        </div>
      </Section>

      <Section title="5. Payment & Billing">
        <p>Payments are processed by <strong>Razorpay</strong>. We accept UPI, credit and debit cards, and net banking. We do not see or store your card or bank details.</p>
        <p>You can pay for Pro in two ways:</p>
        <ul>
          <li><strong>Auto Pay:</strong> your plan renews by itself at the end of each period (monthly, quarterly or yearly) and the plan price is charged again, until you cancel Auto Pay.</li>
          <li><strong>One-time payment:</strong> you pay once for one period. It does not renew. When the period ends, your account goes back to the free plan unless you pay again.</li>
        </ul>
        <p>We may change prices. If we do, we will tell existing Pro users at least 30 days before the new price applies to them.</p>
      </Section>

      <Section title="6. Refunds">
        <div style={{ background: 'rgba(239,160,47,0.07)', border: '1px solid rgba(239,160,47,0.25)', borderRadius: 10, padding: '18px 22px', margin: '16px 0', fontSize: 14, color: '#c8c2b0' }}>
          <strong style={{ color: '#EFA02F' }}>Refund window: 7 days</strong><br />
          You can ask for a full refund within <strong>7 days</strong> of your first Pro payment. Renewal payments are not refundable. The full policy and the steps are on our <a href="/refund" style={{ color: '#EFA02F' }}>Refund &amp; Cancellation Policy</a> page.
        </div>
      </Section>

      <Section title="7. Cancellation">
        <p>You can cancel Auto Pay at any time from <strong>Settings → Billing &amp; plan</strong>. No further payments are taken, and you keep Pro until the end of the period you have already paid for. We do not refund part of a period.</p>
        <p>When Pro ends, your account moves to the free plan. Your invoices, clients and reports stay in your account and you can still view, print and download them.</p>
      </Section>

      <Section title="8. Your Documents and Tax Responsibility">
        <ul>
          <li>Zerofy works out totals and GST from the details you enter — GSTIN, place of supply, HSN/SAC codes, tax rates, quantities and prices. You are responsible for checking that these details and every document you issue are correct.</li>
          <li>Zerofy is a billing app. It does not give tax, legal or accounting advice, and it does not file GST returns for you. Filing returns and following GST and other laws is your responsibility.</li>
          <li>The GST summary and reports are there to help you. Please check them against your own records before you use them for a return.</li>
          <li>Keep your own copies of important documents by downloading the PDF or the CSV report.</li>
        </ul>
      </Section>

      <Section title="9. Your Clients' Details">
        <p>You may save the names, addresses, phone numbers, email addresses and GSTINs of your clients in Zerofy. You confirm that you are allowed to hold and use these details for your billing. We use them only to provide the Service to you, as explained in our <a href="/privacy-policy" style={{ color: '#EFA02F' }}>Privacy Policy</a>.</p>
      </Section>

      <Section title="10. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use Zerofy for anything unlawful, including making false or misleading invoices</li>
          <li>Use a GSTIN, business name or logo that you have no right to use</li>
          <li>Try to break into, overload or disrupt the Service</li>
          <li>Use bots or scrapers on the Service</li>
          <li>Resell the Service without our written permission</li>
        </ul>
        <p>We may suspend or close an account that breaks these terms.</p>
      </Section>

      <Section title="11. Ownership">
        <p>The Zerofy name, logo, design and software belong to KumKum Sharma / Zerofy. You may not copy or redistribute them without written permission.</p>
        <p>Your business details, client list and the documents you create are yours. We claim no ownership over them.</p>
      </Section>

      <Section title="12. Limitation of Liability">
        <p>Zerofy is provided "as is", without warranties of any kind. We are not liable for indirect or consequential loss, including tax penalties, interest, lost profit or lost data arising from your use of the Service. Our total liability to you will not be more than the amount you paid us in the 30 days before the claim.</p>
      </Section>

      <Section title="13. Service Availability">
        <p>We work to keep Zerofy available at all times but cannot promise that it will never be interrupted. We are not liable for downtime caused by maintenance, third-party services (such as hosting or the payment gateway) or events outside our control.</p>
      </Section>

      <Section title="14. Closing Your Account">
        <p>You can stop using Zerofy at any time. To have your account and data deleted, write to <a href="mailto:support@zerofy.co.in" style={{ color: '#EFA02F' }}>support@zerofy.co.in</a> from your registered email address. Please download any documents you need first — deleted data cannot be brought back.</p>
      </Section>

      <Section title="15. Governing Law">
        <p>These Terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.</p>
      </Section>

      <Section title="16. Changes to These Terms">
        <p>We may update these Terms. We will tell you about important changes by email or by a notice in the app. If you keep using Zerofy after a change, you accept the updated Terms.</p>
      </Section>

      <Section title="17. Contact">
        <p>
          <strong>KumKum Sharma</strong><br />
          Zerofy, Jaipur, Rajasthan, India<br />
          Email: <a href="mailto:support@zerofy.co.in" style={{ color: '#EFA02F' }}>support@zerofy.co.in</a><br />
          Website: <a href="https://www.zerofy.co.in" style={{ color: '#EFA02F' }}>www.zerofy.co.in</a>
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
