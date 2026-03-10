'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [basketValue, setBasketValue] = useState(1.00)

  useEffect(() => {
    setBalance(1000) // fake starting balance

    const interval = setInterval(() => {
      setBasketValue(prev =>
        Number((prev + (Math.random() - 0.5) * 0.05).toFixed(4))
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your PerthCoin Wallet</h1>

      <div className="bg-gray-100 p-6 rounded-lg shadow">
        <p className="text-xl">
          Balance:
          <span className="font-bold"> {balance.toLocaleString()} coins</span>
        </p>

        <p className="mt-4">
          Current basket value:
          <span className="font-bold"> ${basketValue}</span> (updates live)
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Your coins track this basket (USD, gold, etc.)
        </p>
      </div>
    </div>
  )
}