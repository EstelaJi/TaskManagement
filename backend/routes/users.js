import express from 'express'
import User from '../models/User.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const user = await User.findById(id)
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required' })
    }
    
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' })
    }
    
    const existingUsername = await User.findByUsername(username)
    if (existingUsername) {
      return res.status(400).json({ success: false, error: 'Username already exists' })
    }
    
    const user = await User.create({ username, email, password, full_name })
    res.status(201).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { username, email, password, full_name } = req.body
    
    const existingUser = await User.findById(id)
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    
    if (email && email !== existingUser.email) {
      const existingEmail = await User.findByEmail(email)
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already exists' })
      }
    }
    
    if (username && username !== existingUser.username) {
      const existingUsername = await User.findByUsername(username)
      if (existingUsername) {
        return res.status(400).json({ success: false, error: 'Username already exists' })
      }
    }
    
    const updatedUser = await User.update(id, { username, email, password, full_name })
    res.json({ success: true, data: updatedUser })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    
    await User.delete(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
