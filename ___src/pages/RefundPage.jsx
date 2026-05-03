import styles from './RefundPage.module.css'

export default function RefundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.badge}>Policy</div>
        <h1 className={styles.title}>Refund & Cancellation Policy</h1>
        <p className={styles.meta}>Last updated: May 2025 · Effective immediately upon purchase.</p>

        <div className={styles.highlight}>
          <div className={styles.highlightIcon}>💰</div>
          <div>
            <div className={styles.highlightTitle}>7-Day Money Back Guarantee</div>
            <div className={styles.highlightText}>
              If you are not satisfied within <strong>7 days</strong> of your purchase, you will get a full refund — no questions asked.
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Refund Eligibility</h2>
          <ul className={styles.list}>
            <li>Refunds must be requested within <strong>7 days of your first purchase</strong>.</li>
            <li>Renewal charges are non-refundable.</li>
            <li>Refunds will not be issued if the account violated our policies.</li>
            <li>Partial or prorated refunds are not available.</li>
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
          <p className={styles.text}>
            You can cancel your subscription anytime from your account settings.
            After cancellation, you will keep access until the end of your current billing period.
            We do not prorate partial months.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Plans & Pricing</h2>
          <div className={styles.planGrid}>
            <div className={styles.planCard}>
              <div className={styles.planName}>Monthly</div>
              <div className={styles.planPrice}>₹19<span>/month</span></div>
              <div className={styles.planNote}>Cancel anytime</div>
            </div>
            <div className={styles.planCard}>
              <div className={styles.planName}>Quarterly</div>
              <div className={styles.planPrice}>₹49<span>/3 months</span></div>
              <div className={styles.planNote}>Most popular</div>
            </div>
            <div className={styles.planCard}>
              <div className={styles.planName}>Yearly</div>
              <div className={styles.planPrice}>₹199<span>/year</span></div>
              <div className={styles.planNote}>Best value</div>
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
