const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User')
const auth = require('../middleware/auth')
const router = express.Router()

// Encryption key for API keys (store this in environment variables)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || crypto.randomBytes(32)
const ALGORITHM = 'aes-256-gcm'

// Helper functions for encryption/decryption
const encrypt = (text) => {
  if (!text) return null
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

const decrypt = (encryptedData) => {
  if (!encryptedData || !encryptedData.encrypted) return null
  try {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

// ...existing routes...

// GET /api/user/api-keys - Get user's API keys
router.get('/api-keys', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('apiKeys')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Decrypt API keys for frontend (but mask them)
    const apiKeys = {
      openai: {
        key: user.apiKeys?.openai ? '•'.repeat(20) : '',
        isActive: !!user.apiKeys?.openai
      },
      google: {
        key: user.apiKeys?.google ? '•'.repeat(20) : '',
        isActive: !!user.apiKeys?.google
      },
      discord: {
        key: user.apiKeys?.discord ? '•'.repeat(20) : '',
        isActive: !!user.apiKeys?.discord
      },
      github: {
        key: user.apiKeys?.github ? '•'.repeat(20) : '',
        isActive: !!user.apiKeys?.github
      }
    }

    res.json({ apiKeys })
  } catch (error) {
    console.error('Get API keys error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/user/api-keys - Update user's API keys
router.put('/api-keys', auth, async (req, res) => {
  try {
    const { apiKeys } = req.body

    if (!apiKeys) {
      return res.status(400).json({ message: 'API keys data is required' })
    }

    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Encrypt and store API keys
    const encryptedApiKeys = {}
    
    for (const [service, data] of Object.entries(apiKeys)) {
      if (data.key && data.key !== '•'.repeat(20)) {
        // Only update if it's not the masked placeholder
        encryptedApiKeys[service] = encrypt(data.key)
      } else if (user.apiKeys && user.apiKeys[service]) {
        // Keep existing key if masked placeholder is sent
        encryptedApiKeys[service] = user.apiKeys[service]
      }
    }

    user.apiKeys = encryptedApiKeys
    await user.save()

    // Return masked keys for frontend
    const responseApiKeys = {
      openai: {
        key: encryptedApiKeys.openai ? '•'.repeat(20) : '',
        isActive: !!encryptedApiKeys.openai
      },
      google: {
        key: encryptedApiKeys.google ? '•'.repeat(20) : '',
        isActive: !!encryptedApiKeys.google
      },
      discord: {
        key: encryptedApiKeys.discord ? '•'.repeat(20) : '',
        isActive: !!encryptedApiKeys.discord
      },
      github: {
        key: encryptedApiKeys.github ? '•'.repeat(20) : '',
        isActive: !!encryptedApiKeys.github
      }
    }

    res.json({ 
      message: 'API keys updated successfully',
      apiKeys: responseApiKeys
    })
  } catch (error) {
    console.error('Update API keys error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/user/api-keys/decrypt/:service - Get decrypted API key for internal use
router.get('/api-keys/decrypt/:service', auth, async (req, res) => {
  try {
    const { service } = req.params
    
    const user = await User.findById(req.user.id).select('apiKeys')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.apiKeys || !user.apiKeys[service]) {
      return res.status(404).json({ message: `${service} API key not found` })
    }

    const decryptedKey = decrypt(user.apiKeys[service])
    
    if (!decryptedKey) {
      return res.status(500).json({ message: 'Failed to decrypt API key' })
    }

    res.json({ key: decryptedKey })
  } catch (error) {
    console.error('Decrypt API key error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
