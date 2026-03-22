'use client'

import { useEffect, useState, useRef } from 'react'

interface BreakdownItem {
  name: string
  weight: number
  usdRate: number
  contribution: number
}

interface BasketData {
  zheeUSD: number | null
  zheeAUD: number | null
  breakdown: BreakdownItem[]
  timestamp?: number
  error?: string
}

export default function ZheeCoin() {
  const [data, setData] = useState<BasketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  const [displayUSD, setDisplayUSD] = useState(0)
  const [displayAUD, setDisplayAUD] = useState(0)
  const animRef = useRef<number | null>(null)
  const targetUSD = useRef(0)
  const targetAUD = useRef(0)

  useEffect(() => {
    const animate = () => {
      setDisplayUSD(prev => {
        const diff = targetUSD.current - prev
        return Math.abs(diff) < 0.000001 ? targetUSD.current : prev + diff * 0.08
      })
      setDisplayAUD(prev => {
        const diff = targetAUD.current - prev
        return Math.abs(diff) < 0.000001 ? targetAUD.current : prev + diff * 0.08
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/basket', { cache: 'no-store' })
      const json: BasketData = await res.json()

      if (!res.ok || json.error) throw new Error(json.error ?? 'Unknown error')

      setData(json)
      setError(null)

      if (typeof json.zheeUSD === 'number') targetUSD.current = json.zheeUSD
      if (typeof json.zheeAUD === 'number') targetAUD.current = json.zheeAUD

      setPulse(true)
      setTimeout(() => setPulse(false), 600)
      setLastUpdated(new Date().toLocaleTimeString())
      setUpdateCount(c => c + 1)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="min-h-screen text-white p-6 md:p-12 font-mono"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Ƶ Zhee Coin</h1>
          <p className="text-white/70 mt-1 text-sm">
            Weighted basket of global currencies &amp; commodities
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex flex-col items-end gap-1 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">LIVE</span>
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                pulse ? 'bg-green-400 scale-125 shadow-lg shadow-green-400/50' : 'bg-green-600'
              }`}
            />
          </div>
          {lastUpdated && (
            <span className="text-xs text-white/50">Last: {lastUpdated}</span>
          )}
          {updateCount > 0 && (
            <span className="text-xs text-white/30">#{updateCount} updates</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/60 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Price cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className={`bg-black/50 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 ${pulse ? 'border-green-700' : 'border-white/20'}`}>
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">1 Zhee in USD</p>
          {loading ? (
            <div className="h-10 bg-white/10 rounded animate-pulse w-40" />
          ) : (
            <p className="text-4xl font-bold text-green-400">
              ${displayUSD.toFixed(6)}
            </p>
          )}
        </div>

        <div className={`bg-black/50 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 ${pulse ? 'border-blue-700' : 'border-white/20'}`}>
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">1 Zhee in AUD</p>
          {loading ? (
            <div className="h-10 bg-white/10 rounded animate-pulse w-40" />
          ) : (
            <p className="text-4xl font-bold text-blue-400">
              A${displayAUD.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-widest text-white/60">Basket Breakdown</h2>
          <span className="text-xs text-white/30">metals refresh every 2s · currencies cached 1hr</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-6 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs border-b border-white/10">
                <th className="text-left px-6 py-3">Asset</th>
                <th className="text-right px-6 py-3">Weight</th>
                <th className="text-right px-6 py-3">Rate (USD)</th>
                <th className="text-right px-6 py-3">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {data?.breakdown.map((item, i) => (
                <tr
                  key={item.name}
                  className={`border-b border-white/10 ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                >
                  <td className="px-6 py-3 font-semibold text-white flex items-center gap-2">
                    {item.name}
                    {item.name.includes('XA') && (
                      <span className="text-xs text-green-400 font-normal">live</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-white/60">
                    {(item.weight * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 text-right text-white/60">
                    {typeof item.usdRate === 'number'
                      ? item.name.includes('XA')
                        ? item.usdRate.toFixed(4)
                        : item.usdRate.toFixed(6)
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-green-400 font-semibold">
                    {typeof item.contribution === 'number'
                      ? `$${item.contribution.toFixed(6)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {data?.zheeUSD && (
              <tfoot>
                <tr className="border-t-2 border-white/20 bg-white/10">
                  <td colSpan={3} className="px-6 py-3 font-bold text-white">Total (1 Zhee)</td>
                  <td className="px-6 py-3 text-right font-bold text-green-400">
                    ${data.zheeUSD.toFixed(6)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/30">
        <span>Metals: gold-api.com · Currencies: ExchangeRate-API</span>
        {lastUpdated && <span>Last fetch: {lastUpdated}</span>}
      </div>
    </div>
  )
}