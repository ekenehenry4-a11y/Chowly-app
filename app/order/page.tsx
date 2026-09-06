'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type MenuItem = {
  menu_item_id: string
  name: string
  item_type: string
  price: number
  prep_time_minutes: number
}

export default function OrderPage() {
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
    totalAmount: number // <-- ADDED
  }>(null)
  const [error, setError] = useState('')

  // ADDED: payment state
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

    if (!customerName || !customerPhone) {
      setError('Please enter your name and phone number.')
      return
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item.')
      return
    }

    setSubmitting(true)

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

    const { data: orderData, error: orderError } = await supabase
      .from('order')
      .insert({ customer_id: customerData.customer_id, status: 'Pending' })
      .select()
      .single()

    if (orderError || !orderData) {
      setError('Could not create order: ' + orderError?.message)
      setSubmitting(false)
      return
    }

    const now = new Date()
    let maxPrepTime = 0
    let totalAmount = 0 // <-- ADDED
    const itemsForConfirmation: { name: string; quantity: number }[] = []

    for (const [menuItemId, quantity] of selectedItems) {
      const menuItem = menuItems.find((m) => m.menu_item_id === menuItemId)
      if (!menuItem) continue

      maxPrepTime = Math.max(maxPrepTime, menuItem.prep_time_minutes)
      totalAmount += menuItem.price * quantity // <-- ADDED
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
      customerId: customerData.customer_id,
      waitTime: maxPrepTime,
      items: itemsForConfirmation,
      totalAmount, // <-- ADDED
    })
    setSubmitting(false)
  }

  // ADDED: pay function
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
      <div style={{ padding: '2rem' }}>
        <h1>Order placed!</h1>
        <p>Order ID: {confirmation.orderId}</p>
        <p>Estimated waiting time: {confirmation.waitTime} minutes</p>
        <h3>Your items:</h3>
        <ul>
          {confirmation.items.map((item, i) => (
            <li key={i}>
              {item.quantity}x {item.name}
            </li>
          ))}
        </ul>
        <p style={{ fontWeight: 'bold' }}>Total: ₦{confirmation.totalAmount}</p>

        {/* ADDED: payment section */}
        {paid ? (
          <p style={{ color: 'green', fontWeight: 'bold' }}>Payment received. Thank you!</p>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={payNow} disabled={paying} style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>
              {paying ? 'Processing...' : `Pay ₦${confirmation.totalAmount} Now`}
            </button>
            {paymentError && <p style={{ color: 'red' }}>{paymentError}</p>}
          </div>
        )}

        <Link
          href={`/rate?order_id=${confirmation.orderId}&customer_id=${confirmation.customerId}`}
          style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid #333' }}
        >
          Rate your order
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Place Your Order</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={{ marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <input
          placeholder="Phone number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
      </div>

      <h2>Menu</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {menuItems.map((item) => (
          <li key={item.menu_item_id} style={{ marginBottom: '0.75rem' }}>
            {item.name} ({item.item_type}) — ₦{item.price} — {item.prep_time_minutes} min
            <button onClick={() => updateQuantity(item.menu_item_id, -1)} style={{ marginLeft: '1rem' }}>
              −
            </button>
            <span style={{ margin: '0 0.5rem' }}>{cart[item.menu_item_id] || 0}</span>
            <button onClick={() => updateQuantity(item.menu_item_id, 1)}>+</button>
          </li>
        ))}
      </ul>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={submitOrder} disabled={submitting} style={{ padding: '0.75rem 1.5rem', marginTop: '1rem' }}>
        {submitting ? 'Placing order...' : 'Submit Order'}
      </button>
    </div>
  )
}