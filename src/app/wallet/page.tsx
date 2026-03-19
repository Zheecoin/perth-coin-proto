'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type BasketData = {
  name: string
  value: number
}

// Fallback basket data in case API fails
const fallbackData: BasketData[] = [
  { name: 'USD', value: 0.375 },
  { name: 'EUR', value: 0.21 },
  { name: 'JPY', value: 0.09 },
  { name: 'CNY', value: 0.09 },
  { name: 'GBP', value: 0.05 },
  { name: 'AUD', value: 0.045 },
  { name: 'THB', value: 0.015 },
  { name: 'Gold', value: 0.09 },
  { name: 'Silver', value: 0.025 },
]

export default function Wallet() {
  const [balance, setBalance] = useState(1000)
  const [basketValue, setBasketValue] = useState<number>(
    fallbackData.reduce((sum, item) => sum + item.value, 0)
  )
  const [basketChart, setBasketChart] = useState<BasketData[]>(fallbackData)

  useEffect(() => {
    const fetchBasket = async () => {
      try {
        const res = await fetch('/api/basket')
        const data = await res.json()

        if (data?.basket && data?.breakdown?.length) {
          setBasketValue(data.basket)
          setBasketChart(data.breakdown)
        } else {
          console.warn('Basket API returned no data, using fallback')
        }
      } catch (err) {
        console.error('Basket fetch failed, using fallback', err)
      }
    }

    fetchBasket()
    const interval = setInterval(fetchBasket, 60000) // refresh every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your PerthCoin Wallet</h1>

      <div className="bg-gray-100 p-6 rounded-lg shadow mb-6">
        <p className="text-xl">
          Balance: <span className="font-bold">{balance.toLocaleString()} coins</span>
        </p>

        <p className="mt-4">
          Current basket value:{' '}
          <span className="font-bold">${basketValue.toFixed(4)}</span> (updates live)
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Your coins track this weighted basket of currencies & metals
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Basket Composition</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={basketChart}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}