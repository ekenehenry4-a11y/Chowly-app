import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: menuItems, error } = await supabase
    .from('menu_item')
    .select('*')

  if (error) {
    return <div>Error loading menu: {error.message}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
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