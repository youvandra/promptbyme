/*
  # Remove Stripe Subscription Tables and Functions

  1. Changes
    - Drop user_subscriptions table
    - Drop related functions for subscription management
    - Clean up any references to subscription functionality

  2. Security
    - No changes to existing RLS policies
    - Removes unnecessary database objects
*/

-- Drop the user_subscriptions table and all its dependencies
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Drop subscription-related functions
DROP FUNCTION IF EXISTS update_user_subscriptions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS has_active_subscription(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_subscription_plan(uuid) CASCADE;