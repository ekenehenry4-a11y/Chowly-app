import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: menuItems, error } = await supabase
    .from('menu_item')
    .select('*')

  if (error) {
    return <div>Error loading menu: {error.message}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href="/order" style={{ marginRight: '1rem', padding: '0.5rem 1rem', border: '1px solid #333' }}>
          I&apos;m a Customer
        </Link>
        <Link href="/waiter" style={{ padding: '0.5rem 1rem', border: '1px solid #333' }}>
          I&apos;m a Waiter
        </Link>
      </nav>

      <h1>Chowly Menu</h1>
      {menuItems && menuItems.length > 0 ? (
        <ul>
          {menuItems.map((item) => (
            <li key={item.menu_item_id}>
              {item.name} ({item.item_type}) — ₦{item.price} — {item.prep_time_minutes} min
            </li>
          ))}
        </ul>
      ) : (
        <p>No menu items found yet.</p>
      )}
    </div>
  )
}