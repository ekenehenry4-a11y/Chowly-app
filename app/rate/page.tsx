'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RatePage() {
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
      <div style={{ padding: '2rem' }}>
        <h1>Rate your order</h1>
        <p style={{ color: 'red' }}>
          Missing order information. Please use the &quot;Rate your order&quot; link from your order confirmation page.
        </p>
        <Link href="/order">Back to ordering</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Thank you!</h1>
        <p>Your rating has been submitted.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Rate your order</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Rating (1–5): {rating}
          <br />
          <input
            type="range"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Comments (optional):
          <br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ width: '100%', maxWidth: '400px', padding: '0.5rem' }}
            placeholder="Tell us about your experience..."
          />
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={submitRating} disabled={submitting} style={{ padding: '0.75rem 1.5rem' }}>
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  )
}