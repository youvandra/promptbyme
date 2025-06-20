// Simple toast utility
export const toast = {
  success: (message: string) => {
    console.log(`%c✓ ${message}`, 'color: #10b981; font-weight: bold;');
    // You could implement a real toast notification here
  },
  error: (message: string) => {
    console.error(`%c✗ ${message}`, 'color: #ef4444; font-weight: bold;');
    // You could implement a real toast notification here
  },
  info: (message: string) => {
    console.info(`%cℹ ${message}`, 'color: #3b82f6; font-weight: bold;');
    // You could implement a real toast notification here
  }
};