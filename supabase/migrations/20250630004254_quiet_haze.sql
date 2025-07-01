/*
  # Add INSERT policy for user_subscriptions table

  1. Security Changes
    - Add policy to allow authenticated users to insert their own subscription records
    - Ensures users can only create subscriptions for themselves (user_id = auth.uid())

  This fixes the RLS violation error when users try to create free subscriptions.
*/

CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());