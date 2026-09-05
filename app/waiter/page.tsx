'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type OrderItemRow = {
  order_item_id: string
  quantity: number
  menu_item: { name: string; item_type: string } | null
}

type OrderRow = {
  order_id: string
  status: string
  created_at: string
  customer: { name: string; phone_number: string } | null
  order_item: OrderItemRow[]
}

type StaffMember = { id: string; name: string }

export default function WaiterPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [chefs, setChefs] = useState<StaffMember[]>([])
  const [bartenders, setBartenders] = useState<StaffMember[]>([])
  const [selectedChef, setSelectedChef] = useState<{ [orderId: string]: string }>({})
  const [selectedBartender, setSelectedBartender] = useState<{ [orderId: string]: string }>({})
  const [message, setMessage] = useState('')

  async function loadOrders() {
    const { data, error } = await supabase
      .from('order')
      .select(`
        order_id,
        status,
        created_at,
        customer ( name, phone_number ),
        order_item ( order_item_id, quantity, menu_item ( name, item_type ) )
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: true })

    if (error) {
      setMessage('Error loading orders: ' + error.message)
      return
    }
    setOrders((data as unknown as OrderRow[]) || [])
  }

  async function loadStaff() {
    const { data: chefData } = await supabase.from('chef').select('chef_id, name')
    const { data: bartenderData } = await supabase.from('bartender').select('bartender_id, name')
    if (chefData) setChefs(chefData.map((c) => ({ id: c.chef_id, name: c.name })))
    if (bartenderData) setBartenders(bartenderData.map((b) => ({ id: b.bartender_id, name: b.name })))
  }

  useEffect(() => {
    loadOrders()
    loadStaff()
  }, [])

  async function assignAndServe(order: OrderRow) {
    const chefId = selectedChef[order.order_id]
    const bartenderId = selectedBartender[order.order_id]

    const hasFood = order.order_item.some((oi) => oi.menu_item?.item_type === 'Food')
    const hasDrink = order.order_item.some((oi) => oi.menu_item?.item_type === 'Drink')

    if (hasFood && !chefId) {
      setMessage('Please select a chef — this order includes food items.')
      return
    }
    if (hasDrink && !bartenderId) {
      setMessage('Please select a bartender — this order includes drink items.')
      return
    }

    setMessage('Saving...')

    for (const item of order.order_item) {
      const update: { chef_id?: string; bartender_id?: string } = {}
      if (item.menu_item?.item_type === 'Food' && chefId) update.chef_id = chefId
      if (item.menu_item?.item_type === 'Drink' && bartenderId) update.bartender_id = bartenderId

      if (Object.keys(update).length > 0) {
        await supabase.from('order_item').update(update).eq('order_item_id', item.order_item_id)
      }
    }

    const { error: orderUpdateError } = await supabase
      .from('order')
      .update({ status: 'Served' })
      .eq('order_id', order.order_id)

    if (orderUpdateError) {
      setMessage('Error marking order served: ' + orderUpdateError.message)
      return
    }

    setMessage('Order marked as served.')
    loadOrders()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Waiter — Pending Orders</h1>
      {message && <p style={{ color: 'blue' }}>{message}</p>}

      {orders.length === 0 && <p>No pending orders right now.</p>}

      {orders.map((order) => (
        <div key={order.order_id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>Order ID:</strong> {order.order_id}</p>
          <p><strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone_number})</p>
          <p><strong>Placed:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <ul>
            {order.order_item.map((item) => (
              <li key={item.order_item_id}>
                {item.quantity}x {item.menu_item?.name} ({item.menu_item?.item_type})
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '0.5rem' }}>
            <label>Chef: </label>
            <select
              value={selectedChef[order.order_id] || ''}
              onChange={(e) => setSelectedChef((prev) => ({ ...prev, [order.order_id]: e.target.value }))}
            >
              <option value="">-- select chef --</option>
              {chefs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label style={{ marginLeft: '1rem' }}>Bartender: </label>
            <select
              value={selectedBartender[order.order_id] || ''}
              onChange={(e) => setSelectedBartender((prev) => ({ ...prev, [order.order_id]: e.target.value }))}
            >
              <option value="">-- select bartender --</option>
              {bartenders.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <button onClick={() => assignAndServe(order)} style={{ marginTop: '0.75rem', padding: '0.5rem 1rem' }}>
            Assign & Mark Served
          </button>
        </div>
      ))}
    </div>
  )
}