-- Chowly Restaurant App — Seed Data
-- Sample rows to populate a fresh database for testing/demo purposes

INSERT INTO restaurant (restaurant_id, name, location, contact_number) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Chowly Lagos', 'Lagos, Nigeria', '08000000000');

INSERT INTO chef (chef_id, restaurant_id, name) VALUES
  ('41111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Chef Ade');

INSERT INTO bartender (bartender_id, restaurant_id, name) VALUES
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Bartender Tayo');

INSERT INTO waiter (waiter_id, restaurant_id, name) VALUES
  ('61111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Waiter Chinedu');

INSERT INTO menu_item (menu_item_id, restaurant_id, name, item_type, price, prep_time_minutes) VALUES
  ('71111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Jollof Rice & Chicken', 'Food', 4500, 20),
  ('72111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pepper Soup', 'Food', 3000, 25),
  ('73111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Grilled Fish', 'Food', 6500, 30),
  ('74111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chapman', 'Drink', 3000, 5),
  ('75111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chilled Zobo', 'Drink', 1500, 5);

-- Note: customer, order, order_item, payment, and complaint rows are intentionally
-- left out of seed data since they are created dynamically through the app's
-- ordering flow during normal use and testing.