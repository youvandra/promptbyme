import React from 'react'
import { CreditCard, Zap, Lock, Shield, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscription } from '../../hooks/useSubscription'

interface UpgradeMessageProps {
  feature: 'project-space' | 'api' | 'prompt-flow'
  minPlan: 'basic' | 'pro' | 'enterprise'
}

export const UpgradeMessage: React.FC<UpgradeMessageProps> = ({ feature, minPlan }) => {
  const { getPlanName } = useSubscription()
  
  const featureInfo = {
    'project-space': {
      title: 'Project Space',
      description: 'Create visual prompt projects with nodes and connections',
      icon: <Zap size={32} className="text-indigo-400" />,
      benefits: [
        'Create unlimited projects',
        'Collaborate with team members',
        'Visual node-based editor',
        'Export and share your projects'
      ]
    },
    'api': {
      title: 'API Access',
      description: 'Access the promptby.me API to run prompts programmatically',
      icon: <Shield size={32} className="text-indigo-400" />,
      benefits: [
        'Secure API key management',
        'Run prompts via API',
        'Detailed API logs',
        'Custom integrations'
      ]
    },
    'prompt-flow': {
      title: 'Prompt Flow',
      description: 'Create sequential prompt chains for complex workflows',
      icon: <Lock size={32} className="text-indigo-400" />,
      benefits: [
        'Create multi-step prompt flows',
        'Pass data between steps',
        'Save and reuse flows',
        'Execute flows via API'
      ]
    }
  }

  const planInfo = {
    'basic': {
      name: 'Basic Plan',
      price: '$9.99/month',
      features: [
        '50 prompts',
        'Full version control',
        'Private sharing',
        'API access'
      ]
    },
    'pro': {
      name: 'Pro Plan',
      price: '$19.99/month',
      features: [
        'Unlimited prompts',
        'Team collaboration',
        'Advanced analytics',
        'Priority support'
      ]
    },
    'enterprise': {
      name: 'Enterprise Plan',
      price: 'Custom pricing',
      features: [
        'Custom solutions',
        'Dedicated support',
        'SLA guarantees',
        'Custom integrations'
      ]
    }
  }

  const info = featureInfo[feature]
  const plan = planInfo[minPlan]

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 max-w-3xl w-full">
        <div className="text-center mb-8">
          {info.icon}
          <h2 className="text-2xl font-bold text-white mt-4 mb-2">{info.title} Requires an Upgrade</h2>
          <p className="text-zinc-400 text-lg">{info.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-2">
              {info.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-indigo-400" size={24} />
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-4">{plan.price}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-zinc-300">
                  <div className="text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="text-sm text-zinc-500 mb-6">
              Your current plan: <span className="text-indigo-400 font-medium">{getPlanName()}</span>
            </div>
            <Link
              to="/profile"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <span>Upgrade Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="text-center text-zinc-500 text-sm">
          Need help choosing a plan? <a href="mailto:support@promptby.me" className="text-indigo-400 hover:text-indigo-300 transition-colors">Contact our support team</a>
        </div>
      </div>
    </div>
  )
}