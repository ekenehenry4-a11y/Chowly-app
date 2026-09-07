-- Chowly Restaurant App — Database Schema
-- Generated from live Supabase schema for documentation and reproducibility

CREATE TABLE restaurant (
  restaurant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  contact_number text
);

CREATE TABLE chef (
  chef_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant(restaurant_id),
  name text NOT NULL
);

CREATE TABLE bartender (
  bartender_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant(restaurant_id),
  name text NOT NULL
);

CREATE TABLE waiter (
  waiter_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant(restaurant_id),
  name text NOT NULL,
  password text -- plain-text password for lightweight login (not production-grade security)
);

CREATE TABLE customer (
  customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text
);

CREATE TABLE menu_item (
  menu_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant(restaurant_id),
  name text NOT NULL,
  item_type text, -- e.g. 'Food' or 'Drink'
  price numeric NOT NULL,
  prep_time_minutes integer NOT NULL
);

CREATE TABLE "order" (
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customer(customer_id),
  waiter_id uuid REFERENCES waiter(waiter_id),
  status text, -- e.g. 'Pending', 'Served' (check constraint enforces exact casing)
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE order_item (
  order_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES "order"(order_id),
  menu_item_id uuid REFERENCES menu_item(menu_item_id),
  chef_id uuid REFERENCES chef(chef_id),
  bartender_id uuid REFERENCES bartender(bartender_id),
  quantity integer NOT NULL,
  prep_start_time timestamp with time zone,
  prep_end_time timestamp with time zone
);

CREATE TABLE payment (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES "order"(order_id),
  amount numeric NOT NULL,
  status text, -- e.g. 'Paid'
  paid_at timestamp with time zone
);

CREATE TABLE complaint (
  complaint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES "order"(order_id),
  customer_id uuid REFERENCES customer(customer_id),
  description text,
  rating integer,
  created_at timestamp with time zone DEFAULT now()
);