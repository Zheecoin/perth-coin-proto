'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type BasketData = {
  name: string
  value: number
}

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [basketValue, setBasketValue] = useState<number | null>(null)
  const [basketBreakdown, setBasketBreakdown] = useState<BasketData[]>([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBalance(1000) // fake starting balance

    const fetchBasket = async () => {
      try {
        const res = await fetch('/api/basket')
        const data = await res.json()

        if (data.basket && data.breakdown) {
          setBasketValue(data.basket)
          setBasketBreakdown(data.breakdown)
          setLastUpdated(new Date().toLocaleTimeString())
          setError(null)
        } else {
          setError('Basket fetch returned no value')
        }
      } catch (err) {
        console.error('Basket fetch failed', err)
        setError('Failed to fetch basket')
      }
    }

    fetchBasket()
    const interval = setInterval(fetchBasket, 60000) // every minute

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
          <span className="font-bold">
            {basketValue !== null ? `$${basketValue}` : 'Loading...'}
          </span>{' '}
          (updates live)
        </p>

        {lastUpdated && (
          <p className="mt-1 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
        )}

        <p className="mt-2 text-sm text-gray-600">
          Your coins track this weighted basket of currencies & metals
        </p>
      </div>

      {basketBreakdown.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Basket Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={basketBreakdown}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}