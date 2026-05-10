// api/rss.js — Vercel Serverless Function
// Server-side RSS fetch — no CORS issues

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url } = req.query
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' })
  }

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Zerofy/1.0; +https://zerofy.co.in)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Feed returned ${response.status}` })
    }

    const xml = await response.text()

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    return res.status(200).send(xml)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
