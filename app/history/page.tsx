'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type OrderItemRow = {
  quantity: number
  menu_item: { name: string; item_type: string; price: number } | null
}

type OrderRow = {
  order_id: string
  status: string
  created_at: string
  order_item: OrderItemRow[]
}

function HistoryList() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer_id')
  const customerName = searchParams.get('customer_name')

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadHistory() {
      if (!customerId) {
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('order')
        .select(`
          order_id,
          status,
          created_at,
          order_item ( quantity, menu_item ( name, item_type, price ) )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Could not load order history: ' + fetchError.message)
        setLoading(false)
        return
      }

      setOrders((data as unknown as OrderRow[]) || [])
      setLoading(false)
    }
    loadHistory()
  }, [customerId])

  function orderTotal(order: OrderRow) {
    return order.order_item.reduce((sum, item) => sum + (item.menu_item?.price || 0) * item.quantity, 0)
  }

  if (!customerId) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        <p className="text-red-600 mb-4">
          Please log in to view your order history.
        </p>
        <Link href="/login" className="text-gray-700 underline">
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-2">
  <Link
    href={`/order?customer_id=${customerId}&customer_name=${encodeURIComponent(customerName || '')}`}
    aria-label="Back to menu"
    className="btn-press flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
  <h1 className="text-3xl font-bold">Order History</h1>
</div>
      {customerName && <p className="text-gray-600 mb-6">For {customerName}</p>}

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && orders.length === 0 && <p className="text-gray-500">No past orders yet.</p>}

      {orders.map((order) => (
        <div
          key={order.order_id}
          className="border border-gray-200 rounded-lg p-5 mb-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                order.status === 'Served' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {order.status}
            </span>
          </div>

          <ul className="mb-2 space-y-1">
            {order.order_item.map((item, i) => (
              <li key={i} className="text-gray-700">
                {item.quantity}x {item.menu_item?.name}{' '}
                <span className="text-gray-400 text-sm">({item.menu_item?.item_type})</span>
              </li>
            ))}
          </ul>

          <p className="font-semibold mb-3 border-t border-gray-100 pt-2">
            Total: ₦{orderTotal(order)}
          </p>

          <Link
            href={`/rate?order_id=${order.order_id}&customer_id=${customerId}`}
            className="text-sm text-gray-700 underline"
          >
            Rate this order
          </Link>
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <HistoryList />
    </Suspense>
  )
}