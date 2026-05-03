import { useState } from 'react'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return
    const mailto = `mailto:support@zerofy.co.in?subject=${encodeURIComponent(form.subject || 'Contact from ' + form.name)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
    window.location.href = mailto
    setSent(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.badge}>Contact</div>
        <h1 className={styles.title}>Get in Touch</h1>
        <p className={styles.subtitle}>Have a question or need help? We are here for you. We usually reply within 24 hours.</p>

        <div className={styles.grid}>

          {/* Contact Info */}
          <div className={styles.infoCol}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>✉️</div>
              <div className={styles.infoTitle}>Email Support</div>
              <a href="mailto:support@zerofy.co.in" className={styles.infoValue}>support@zerofy.co.in</a>
              <div className={styles.infoNote}>24–48 hours mein reply</div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📍</div>
              <div className={styles.infoTitle}>Location</div>
              <div className={styles.infoValue}>Jaipur, Rajasthan</div>
              <div className={styles.infoNote}>India 🇮🇳</div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👤</div>
              <div className={styles.infoTitle}>Founder</div>
              <div className={styles.infoValue}>Piyush Sharma</div>
              <div className={styles.infoNote}>Zerofy</div>
            </div>

            <div className={styles.quickLinks}>
              <div className={styles.quickTitle}>Quick Links</div>
              <a href="/refund" className={styles.quickLink}>💰 Refund Policy</a>
              <a href="/privacy-policy.html" className={styles.quickLink}>🔒 Privacy Policy</a>
              <a href="/terms-conditions.html" className={styles.quickLink}>📄 Terms & Conditions</a>
              <a href="/pricing" className={styles.quickLink}>⚡ Pricing Plans</a>
            </div>
          </div>

          {/* Form */}
          <div className={styles.formCol}>
            {sent ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✅</div>
                <div className={styles.successTitle}>Message Ready!</div>
                <p className={styles.successText}>Your email client should have opened. If not, email us directly at <a href="mailto:support@zerofy.co.in" className={styles.link}>support@zerofy.co.in</a></p>
                <button className={styles.resetBtn} onClick={() => setSent(false)}>← Go Back</button>
              </div>
            ) : (
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Name *</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email *</label>
                    <input
                      className={styles.input}
                      type="email"
                      name="email"
                      placeholder="aap@email.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Subject</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="subject"
                    placeholder="What is your question about?"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Message *</label>
                  <textarea
                    className={styles.textarea}
                    name="message"
                    placeholder="Describe your question or issue here..."
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>

                <button
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={!form.name || !form.email || !form.message}
                >
                  Send Message →
                </button>

                <p className={styles.formNote}>* Required fields. Your message will be sent via your email client.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
