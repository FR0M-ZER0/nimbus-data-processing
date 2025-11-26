import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processDocument } from '../services/dataProcessor.js';
import { prisma } from '../lib/prisma.js';
import * as apiService from '../services/apiService.js';

// 1. Mock do Prisma para não conectar no banco real
vi.mock('../lib/prisma.js', () => ({
    prisma: {
        parametro: {
            findFirst: vi.fn()
        },
        medida: {
            createMany: vi.fn()
        }
    }
}));

// 2. Mock do WebSocket para não tentar conectar
vi.mock('ws', () => {
    return {
        default: class WebSocket {
            constructor() {
                this.readyState = 1; // OPEN
            }
            send = vi.fn();
            close = vi.fn();
        }
    };
});

// 3. Mock do fetch global (usado para enviar log para API)
global.fetch = vi.fn();

describe('Serviço: DataProcessor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Configuração padrão do fetch (sucesso)
        global.fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('OK')
        });
    });

    it('Deve processar um documento e salvar medidas corretamente', async () => {
        // DADOS DE ENTRADA (Simulando documento do MongoDB)
        const mockDoc = {
            _id: 'mongo-id-123',
            uid: 'estacao-01',
            uxt: 1700000000000,
            readings: {
                'temp': 25.5,
                'umi': 60
            }
        };

        // MOCK: Collection do Mongo (Simulada)
        const mockCollection = {
            deleteOne: vi.fn().mockResolvedValue(true)
        };

        // MOCK: Retorno da API de Tipos de Parâmetro
        vi.spyOn(apiService, 'getTipoParametrosFromStationId').mockResolvedValue([
            { id_tipo_parametro: 1, json: { 'temp': {} } },
            { id_tipo_parametro: 2, json: { 'umi': {} } }
        ]);

        // MOCK: Retorno do Prisma (Buscar ID do parâmetro da estação)
        prisma.parametro.findFirst.mockImplementation(({ where }) => {
            if (where.id_tipo_parametro === 1) return Promise.resolve({ id_parametro: 100 }); // Temp
            if (where.id_tipo_parametro === 2) return Promise.resolve({ id_parametro: 101 }); // Umi
            return Promise.resolve(null);
        });

        // MOCK: Retorno do Prisma (Salvar Medida)
        prisma.medida.createMany.mockResolvedValue({ count: 2 });

        // --- EXECUÇÃO ---
        await processDocument(mockDoc, mockCollection);

        // --- VALIDAÇÕES ---
        
        // 1. Verificou os tipos de parâmetros na API?
        expect(apiService.getTipoParametrosFromStationId).toHaveBeenCalledWith('estacao-01');

        // 2. Tentou salvar no Postgres via Prisma?
        expect(prisma.medida.createMany).toHaveBeenCalledWith({
            data: [
                {
                    id_parametro: 100,
                    valor: 25.5,
                    data_hora: BigInt(1700000000000)
                },
                {
                    id_parametro: 101,
                    valor: 60,
                    data_hora: BigInt(1700000000000)
                }
            ],
            skipDuplicates: true
        });

        // 3. Deletou do Mongo após processar?
        expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'mongo-id-123' });
    });

    it('Deve ignorar leituras que não têm parâmetro configurado', async () => {
        const mockDoc = {
            _id: 'mongo-id-456',
            uid: 'estacao-02',
            uxt: 1700000000000,
            readings: {
                'chuva': 10 // Parâmetro desconhecido
            }
        };
        const mockCollection = { deleteOne: vi.fn() };

        // API retorna lista vazia de parâmetros
        vi.spyOn(apiService, 'getTipoParametrosFromStationId').mockResolvedValue([]);

        await processDocument(mockDoc, mockCollection);

        // Não deve tentar salvar nada no Prisma
        expect(prisma.medida.createMany).not.toHaveBeenCalled();
        // Mas deve deletar o documento "inútil" do Mongo para não travar a fila
        expect(mockCollection.deleteOne).toHaveBeenCalled();
    });
});