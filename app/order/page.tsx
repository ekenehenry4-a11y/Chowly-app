'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type MenuItem = {
  menu_item_id: string
  name: string
  item_type: string
  price: number
  prep_time_minutes: number
}

function OrderForm() {
  const searchParams = useSearchParams()
  const loggedInCustomerId = searchParams.get('customer_id') // <-- ADDED
  const loggedInCustomerName = searchParams.get('customer_name') // <-- ADDED

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<null | {
    orderId: string
    customerId: string
    waitTime: number
    items: { name: string; quantity: number }[]
    totalAmount: number
  }>(null)
  const [error, setError] = useState('')

  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    async function loadMenu() {
      const { data } = await supabase.from('menu_item').select('*')
      if (data) setMenuItems(data)
    }
    loadMenu()
  }, [])

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      const current = prev[menuItemId] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [menuItemId]: next }
    })
  }

  async function submitOrder() {
    setError('')
    const selectedItems = Object.entries(cart).filter(([, qty]) => qty > 0)

    // ADDED: skip name/phone validation if already logged in
    if (!loggedInCustomerId && (!customerName || !customerPhone)) {
      setError('Please enter your name and phone number.')
      return
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item.')
      return
    }

    setSubmitting(true)

    let customerId = loggedInCustomerId // <-- ADDED: reuse logged-in id if present

    // ADDED: only create a new customer if not already logged in
    if (!customerId) {
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .insert({ name: customerName, phone_number: customerPhone })
        .select()
        .single()

      if (customerError || !customerData) {
        setError('Could not create customer: ' + customerError?.message)
        setSubmitting(false)
        return
      }
      customerId = customerData.customer_id
    }

    const { data: orderData, error: orderError } = await supabase
      .from('order')
      .insert({ customer_id: customerId, status: 'Pending' })
      .select()
      .single()

    if (orderError || !orderData) {
      setError('Could not create order: ' + orderError?.message)
      setSubmitting(false)
      return
    }

    const now = new Date()
    let maxPrepTime = 0
    let totalAmount = 0
    const itemsForConfirmation: { name: string; quantity: number }[] = []

    for (const [menuItemId, quantity] of selectedItems) {
      const menuItem = menuItems.find((m) => m.menu_item_id === menuItemId)
      if (!menuItem) continue

      maxPrepTime = Math.max(maxPrepTime, menuItem.prep_time_minutes)
      totalAmount += menuItem.price * quantity
      itemsForConfirmation.push({ name: menuItem.name, quantity })

      const prepEnd = new Date(now.getTime() + menuItem.prep_time_minutes * 60000)

      await supabase.from('order_item').insert({
        order_id: orderData.order_id,
        menu_item_id: menuItemId,
        quantity,
        prep_start_time: now.toISOString(),
        prep_end_time: prepEnd.toISOString(),
      })
    }

    setConfirmation({
      orderId: orderData.order_id,
      customerId: customerId as string,
      waitTime: maxPrepTime,
      items: itemsForConfirmation,
      totalAmount,
    })
    setSubmitting(false)
  }

  async function payNow() {
    if (!confirmation) return
    setPaymentError('')
    setPaying(true)

    const { error: paymentInsertError } = await supabase.from('payment').insert({
      order_id: confirmation.orderId,
      amount: confirmation.totalAmount,
      status: 'Paid',
      paid_at: new Date().toISOString(),
    })

    if (paymentInsertError) {
      setPaymentError('Could not process payment: ' + paymentInsertError.message)
      setPaying(false)
      return
    }

    setPaid(true)
    setPaying(false)
  }

  if (confirmation) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-green-700">Order placed!</h1>
        <p className="text-gray-600 mb-1">
          Order ID: <span className="font-mono text-sm">{confirmation.orderId}</span>
        </p>
        <p className="text-gray-600 mb-6">
          Estimated waiting time: <span className="font-semibold">{confirmation.waitTime} minutes</span>
        </p>

        <h3 className="text-lg font-semibold mb-2">Your items</h3>
        <ul className="mb-4 space-y-1">
          {confirmation.items.map((item, i) => (
            <li key={i} className="text-gray-700">
              {item.quantity}x {item.name}
            </li>
          ))}
        </ul>

        <p className="text-xl font-bold mb-6 border-t border-gray-200 pt-4">
          Total: ₦{confirmation.totalAmount}
        </p>

        {paid ? (
          <p className="text-green-700 font-semibold mb-6">Payment received. Thank you!</p>
        ) : (
          <div className="mb-6">
            <button
              onClick={payNow}
              disabled={paying}
              className="btn-press px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 mr-3"
            >
              {paying ? 'Processing...' : `Pay ₦${confirmation.totalAmount} Now`}
            </button>
            {paymentError && <p className="text-red-600 mt-2">{paymentError}</p>}
          </div>
        )}

        <Link
          href={`/rate?order_id=${confirmation.orderId}&customer_id=${confirmation.customerId}`}
          className="btn-press inline-block px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
        >
          Rate your order
        </Link>
      </div>
    )
  }

return (
    <div className="max-w-xl mx-auto p-8">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-bold">Place Your Order</h1>
        {loggedInCustomerId && (
          <Link
            href={`/history?customer_id=${loggedInCustomerId}&customer_name=${encodeURIComponent(loggedInCustomerName || '')}`}
            className="btn-press group relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100"
            aria-label="Order History"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-5 h-5 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Order History
            </span>
          </Link>
        )}
      </div>

      {/* ADDED: show greeting if logged in, otherwise show name/phone inputs */}
      {loggedInCustomerId ? (
        <p className="mb-8 text-gray-600">
          Ordering as <span className="font-medium">{loggedInCustomerName}</span>
        </p>
      ) : (
        <div className="flex gap-3 mb-8">
          <input
            placeholder="Your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Menu</h2>
      <ul className="space-y-3 mb-6">
        {menuItems.map((item) => (
          <li
            key={item.menu_item_id}
            className="flex justify-between items-center border-b border-gray-200 pb-3"
          >
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500 text-sm ml-2">({item.item_type})</span>
              <div className="text-gray-500 text-sm">
                ₦{item.price} — {item.prep_time_minutes} min
              </div>
            </div>
            <div className="flex items-center gap-3">
  <button
    onClick={() => updateQuantity(item.menu_item_id, -1)}
    className="btn-press w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
  >
    −
  </button>
  <span className="w-6 text-center font-medium">{cart[item.menu_item_id] || 0}</span>
  <button
    onClick={() => updateQuantity(item.menu_item_id, 1)}
    className="btn-press w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
  >
    +
  </button>
</div>
          </li>
        ))}
      </ul>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={submitOrder}
        disabled={submitting}
        className="btn-press w-full px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Placing order...' : 'Submit Order'}
      </button>
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <OrderForm />
    </Suspense>
  )
}