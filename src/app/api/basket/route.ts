// src/app/api/basket/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use your Vercel environment variables here
    const EXCHANGERATE_KEY = process.env.EXCHANGERATE_KEY
    const METALS_KEY = process.env.METALS_KEY

    // Fetch currency rates
    const forexRes = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_KEY}/latest/USD`
    )
    const forexData = await forexRes.json()

    // Fetch metals
    const metalsRes = await fetch(
      `https://metals-api.com/api/latest?access_key=${METALS_KEY}&base=USD&symbols=XAU,XAG`
    )
    const metalsData = await metalsRes.json()

    // Build basket
    const breakdown = [
      { name: 'USD', value: 0.375 },
      { name: 'EUR', value: forexData.conversion_rates.EUR * 0.21 },
      { name: 'JPY', value: forexData.conversion_rates.JPY * 0.09 },
      { name: 'CNY', value: forexData.conversion_rates.CNY * 0.09 },
      { name: 'GBP', value: forexData.conversion_rates.GBP * 0.05 },
      { name: 'AUD', value: forexData.conversion_rates.AUD * 0.045 },
      { name: 'THB', value: forexData.conversion_rates.THB * 0.015 },
      { name: 'Gold', value: metalsData.rates.XAU * 0.09 },
      { name: 'Silver', value: metalsData.rates.XAG * 0.025 },
    ]

    const basketValue = breakdown.reduce((sum, item) => sum + item.value, 0)

    return NextResponse.json({ basket: Number(basketValue.toFixed(4)), breakdown })
  } catch (err) {
    console.error('Basket fetch failed', err)
    return NextResponse.json({ basket: null, breakdown: [], error: 'Failed to fetch basket' }, { status: 500 })
  }
}