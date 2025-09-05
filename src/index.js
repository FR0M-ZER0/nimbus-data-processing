import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/api.js'


const app = express()

app.use(express.json())
app.use(cors({
    origin: process.env.CLIENT_ADDRESS,
    credentials: true
}))
app.use('/api', router)

export default app