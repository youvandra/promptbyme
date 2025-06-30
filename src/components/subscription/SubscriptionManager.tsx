import React from 'react'
import { CreditCard, Crown, Check } from 'lucide-react'

export const SubscriptionManager: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Current Plan Display */}
      <div className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Crown className="text-indigo-400" size={20} />
          </div>
          <div>
            <h4 className="font-medium text-white">Free Plan</h4>
            <p className="text-sm text-zinc-400">Basic features included</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">$0</p>
          <p className="text-xs text-zinc-400">per month</p>
        </div>
      </div>

      {/* Plan Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-white">Current Features</h5>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Check size={14} className="text-emerald-400" />
              <span>Basic prompt management</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Check size={14} className="text-emerald-400" />
              <span>Public prompt sharing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Check size={14} className="text-emerald-400" />
              <span>Basic API access</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-white">Usage</h5>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">API Calls</span>
                <span className="text-white">0 / 100</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Button */}
      <div className="pt-2">
        <button className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 btn-hover shadow-md hover:shadow-lg hover:shadow-indigo-500/20">
          Upgrade Plan
        </button>
      </div>
    </div>
  )
}