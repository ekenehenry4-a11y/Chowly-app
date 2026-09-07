'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function RateForm() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const customerId = searchParams.get('customer_id')

  const [rating, setRating] = useState(5)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function submitRating() {
    setError('')

    if (!orderId || !customerId) {
      setError('Missing order information. Please use the link from your order confirmation.')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('complaint').insert({
      order_id: orderId,
      customer_id: customerId,
      description: description || null,
      rating: rating,
    })

    if (insertError) {
      setError('Could not submit rating: ' + insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (!orderId || !customerId) {
    return (
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Rate your order</h1>
        <p className="text-red-600 mb-4">
          Missing order information. Please use the &quot;Rate your order&quot; link from your order confirmation page.
        </p>
        <Link href="/order" className="text-gray-700 underline">
          Back to ordering
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-2 text-green-700">Thank you!</h1>
        <p className="text-gray-600">Your rating has been submitted.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Rate your order</h1>

      <div className="mb-6">
        <label className="block font-medium mb-2">
          Rating: <span className="font-bold">{rating}</span> / 5
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-2">Comments (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="Tell us about your experience..."
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={submitRating}
        disabled={submitting}
        className="w-full px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  )
}

export default function RatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <RateForm />
    </Suspense>
  )
}