import styles from './RefundPage.module.css'

export default function RefundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.badge}>Policy</div>
        <h1 className={styles.title}>Refund & Cancellation Policy</h1>
        <p className={styles.meta}>Last updated: October 2026 · Applies to every Zerofy Pro purchase.</p>

        <div className={styles.highlight}>
          <div className={styles.highlightIcon}></div>
          <div>
            <div className={styles.highlightTitle}>7-Day Money Back Guarantee</div>
            <div className={styles.highlightText}>
              If you are not satisfied within <strong>7 days</strong> of your first Zerofy Pro payment, you will get a full refund — no questions asked.
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Refund Eligibility</h2>
          <ul className={styles.list}>
            <li>Refunds must be requested within <strong>7 days of your first Pro payment</strong>.</li>
            <li>The 7-day guarantee applies once per customer. Renewal payments and later purchases are not refundable.</li>
            <li>Refunds are not given for part of a period (for example, the unused months of a yearly plan after the 7 days).</li>
            <li>Refunds will not be issued if the account broke our Terms &amp; Conditions.</li>
            <li>After a refund, your account moves to the free plan. Your invoices, clients and reports stay in your account.</li>
            <li>If you were charged twice or charged by mistake, write to us at any time and we will refund the extra amount.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How to Request a Refund</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div>
                <div className={styles.stepTitle}>Send an Email</div>
                <div className={styles.stepText}>
                  Email us at <a href="mailto:support@zerofy.co.in" className={styles.link}>support@zerofy.co.in</a> with subject: <code className={styles.code}>Refund Request - [Your Email]</code>
                </div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div>
                <div className={styles.stepTitle}>Include Your Details</div>
                <div className={styles.stepText}>Share your registered email, payment ID (Razorpay), and purchase date.</div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div>
                <div className={styles.stepTitle}>Processing</div>
                <div className={styles.stepText}>Once verified, your refund will be credited back within <strong>5–7 business days</strong> to your original payment method.</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cancellation</h2>
          <ul className={styles.list}>
            <li><strong>Auto Pay:</strong> cancel it any time from <strong>Settings → Billing &amp; plan → Cancel Auto Pay</strong>. No further payments are taken.</li>
            <li>After you cancel, you keep Pro until the end of the period you have already paid for. We do not refund part of a period.</li>
            <li><strong>One-time payment:</strong> it does not renew, so there is nothing to cancel. Pro simply ends when the period is over.</li>
            <li>When Pro ends, your account moves to the free plan (up to 3 invoices). Everything you have already created stays available to view, print and download.</li>
            <li>If you cannot cancel from the app, email us and we will cancel it for you.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Plans & Pricing</h2>
          <div className={styles.planGrid}>
            <div className={styles.planCard}>
              <div className={styles.planName}>Monthly</div>
              <div className={styles.planPrice}>₹149<span>/month</span></div>
              <div className={styles.planNote}>For 1 month</div>
            </div>
            <div className={styles.planCard}>
              <div className={styles.planName}>Yearly</div>
              <div className={styles.planPrice}>₹999<span>/year</span></div>
              <div className={styles.planNote}>For 12 months</div>
            </div>
          </div>
        </section>

        <div className={styles.contactBox}>
          <span>Have more questions?</span>
          <a href="mailto:support@zerofy.co.in" className={styles.contactBtn}>Contact Support →</a>
        </div>

      </div>
    </div>
  )
}
