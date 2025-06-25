import { useState } from 'react'

export const useSecureStorage = () => {
  // Encryption utilities
  const generateKey = async (password: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('promptby.me-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  const encryptData = async (data: string): Promise<string> => {
    try {
      const key = await generateKey('promptby.me-encryption-key')
      const encoder = new TextEncoder()
      const dataBytes = encoder.encode(data)
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBytes
      )
      
      const encryptedArray = new Uint8Array(encrypted)
      const combined = new Uint8Array(iv.length + encryptedArray.length)
      combined.set(iv)
      combined.set(encryptedArray, iv.length)
      
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Encryption failed:', error)
      return data // Fallback to plain text if encryption fails
    }
  }

  const decryptData = async (encryptedData: string): Promise<string> => {
    try {
      const key = await generateKey('promptby.me-encryption-key')
      const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)))
      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      )
      
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      return encryptedData // Fallback to treating as plain text
    }
  }

  const setSecureItem = async (key: string, value: string) => {
    const encrypted = await encryptData(value)
    localStorage.setItem(key, encrypted)
    return true
  }

  const getSecureItem = async (key: string): Promise<string | null> => {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    return await decryptData(encrypted)
  }

  return {
    setSecureItem,
    getSecureItem
  }
}