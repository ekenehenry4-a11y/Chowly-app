'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'customer' | 'waiter'>('customer')
  const [name, setName] = useState('')
  const [phoneOrPassword, setPhoneOrPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin() {
    setError('')

    if (!name || !phoneOrPassword) {
      setError('Please fill in both fields.')
      return
    }

    setSubmitting(true)

    if (role === 'customer') {
      // Look up existing customer by phone number
      const { data: existingCustomer } = await supabase
        .from('customer')
        .select('customer_id, name, phone_number')
        .eq('phone_number', phoneOrPassword)
        .maybeSingle()

      if (existingCustomer) {
        router.push(
          `/order?customer_id=${existingCustomer.customer_id}&customer_name=${encodeURIComponent(existingCustomer.name)}`
        )
        return
      }

      // No existing customer — create one on the spot
      const { data: newCustomer, error: createError } = await supabase
        .from('customer')
        .insert({ name, phone_number: phoneOrPassword })
        .select()
        .single()

      if (createError || !newCustomer) {
        setError('Could not log in: ' + createError?.message)
        setSubmitting(false)
        return
      }

      router.push(
        `/order?customer_id=${newCustomer.customer_id}&customer_name=${encodeURIComponent(newCustomer.name)}`
      )
    } else {
      // Waiter login — check name + password match
      const { data: waiter, error: waiterError } = await supabase
        .from('waiter')
        .select('waiter_id, name, password')
        .ilike('name', name)
        .eq('password', phoneOrPassword)
        .maybeSingle()

      if (waiterError || !waiter) {
        setError('Invalid waiter name or password.')
        setSubmitting(false)
        return
      }

      router.push('/waiter')
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Chowly</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setRole('customer')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            role === 'customer' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          I&apos;m a Customer
        </button>
        <button
          onClick={() => setRole('waiter')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            role === 'waiter' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          I&apos;m a Waiter
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="Your name"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          {role === 'customer' ? 'Phone number' : 'Password'}
        </label>
        <input
          type={role === 'waiter' ? 'password' : 'text'}
          value={phoneOrPassword}
          onChange={(e) => setPhoneOrPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder={role === 'customer' ? 'Your phone number' : 'Waiter password'}
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={submitting}
        className="w-full px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Logging in...' : 'Continue'}
      </button>
    </div>
  )
}