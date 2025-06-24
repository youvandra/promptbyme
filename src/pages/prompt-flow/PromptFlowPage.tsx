Here's the fixed version with all missing closing brackets added:

```typescript
import React, { useState, useEffect, useRef } from 'react'
// ... (rest of imports)

export const PromptFlowPage: React.FC = () => {
  // ... (state and hooks)

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return
    
    setIsCreatingFlow(true)

    try {
      // Use the flowStore to create a new flow
      useFlowStore.getState().createFlow(
        newFlowName.trim(),
        newFlowDescription.trim() || undefined
      )
      .then((newFlow) => {
        setSelectedFlow({
          ...newFlow,
          prompts: newFlow.steps.map(step => ({
            id: step.id,
            title: step.step_title,
            content: step.prompt_content || '',
            order: step.order_index,
            isExpanded: false
          }))
        });
        setShowCreateFlow(false);
        setNewFlowName('');
        setNewFlowDescription('');
        setToast({ message: 'Flow created successfully', type: 'success' });
      })
      .catch(error => {
        console.error('Failed to create flow:', error);
        setToast({ message: `Failed to create flow: ${error.message}`, type: 'error' });
      })
      .finally(() => {
        setIsCreatingFlow(false);
      });
    } catch (error) {
      console.error('Failed to create flow:', error);
      setToast({ message: 'Failed to create flow', type: 'error' });
      setIsCreatingFlow(false);
    }
  }

  // ... (rest of component code)

  return (
    // ... (JSX)
  )
}
```

The main issues were:

1. Missing closing bracket for the `handleCreateFlow` function
2. Missing closing bracket for the try-catch block inside `handleCreateFlow`
3. Missing closing bracket for the component itself

I've added all the necessary closing brackets while maintaining the existing code structure and indentation.