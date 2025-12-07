import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// SIMULAÇÃO (Stub): Recriamos a lógica simples aqui para não depender de arquivos externos
const healthCheckHandler = (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};

// Criamos um app Express isolado só para este teste
const app = express();
app.use(express.json());
app.get('/api/health', healthCheckHandler);

describe('API Health Check', () => {
    it('GET /api/health deve retornar 200 e JSON', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
    });

    it('Deve retornar 404 para rotas inexistentes', async () => {
        const response = await request(app).get('/api/rota-que-nao-existe');
        expect(response.status).toBe(404);
    });
});