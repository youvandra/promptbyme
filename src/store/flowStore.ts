import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { callAI } from '../lib/aiApi'

export interface FlowStep {
  id: string
  flow_id: string
  prompt_id: string
  order_index: number
  step_title: string
  created_at?: string
  prompt_content?: string
  prompt_title?: string
  custom_content?: string
  variables?: Record<string, string>
  output?: string
  isExpanded?: boolean
  isRunning?: boolean
}

export interface PromptFlow {
  id: string
  user_id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
  steps: FlowStep[]
}

interface ApiSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'llama' | 'groq'
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface FlowState {
  flows: PromptFlow[]
  selectedFlow: PromptFlow | null
  apiSettings: ApiSettings
  loading: boolean
  executing: boolean
  
  // Flow operations
  fetchFlows: () => Promise<void>
  createFlow: (name: string, description?: string) => Promise<PromptFlow>
  updateFlow: (id: string, updates: Partial<Omit<PromptFlow, 'id' | 'steps'>>) => Promise<void>
  deleteFlow: (id: string) => Promise<void>
  selectFlow: (id: string) => Promise<void>
  
  // Step operations
  addStep: (flowId: string, promptId: string, title: string, content: string) => Promise<void>
  updateStep: (stepId: string, updates: Partial<Omit<FlowStep, 'id' | 'flow_id'>>) => Promise<void>
  updateFlowStepContent: (stepId: string, customContent: string, variables?: Record<string, string>) => Promise<void>
  deleteStep: (stepId: string) => Promise<void>
  reorderStep: (stepId: string, newIndex: number) => Promise<void>
  
  // Execution
  executeFlow: (flowId: string) => Promise<void>
  executeStep: (stepId: string, previousOutput?: string) => Promise<string>
  updateApiSettings: (settings: Partial<ApiSettings>) => Promise<void>
  clearOutputs: () => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  selectedFlow: null,
  apiSettings: {
    provider: localStorage.getItem('flow_api_provider') as ApiSettings['provider'] || 'groq',
    apiKey: '',
    model: localStorage.getItem('flow_api_model') || 'llama3-8b-8192',
    temperature: parseFloat(localStorage.getItem('flow_api_temperature') || '0.7'),
    maxTokens: parseInt(localStorage.getItem('flow_api_max_tokens') || '1000')
  },
  loading: false,
  executing: false,
  
  fetchFlows: async () => {
    set({ loading: true })
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) {
        set({ flows: [], loading: false })
        throw new Error('User not authenticated')
      }

      // Fetch flows
      const { data: flows, error } = await supabase
        .from('prompt_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // For each flow, fetch its steps
      const flowsWithSteps = await Promise.all((flows || []).map(async (flow) => {
        const { data: steps, error: stepsError } = await supabase
          .from('flow_steps')
          .select(`
            id,
            flow_id,
            prompt_id,
            order_index,
            step_title,
            created_at,
            prompts (
              id,
              title,
              content
            )
          `)
          .eq('flow_id', flow.id)
          .order('order_index')

        if (stepsError) {
          console.error(`Error fetching steps for flow ${flow.id}:`, stepsError)
          return { ...flow, steps: [] }
        }

        // Fetch custom content and variables from prompt_flow_step
        const stepIds = steps?.map(step => step.id) || []
        let customContentMap: Record<string, { custom_content?: string, variables?: Record<string, string> }> = {}
        
        if (stepIds.length > 0) {
          const { data: customSteps, error: customStepsError } = await supabase
            .from('prompt_flow_step')
            .select('flow_step_id, custom_content, variables')
            .in('flow_step_id', stepIds)
          
          if (!customStepsError && customSteps) {
            customContentMap = customSteps.reduce((acc, step) => {
              acc[step.flow_step_id] = {
                custom_content: step.custom_content,
                variables: step.variables
              }
              return acc
            }, {} as Record<string, { custom_content?: string, variables?: Record<string, string> }>)
          }
        }

        // Transform steps to include prompt content
        const transformedSteps = (steps || []).map(step => ({
          id: step.id,
          flow_id: step.flow_id,
          prompt_id: step.prompt_id,
          order_index: step.order_index,
          step_title: step.step_title,
          created_at: step.created_at,
          prompt_content: step.prompts?.content || '',
          prompt_title: step.prompts?.title || '',
          custom_content: customContentMap[step.id]?.custom_content || step.prompts?.content || '',
          variables: customContentMap[step.id]?.variables || {},
          isExpanded: false
        }))

        return { ...flow, steps: transformedSteps }
      }))

      set({ flows: flowsWithSteps, loading: false })
    } catch (error) {
      console.error('Error fetching flows:', error)
      set({ loading: false })
    }
  },
  
  createFlow: async (name, description) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('prompt_flows')
        .insert([{
          user_id: user.id,
          name,
          description
        }])
        .select()
        .single()

      if (error) throw error

      const newFlow = { ...data, steps: [] }
      set(state => ({ 
        flows: [newFlow, ...state.flows],
        selectedFlow: newFlow
      }))
      return newFlow
    } catch (error) {
      console.error('Error creating flow:', error)
      throw error
    }
  },
  
  updateFlow: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('prompt_flows')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        flows: state.flows.map(flow => 
          flow.id === id ? { ...flow, ...data } : flow
        ),
        selectedFlow: state.selectedFlow?.id === id 
          ? { ...state.selectedFlow, ...data } 
          : state.selectedFlow
      }))
    } catch (error) {
      console.error('Error updating flow:', error)
      throw error
    }
  },
  
  deleteFlow: async (id) => {
    try {
      const { error } = await supabase
        .from('prompt_flows')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        flows: state.flows.filter(flow => flow.id !== id),
        selectedFlow: state.selectedFlow?.id === id ? null : state.selectedFlow
      }))
    } catch (error) {
      console.error('Error deleting flow:', error)
      throw error
    }
  },
  
  selectFlow: async (id) => {
    try {
      const { flows } = get()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      
      if (!user) {
        set({ selectedFlow: null })
        throw new Error('User not authenticated')
      }
      
      // Find the flow and verify it belongs to the current user

      
      if (!user) throw new Error('User not authenticated')
      
      // Find the flow and verify it belongs to the current user
      const flow = flows.find(f => f.id === id)
      if (!flow) throw new Error('Flow not found')
      
      // Security check: Ensure the flow belongs to the current user
      if (flow.user_id !== user.id) {
        console.error('Attempted to select a flow that does not belong to the current user')
        set({ selectedFlow: null })
        throw new Error('Unauthorized: You do not have access to this flow')
      }
      
      // Security check: Ensure the flow belongs to the current user
      if (flow.user_id !== user.id) {
        console.error('Attempted to select a flow that does not belong to the current user')
        set({ selectedFlow: null })
        throw new Error('Unauthorized: You do not have access to this flow')
      }
      
      set({ selectedFlow: flow })
    } catch (error) {
      console.error('Error selecting flow:', error)
      // Ensure selectedFlow is null in case of any error
      set({ selectedFlow: null })
      throw error
    }
  },
  
  addStep: async (flowId, promptId, title, content) => {
    try {
      // Get the current highest order index
      const { selectedFlow } = get()
      const steps = selectedFlow?.steps || []
      const nextOrderIndex = steps.length > 0 
        ? Math.max(...steps.map(s => s.order_index)) + 1 
        : 0

      const { data, error } = await supabase
        .from('flow_steps')
        .insert([{
          flow_id: flowId,
          prompt_id: promptId,
          order_index: nextOrderIndex,
          step_title: title
        }])
        .select()
        .single()

      if (error) throw error

      // Create an entry in prompt_flow_step with the original content
      const { error: stepContentError } = await supabase
        .from('prompt_flow_step')
        .insert([{
          flow_step_id: data.id,
          custom_content: content,
          variables: {}
        }])

      if (stepContentError) {
        console.error('Error creating flow step content:', stepContentError)
      }

      const newStep: FlowStep = {
        ...data,
        prompt_content: content,
        prompt_title: title,
        custom_content: content,
        variables: {},
        isExpanded: false
      }

      set(state => {
        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          if (flow.id === flowId) {
            return { ...flow, steps: [...flow.steps, newStep] }
          }
          return flow
        })
        
        const updatedSelectedFlow = state.selectedFlow?.id === flowId
          ? { ...state.selectedFlow, steps: [...state.selectedFlow.steps, newStep] }
          : state.selectedFlow

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error adding step:', error)
      throw error
    }
  },
  
  updateStep: async (stepId, updates) => {
    try {
      const { data, error } = await supabase
        .from('flow_steps')
        .update(updates)
        .eq('id', stepId)
        .select()
        .single()

      if (error) throw error

      set(state => {
        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          const stepIndex = flow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...flow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              ...updates,
              ...data
            }
            return { ...flow, steps: updatedSteps }
          }
          return flow
        })
        
        let updatedSelectedFlow = state.selectedFlow
        if (state.selectedFlow) {
          const stepIndex = state.selectedFlow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...state.selectedFlow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              ...updates,
              ...data
            }
            updatedSelectedFlow = { ...state.selectedFlow, steps: updatedSteps }
          }
        }

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error updating step:', error)
      throw error
    }
  },
  
  updateFlowStepContent: async (stepId, customContent, variables = {}) => {
    try {
      // First, check if an entry exists in prompt_flow_step
      const { data: existingData, error: checkError } = await supabase
        .from('prompt_flow_step')
        .select('id')
        .eq('flow_step_id', stepId)
        .maybeSingle()

      if (checkError) throw checkError

      let updateError
      
      if (existingData) {
        // Update existing entry
        const { error } = await supabase
          .from('prompt_flow_step')
          .update({
            custom_content: customContent,
            variables: variables
          })
          .eq('flow_step_id', stepId)
        
        updateError = error
      } else {
        // Create new entry
        const { error } = await supabase
          .from('prompt_flow_step')
          .insert([{
            flow_step_id: stepId,
            custom_content: customContent,
            variables: variables
          }])
        
        updateError = error
      }

      if (updateError) throw updateError

      // Update local state
      set(state => {
        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          const stepIndex = flow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...flow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              custom_content: customContent,
              variables: variables
            }
            return { ...flow, steps: updatedSteps }
          }
          return flow
        })
        
        let updatedSelectedFlow = state.selectedFlow
        if (state.selectedFlow) {
          const stepIndex = state.selectedFlow.steps.findIndex(s => s.id === stepId)
          if (stepIndex >= 0) {
            const updatedSteps = [...state.selectedFlow.steps]
            updatedSteps[stepIndex] = { 
              ...updatedSteps[stepIndex], 
              custom_content: customContent,
              variables: variables
            }
            updatedSelectedFlow = { ...state.selectedFlow, steps: updatedSteps }
          }
        }

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error updating flow step content:', error)
      throw error
    }
  },
  deleteStep: async (stepId) => {
    try {
      const { error } = await supabase
        .from('flow_steps')
        .delete()
        .eq('id', stepId)

      if (error) throw error

      set(state => {
        // Find which flow contains this step
        let flowId: string | null = null
        for (const flow of state.flows) {
          if (flow.steps.some(s => s.id === stepId)) {
            flowId = flow.id
            break
          }
        }

        if (!flowId) return state // Step not found

        // Update the order_index of remaining steps
        const updateOrderIndices = async (flowId: string, steps: FlowStep[]) => {
          // Sort steps by order_index
          const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index)
          
          // Update order_index for each step
          for (let i = 0; i < sortedSteps.length; i++) {
            if (sortedSteps[i].order_index !== i) {
              await supabase
                .from('flow_steps')
                .update({ order_index: i })
                .eq('id', sortedSteps[i].id)
              
              sortedSteps[i].order_index = i
            }
          }
          
          return sortedSteps
        }

        // Update both flows and selectedFlow
        const updatedFlows = state.flows.map(flow => {
          if (flow.id === flowId) {
            const updatedSteps = flow.steps.filter(s => s.id !== stepId)
            // Schedule reordering (don't wait for it)
            updateOrderIndices(flow.id, updatedSteps)
            return { ...flow, steps: updatedSteps }
          }
          return flow
        })
        
        let updatedSelectedFlow = state.selectedFlow
        if (state.selectedFlow?.id === flowId) {
          const updatedSteps = state.selectedFlow.steps.filter(s => s.id !== stepId)
          updatedSelectedFlow = { ...state.selectedFlow, steps: updatedSteps }
        }

        return { 
          flows: updatedFlows,
          selectedFlow: updatedSelectedFlow
        }
      })
    } catch (error) {
      console.error('Error deleting step:', error)
      throw error
    }
  },
  
  reorderStep: async (stepId, newIndex) => {
    try {
      const { selectedFlow } = get()
      if (!selectedFlow) throw new Error('No flow selected')

      const stepIndex = selectedFlow.steps.findIndex(s => s.id === stepId)
      if (stepIndex === -1) throw new Error('Step not found')

      const step = selectedFlow.steps[stepIndex]
      const currentIndex = step.order_index
      
      if (currentIndex === newIndex) return // No change needed

      // Update the step's order_index
      const { error } = await supabase
        .from('flow_steps')
        .update({ order_index: newIndex })
        .eq('id', stepId)

      if (error) throw error

      // Reorder other steps as needed
      const stepsToUpdate = selectedFlow.steps.filter(s => {
        if (currentIndex < newIndex) {
          // Moving down: update steps between current and new position
          return s.order_index > currentIndex && s.order_index <= newIndex
        } else {
          // Moving up: update steps between new and current position
          return s.order_index >= newIndex && s.order_index < currentIndex
        }
      })

      // Update order_index for affected steps
      for (const stepToUpdate of stepsToUpdate) {
        const newOrderIndex = currentIndex < newIndex
          ? stepToUpdate.order_index - 1 // Moving down: decrement steps in between
          : stepToUpdate.order_index + 1 // Moving up: increment steps in between
        
        await supabase
          .from('flow_steps')
          .update({ order_index: newOrderIndex })
          .eq('id', stepToUpdate.id)
      }

      // Update local state
      set(state => {
        const updatedSteps = [...selectedFlow.steps]
        
        // Update the moved step
        updatedSteps[stepIndex] = { ...step, order_index: newIndex }
        
        // Update other affected steps
        for (let i = 0; i < updatedSteps.length; i++) {
          if (i !== stepIndex) {
            const s = updatedSteps[i]
            if (currentIndex < newIndex && s.order_index > currentIndex && s.order_index <= newIndex) {
              updatedSteps[i] = { ...s, order_index: s.order_index - 1 }
            } else if (currentIndex > newIndex && s.order_index >= newIndex && s.order_index < currentIndex) {
              updatedSteps[i] = { ...s, order_index: s.order_index + 1 }
            }
          }
        }
        
        // Sort steps by order_index
        updatedSteps.sort((a, b) => a.order_index - b.order_index)
        
        // Update both selectedFlow and flows
        const updatedSelectedFlow = { ...selectedFlow, steps: updatedSteps }
        const updatedFlows = state.flows.map(flow => 
          flow.id === selectedFlow.id ? updatedSelectedFlow : flow
        )
        
        return {
          selectedFlow: updatedSelectedFlow,
          flows: updatedFlows
        }
      })
    } catch (error) {
      console.error('Error reordering step:', error)
      throw error
    }
  },
  
  executeFlow: async (flowId) => {
    try {
      set({ executing: true })

      const { selectedFlow, apiSettings } = get()
      if (!selectedFlow || selectedFlow.id !== flowId) {
        throw new Error('Selected flow does not match the flow to execute')
      }

      if (!apiSettings.apiKey) {
        throw new Error('API key is required. Please configure your API settings.')
      }

      // Clear previous outputs
      set(state => ({
        selectedFlow: state.selectedFlow ? {
          ...state.selectedFlow,
          steps: state.selectedFlow.steps.map(step => ({
            ...step,
            output: undefined,
            isRunning: false,
            isExpanded: false
          }))
        } : null
      }))

      // Sort steps by order_index
      const steps = [...selectedFlow.steps].sort((a, b) => a.order_index - b.order_index)

      // Execute steps in sequence      
      let previousStepOutput = '';

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]

        // Mark step as running
        set(state => ({
          selectedFlow: state.selectedFlow ? {
            ...state.selectedFlow,
            steps: state.selectedFlow.steps.map(s => 
              s.id === step.id ? { ...s, isRunning: true } : s
            )
          } : null
        }))

        try {
          // Execute the step
          const output = await get().executeStep(step.id, previousStepOutput)

          // Add output to context for next steps
          previousStepOutput = output;

          // Update step with output
          set(state => ({
            selectedFlow: state.selectedFlow ? {
              ...state.selectedFlow,
              steps: state.selectedFlow.steps.map(s => 
                s.id === step.id ? { ...s, output, isRunning: false } : s
              )
            } : null
          }))
        } catch (error) {
          console.error(`Error executing step ${step.id}:`, error)
          
          // Mark step as failed
          set(state => ({
            selectedFlow: state.selectedFlow ? {
              ...state.selectedFlow,
              steps: state.selectedFlow.steps.map(s => 
                s.id === step.id ? { ...s, output: `Error: ${error.message}`, isRunning: false } : s
              )
            } : null
          }))
          
          // Stop execution
          break
        }
      }
    } catch (error) {
      console.error('Error executing flow:', error)
      throw error
    } finally {
      set({ executing: false })
    }
  },
  
  executeStep: async (stepId: string, previousOutput = '') => {
    try {
      const { selectedFlow, apiSettings } = get()
      if (!selectedFlow) throw new Error('No flow selected')

      const step = selectedFlow.steps.find(s => s.id === stepId)
      if (!step) throw new Error('Step not found')

      // Replace variables in prompt content
      // Use custom_content if available, otherwise fall back to prompt_content
      let content = step.custom_content || step.prompt_content || ''

      // Replace {{variable}} placeholders with values from step variables
      for (const [key, value] of Object.entries(step.variables || {})) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        content = content.replace(regex, value)
      }
      
      // Call the appropriate API based on provider
      let response

      // Add previous step output as reference if available
      if (previousOutput && step.order_index > 0) {
        content = `Reference from previous step:\n${previousOutput}\n\n${content}`;
      }

      // Call the AI API
      try {
        const { provider, apiKey, model, temperature, maxTokens } = get().apiSettings;
        const response = await callAI({
          provider,
          apiKey,
          model,
          prompt: content,
          temperature,
          maxTokens
        });
        return response;
      } catch (error) {
        console.error('AI API call failed:', error);
        throw new Error(`AI API call failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error executing step:', error)
      throw error
    }
  },
  
  updateApiSettings: async (settings) => {
    set(state => ({
      apiSettings: {
        ...state.apiSettings,
        ...settings
      }
    }))
    
    // Save API settings to localStorage
    if (settings.provider) localStorage.setItem('flow_api_provider', settings.provider);
    if (settings.model) localStorage.setItem('flow_api_model', settings.model);
    if (settings.temperature) localStorage.setItem('flow_api_temperature', settings.temperature.toString());
    if (settings.maxTokens) localStorage.setItem('flow_api_max_tokens', settings.maxTokens.toString());
    
    // If API key is provided, store it securely
    if (settings.apiKey) {
      try {
        // Use the browser's built-in crypto API for simple encryption
        const encoder = new TextEncoder();
        const data = encoder.encode(settings.apiKey);
        
        // Create a random initialization vector
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Use a derived key for encryption (in a real app, you'd use a more secure key derivation)
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          encoder.encode('promptby.me-encryption-key'),
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: encoder.encode('promptby.me-salt'),
            iterations: 100000,
            hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        
        // Encrypt the API key
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          data
        );
        
        // Combine IV and encrypted data
        const encryptedArray = new Uint8Array(encrypted);
        const combined = new Uint8Array(iv.length + encryptedArray.length);
        combined.set(iv);
        combined.set(encryptedArray, iv.length);
        
        // Store as base64 string
        const base64 = btoa(String.fromCharCode(...combined));
        localStorage.setItem('flow_api_key_encrypted', base64);
      } catch (error) {
        console.error('Failed to securely store API key:', error);
        // Fallback to storing in memory only
      }
    }
  },
  
  clearOutputs: () => {
    set(state => ({
      selectedFlow: state.selectedFlow ? {
        ...state.selectedFlow,
        steps: state.selectedFlow.steps.map(step => ({
          ...step,
          output: undefined,
          isRunning: false
        }))
      } : null
    }))
  }
}))