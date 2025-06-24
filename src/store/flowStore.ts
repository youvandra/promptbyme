import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface FlowStep {
  id: string
  flow_id: string
  prompt_id: string
  order_index: number
  step_title: string
  created_at: string
  prompt?: {
    title?: string
    content: string
  }
}

export interface PromptFlow {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  steps?: FlowStep[]
}

interface FlowState {
  flows: PromptFlow[]
  selectedFlow: PromptFlow | null
  loading: boolean
  
  // Flow operations
  fetchFlows: () => Promise<void>
  createFlow: (name: string, description?: string) => Promise<PromptFlow>
  updateFlow: (id: string, updates: Partial<PromptFlow>) => Promise<void>
  deleteFlow: (id: string) => Promise<void>
  selectFlow: (flow: PromptFlow) => Promise<void>
  
  // Step operations
  addStep: (flowId: string, promptId: string, stepTitle: string, orderIndex?: number) => Promise<FlowStep>
  updateStep: (stepId: string, updates: Partial<FlowStep>) => Promise<void>
  deleteStep: (stepId: string) => Promise<void>
  reorderSteps: (flowId: string, stepIds: string[]) => Promise<void>
  
  // Flow execution
  executeFlow: (flowId: string, apiKey: string, model: string, initialVariables?: Record<string, string>) => Promise<string[]>
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  selectedFlow: null,
  loading: false,

  fetchFlows: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: flows, error } = await supabase
        .from('prompt_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ flows: flows || [] })
    } catch (error) {
      console.error('Error fetching flows:', error)
    } finally {
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

      // Update local state
      const { flows } = get()
      set({ flows: [data, ...flows] })
      
      return data
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

      // Update local state
      const { flows, selectedFlow } = get()
      set({
        flows: flows.map(f => f.id === id ? { ...f, ...data } : f),
        selectedFlow: selectedFlow?.id === id ? { ...selectedFlow, ...data } : selectedFlow
      })
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

      // Update local state
      const { flows, selectedFlow } = get()
      set({
        flows: flows.filter(f => f.id !== id),
        selectedFlow: selectedFlow?.id === id ? null : selectedFlow
      })
    } catch (error) {
      console.error('Error deleting flow:', error)
      throw error
    }
  },

  selectFlow: async (flow) => {
    try {
      // Fetch steps for the selected flow
      const { data: steps, error } = await supabase
        .from('flow_steps')
        .select(`
          *,
          prompt:prompts(id, title, content)
        `)
        .eq('flow_id', flow.id)
        .order('order_index')

      if (error) throw error

      // Format steps to include prompt data
      const formattedSteps = steps?.map(step => ({
        ...step,
        prompt_id: step.prompt_id,
        prompt: {
          title: step.prompt.title,
          content: step.prompt.content
        }
      })) || []

      // Set selected flow with steps
      set({
        selectedFlow: {
          ...flow,
          steps: formattedSteps
        }
      })
    } catch (error) {
      console.error('Error selecting flow:', error)
      throw error
    }
  },

  addStep: async (flowId, promptId, stepTitle, orderIndex) => {
    try {
      // If order index is not provided, add to the end
      let nextOrderIndex = orderIndex
      
      if (nextOrderIndex === undefined) {
        const { selectedFlow } = get()
        nextOrderIndex = selectedFlow?.steps?.length || 0
      }

      const { data, error } = await supabase
        .from('flow_steps')
        .insert([{
          flow_id: flowId,
          prompt_id: promptId,
          step_title: stepTitle,
          order_index: nextOrderIndex
        }])
        .select(`
          *,
          prompt:prompts(id, title, content)
        `)
        .single()

      if (error) throw error

      // Format step to include prompt data
      const formattedStep = {
        ...data,
        prompt_id: data.prompt_id,
        prompt: {
          title: data.prompt.title,
          content: data.prompt.content
        }
      }

      // Update selected flow
      const { selectedFlow } = get()
      if (selectedFlow?.id === flowId) {
        set({
          selectedFlow: {
            ...selectedFlow,
            steps: [...(selectedFlow.steps || []), formattedStep]
          }
        })
      }

      return formattedStep
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

      // Update selected flow
      const { selectedFlow } = get()
      if (selectedFlow?.steps) {
        set({
          selectedFlow: {
            ...selectedFlow,
            steps: selectedFlow.steps.map(step => 
              step.id === stepId ? { ...step, ...data } : step
            )
          }
        })
      }
    } catch (error) {
      console.error('Error updating step:', error)
      throw error
    }
  },

  deleteStep: async (stepId) => {
    try {
      const { selectedFlow } = get()
      if (!selectedFlow) return

      // Find the step to delete
      const stepToDelete = selectedFlow.steps?.find(step => step.id === stepId)
      if (!stepToDelete) return

      const { error } = await supabase
        .from('flow_steps')
        .delete()
        .eq('id', stepId)

      if (error) throw error

      // Get remaining steps
      const remainingSteps = selectedFlow.steps?.filter(step => step.id !== stepId) || []
      
      // Reorder remaining steps if needed
      if (remainingSteps.length > 0) {
        // Update order_index for all steps after the deleted one
        const stepsToUpdate = remainingSteps
          .filter(step => step.order_index > stepToDelete.order_index)
          .map(step => ({
            id: step.id,
            order_index: step.order_index - 1
          }))
        
        if (stepsToUpdate.length > 0) {
          // Update each step's order_index in the database
          for (const step of stepsToUpdate) {
            await supabase
              .from('flow_steps')
              .update({ order_index: step.order_index })
              .eq('id', step.id)
          }
        }
        
        // Update local state with reordered steps
        set({
          selectedFlow: {
            ...selectedFlow,
            steps: remainingSteps.map(step => ({
              ...step,
              order_index: step.order_index > stepToDelete.order_index 
                ? step.order_index - 1 
                : step.order_index
            }))
          }
        })
      } else {
        // No steps left
        set({
          selectedFlow: {
            ...selectedFlow,
            steps: []
          }
        })
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      throw error
    }
  },

  reorderSteps: async (flowId, stepIds) => {
    try {
      // Update each step's order_index in the database
      for (let i = 0; i < stepIds.length; i++) {
        await supabase
          .from('flow_steps')
          .update({ order_index: i })
          .eq('id', stepIds[i])
      }

      // Update local state
      const { selectedFlow } = get()
      if (selectedFlow?.id === flowId && selectedFlow.steps) {
        // Create a map of step IDs to their new order
        const orderMap = new Map(stepIds.map((id, index) => [id, index]))
        
        // Sort steps based on new order
        const reorderedSteps = [...selectedFlow.steps]
          .map(step => ({
            ...step,
            order_index: orderMap.get(step.id) ?? step.order_index
          }))
          .sort((a, b) => a.order_index - b.order_index)
        
        set({
          selectedFlow: {
            ...selectedFlow,
            steps: reorderedSteps
          }
        })
      }
    } catch (error) {
      console.error('Error reordering steps:', error)
      throw error
    }
  },

  executeFlow: async (flowId, apiKey, model, initialVariables = {}) => {
    try {
      const { selectedFlow } = get()
      if (!selectedFlow || !selectedFlow.steps || selectedFlow.steps.length === 0) {
        throw new Error('No flow selected or flow has no steps')
      }

      // Sort steps by order_index to ensure correct execution order
      const orderedSteps = [...selectedFlow.steps].sort((a, b) => a.order_index - b.order_index)
      
      // Initialize results array to store outputs from each step
      const results: string[] = []
      
      // Initialize variables object with initial variables
      let variables = { ...initialVariables }
      
      // Execute each step in sequence
      for (const step of orderedSteps) {
        // Get the prompt content
        let promptContent = step.prompt?.content || ''
        
        // Replace variables in the prompt content
        for (const [key, value] of Object.entries(variables)) {
          promptContent = promptContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        }
        
        // Execute the prompt using the specified API
        let response
        
        if (model.includes('gpt')) {
          // OpenAI API
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: promptContent }],
              temperature: 0.7
            })
          })
          
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with OpenAI')
          }
          
          const result = data.choices[0]?.message?.content || ''
          results.push(result)
          
          // Store result as a variable for the next step
          variables[`step_${step.order_index + 1}_output`] = result
        } 
        else if (model.includes('claude')) {
          // Anthropic Claude API
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: promptContent }],
              max_tokens: 1000
            })
          })
          
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with Claude')
          }
          
          const result = data.content[0]?.text || ''
          results.push(result)
          
          // Store result as a variable for the next step
          variables[`step_${step.order_index + 1}_output`] = result
        }
        else if (model.includes('gemini')) {
          // Google Gemini API
          response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptContent }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
              }
            })
          })
          
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with Gemini')
          }
          
          const result = data.candidates[0]?.content?.parts[0]?.text || ''
          results.push(result)
          
          // Store result as a variable for the next step
          variables[`step_${step.order_index + 1}_output`] = result
        }
        else {
          throw new Error(`Unsupported model: ${model}`)
        }
      }
      
      return results
    } catch (error) {
      console.error('Error executing flow:', error)
      throw error
    }
  }
}))