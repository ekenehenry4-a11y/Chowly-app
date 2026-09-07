'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COUNTRY_CODES = [
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+225', country: "Côte d'Ivoire" },
  { code: '+221', country: 'Senegal' },
  { code: '+229', country: 'Benin' },
  { code: '+228', country: 'Togo' },
]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'customer' | 'waiter'>('customer')
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('+234')
  const [localNumber, setLocalNumber] = useState('')
  const [waiterPassword, setWaiterPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin() {
    setError('')

    if (!name) {
      setError('Please enter your name.')
      return
    }

    if (role === 'customer') {
      const digitsOnly = localNumber.replace(/\D/g, '')

      if (digitsOnly.length !== 10) {
        setError('Please enter a valid 10-digit phone number (excluding the country code).')
        return
      }

      const fullPhoneNumber = `${countryCode}${digitsOnly}`

      setSubmitting(true)

      const { data: existingCustomer } = await supabase
        .from('customer')
        .select('customer_id, name, phone_number')
        .eq('phone_number', fullPhoneNumber)
        .maybeSingle()

      if (existingCustomer) {
        router.push(
          `/order?customer_id=${existingCustomer.customer_id}&customer_name=${encodeURIComponent(existingCustomer.name)}`
        )
        return
      }

      const { data: newCustomer, error: createError } = await supabase
        .from('customer')
        .insert({ name, phone_number: fullPhoneNumber })
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
      if (!waiterPassword) {
        setError('Please enter your password.')
        return
      }

      setSubmitting(true)

      const { data: waiterId, error: waiterError } = await supabase.rpc('check_waiter_login', {
        p_name: name,
        p_password: waiterPassword,
      })

      if (waiterError || !waiterId) {
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