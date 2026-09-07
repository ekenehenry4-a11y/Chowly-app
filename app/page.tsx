import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: menuItems, error } = await supabase
    .from('menu_item')
    .select('*')

  if (error) {
    return <div className="p-8 text-red-600">Error loading menu: {error.message}</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <nav className="flex gap-4 mb-8">
        <Link
          href="/order"
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
        >
          I&apos;m a Customer
        </Link>
        <Link
          href="/waiter"
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
        >
          I&apos;m a Waiter
        </Link>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Chowly Menu</h1>

      {menuItems && menuItems.length > 0 ? (
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li
              key={item.menu_item_id}
              className="flex justify-between items-center border-b border-gray-200 pb-3"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500 text-sm ml-2">({item.item_type})</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">₦{item.price}</div>
                <div className="text-gray-500 text-sm">{item.prep_time_minutes} min</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No menu items found yet.</p>
      )}
    </div>
  )
}