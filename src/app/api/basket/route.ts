import { NextResponse } from 'next/server'

const WEIGHTS = {
  USD: 0.375,
  EUR: 0.21,
  JPY: 0.09,
  CNY: 0.09,
  GBP: 0.05,
  AUD: 0.045,
  THB: 0.015,
  XAU: 0.09,
  XAG: 0.025,
}

const METAL_BASELINES = {
  XAU: 3200,
  XAG: 33,
}

export async function GET() {
  try {
    const exchangeKey = process.env.EXCHANGERATE_KEY
    if (!exchangeKey) throw new Error('Missing EXCHANGERATE_KEY')

    // Currency fetch uses Next.js built-in cache with 1 hour revalidation.
    // Unlike in-memory caching, this works correctly on Vercel serverless
    // because Next.js persists the fetch cache between function invocations.
    // ExchangeRate-API free plan = 1,500 requests/month — this keeps usage to ~720/month max.
    const [currencyRes, goldRes, silverRes] = await Promise.all([
      fetch(
        `https://v6.exchangerate-api.com/v6/${exchangeKey}/latest/USD`,
        { next: { revalidate: 3600 } }  // cache for 1 hour
      ),
      fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store' }),
      fetch('https://api.gold-api.com/price/XAG', { cache: 'no-store' }),
    ])

    if (!currencyRes.ok) throw new Error(`ExchangeRate-API error: ${currencyRes.status} ${currencyRes.statusText}`)
    if (!goldRes.ok) throw new Error(`Gold-API XAU error: ${goldRes.status} ${goldRes.statusText}`)
    if (!silverRes.ok) throw new Error(`Gold-API XAG error: ${silverRes.status} ${silverRes.statusText}`)

    const currencyData = await currencyRes.json()
    const goldData = await goldRes.json()
    const silverData = await silverRes.json()

    const rates = currencyData.conversion_rates as Record<string, number>
    const goldPrice: number = goldData.price
    const silverPrice: number = silverData.price

    if (!goldPrice) throw new Error('Missing gold price from gold-api.com')
    if (!silverPrice) throw new Error('Missing silver price from gold-api.com')

    const requiredCurrencies = ['EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'THB']
    for (const symbol of requiredCurrencies) {
      if (!rates[symbol]) throw new Error(`Missing currency rate for ${symbol}`)
    }

    const goldRatio = goldPrice / METAL_BASELINES.XAU
    const silverRatio = silverPrice / METAL_BASELINES.XAG

    const breakdown = [
      { name: 'USD',          weight: WEIGHTS.USD, usdRate: 1,               contribution: WEIGHTS.USD * 1 },
      { name: 'EUR',          weight: WEIGHTS.EUR, usdRate: 1 / rates.EUR,   contribution: WEIGHTS.EUR * (1 / rates.EUR) },
      { name: 'JPY',          weight: WEIGHTS.JPY, usdRate: 1 / rates.JPY,   contribution: WEIGHTS.JPY * (1 / rates.JPY) },
      { name: 'CNY',          weight: WEIGHTS.CNY, usdRate: 1 / rates.CNY,   contribution: WEIGHTS.CNY * (1 / rates.CNY) },
      { name: 'GBP',          weight: WEIGHTS.GBP, usdRate: 1 / rates.GBP,   contribution: WEIGHTS.GBP * (1 / rates.GBP) },
      { name: 'AUD',          weight: WEIGHTS.AUD, usdRate: 1 / rates.AUD,   contribution: WEIGHTS.AUD * (1 / rates.AUD) },
      { name: 'THB',          weight: WEIGHTS.THB, usdRate: 1 / rates.THB,   contribution: WEIGHTS.THB * (1 / rates.THB) },
      { name: 'XAU (Gold)',   weight: WEIGHTS.XAU, usdRate: goldRatio,        contribution: WEIGHTS.XAU * goldRatio },
      { name: 'XAG (Silver)', weight: WEIGHTS.XAG, usdRate: silverRatio,      contribution: WEIGHTS.XAG * silverRatio },
    ]

    const zheeUSD = breakdown.reduce((sum, item) => sum + item.contribution, 0)
    const zheeAUD = zheeUSD * rates.AUD

    return NextResponse.json({
      zheeUSD,
      zheeAUD,
      breakdown,
      timestamp: currencyData.time_last_update_unix,
    })

  } catch (err) {
    console.error('❌ Zhee basket error:', err)
    return NextResponse.json(
      {
        zheeUSD: null,
        zheeAUD: null,
        breakdown: [],
        error: err instanceof Error ? err.message : 'Failed to fetch basket data',
      },
      { status: 500 }
    )
  }
}