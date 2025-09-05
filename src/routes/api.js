import express from 'express'
const router = express.Router()

// controllers
import { healthCheck } from '../controllers/healthCheckController.js'

// Health Check
router.get('/health', healthCheck)

export default router