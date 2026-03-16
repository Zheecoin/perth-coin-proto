// src/app/api/basket/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch currency rates
    const forexRes = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_KEY}/latest/USD`)
    const forexData = await forexRes.json()

    // Fetch metals rates
    const metalsRes = await fetch(`https://metals-api.com/api/latest?access_key=${process.env.METALS_KEY}&base=USD&symbols=XAU,XAG`)
    const metalsData = await metalsRes.json()

    // Weighted basket calculation
    const breakdown = [
      { name: 'USD', value: 1 * 0.375 },
      { name: 'EUR', value: forexData.conversion_rates.EUR * 0.21 },
      { name: 'JPY', value: forexData.conversion_rates.JPY * 0.09 },
      { name: 'CNY', value: forexData.conversion_rates.CNY * 0.09 },
      { name: 'GBP', value: forexData.conversion_rates.GBP * 0.05 },
      { name: 'AUD', value: forexData.conversion_rates.AUD * 0.045 },
      { name: 'THB', value: forexData.conversion_rates.THB * 0.015 },
      { name: 'Gold', value: metalsData.rates.XAU * 0.09 },
      { name: 'Silver', value: metalsData.rates.XAG * 0.025 },
    ]

    const basket = breakdown.reduce((sum, item) => sum + item.value, 0)

    return NextResponse.json({
      basket: Number(basket.toFixed(4)),
      breakdown: breakdown.map(item => ({ ...item, value: Number(item.value.toFixed(4)) }))
    })
  } catch (err) {
    console.error('Basket fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch basket' }, { status: 500 })
  }
}