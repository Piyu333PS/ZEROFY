import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>

        {/* Brand Column */}
        <div className={styles.brand}>
          <span className={styles.logo}>Zero<span className={styles.accent}>fy</span></span>
          <p>Simple, powerful tools for invoicing, file processing, and more. One plan. Everything unlocked. No hidden fees.</p>
          <div className={styles.badges}>
            <span className={styles.badge}><span className={styles.dot}></span> All Systems Operational</span>
            <span className={styles.badge}>🔒 Secure Payments</span>
          </div>
          <div className={styles.paymentIcons}>
            <span className={styles.payBadge}>UPI</span>
            <span className={styles.payBadge}>VISA</span>
            <span className={styles.payBadge}>MC</span>
            <span className={styles.payBadge}>RuPay</span>
            <span className={styles.payBadge}>NetBanking</span>
          </div>
          <p className={styles.razorpay}>Payments secured by Razorpay</p>
        </div>

        {/* Support Column */}
        <div className={styles.col}>
          <h4>Support</h4>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/refund">Refund Policy</a></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className={styles.col}>
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms-conditions">Terms &amp; Conditions</a></li>
            <li><a href="/refund">Cancellation Policy</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <p className={styles.copyright}>
          © 2025 <strong>Zerofy</strong>. All rights reserved. Made with ♥ in Jaipur, Rajasthan 🇮🇳
        </p>
      </div>
    </footer>
  );
};

export default Footer;
