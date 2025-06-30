import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'inactive';
  current_period_end?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        
        // If no subscription found, create a free one
        if (error.code === 'PGRST116') {
          await createFreeSubscription();
        } else {
          setError(error.message);
        }
      } else {
        setSubscription(data);
      }
    } catch (error: any) {
      console.error('Error in subscription fetch:', error);
      setError(error.message || 'An error occurred while fetching subscription');
    } finally {
      setLoading(false);
    }
  };

  const createFreeSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan: 'free',
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating free subscription:', error);
        setError(error.message);
      } else {
        setSubscription(data);
      }
    } catch (error: any) {
      console.error('Error in create subscription:', error);
      setError(error.message || 'An error occurred while creating subscription');
    }
  };

  const isFeatureAvailable = (feature: string): boolean => {
    if (!subscription || subscription.status !== 'active') {
      return false;
    }

    // Define feature availability by plan
    const featureAvailability: Record<string, string[]> = {
      'api-access': ['basic', 'pro', 'enterprise'],
      'team-collaboration': ['pro', 'enterprise'],
      'unlimited-prompts': ['pro', 'enterprise'],
      'private-sharing': ['basic', 'pro', 'enterprise'],
      'priority-support': ['basic', 'pro', 'enterprise'],
      'custom-variables': ['free', 'basic', 'pro', 'enterprise'],
      'custom-integrations': ['enterprise'],
      'advanced-analytics': ['pro', 'enterprise']
    };

    const availablePlans = featureAvailability[feature] || [];
    return availablePlans.includes(subscription.plan);
  };

  return {
    subscription,
    loading,
    error,
    isFeatureAvailable,
    refreshSubscription: fetchSubscription
  };
};

export default useSubscription;