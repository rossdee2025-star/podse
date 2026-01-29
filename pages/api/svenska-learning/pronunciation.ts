import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { word } = req.query

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'Missing word parameter' })
  }

  const apiKey = process.env.FORVO_API_KEY

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: 'Forvo API key not configured'
    })
  }

  try {
    const response = await axios.get(
      `https://apifree.forvo.com/key/${apiKey}/format/json/action/word-pronunciations/word/${encodeURIComponent(word)}/language/sv`,
      { timeout: 10000 }
    )

    const items = response.data?.items || []
    if (items.length > 0) {
      const bestPronunciation = items[0]
      return res.status(200).json({
        success: true,
        audioUrl: bestPronunciation.pathmp3 || bestPronunciation.pathogg,
        username: bestPronunciation.username,
        country: bestPronunciation.country
      })
    }

    return res.status(200).json({
      success: false,
      error: 'No pronunciation found'
    })
  } catch (error: any) {
    console.error('Forvo API error:', error?.message || error)
    return res.status(200).json({
      success: false,
      error: error?.message || 'Failed to fetch pronunciation'
    })
  }
}
