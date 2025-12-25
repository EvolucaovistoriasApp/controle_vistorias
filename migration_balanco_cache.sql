-- =============================================================================
-- MIGRAÇÃO: Sistema de Cache para Balanço Financeiro
-- Descrição: Cria tabela para armazenar valores pré-calculados do balanço
-- Data: 2025-01-XX
-- =============================================================================

-- 1. Criar tabela para cache dos valores de evolução (valores líquidos por mês/ano)
CREATE TABLE IF NOT EXISTS balanco_evolucao_cache (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes_numero INTEGER NOT NULL CHECK (mes_numero >= 1 AND mes_numero <= 12),
  valor_liquido DECIMAL(12,2) DEFAULT 0.00,
  data_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano, mes_numero)
);

-- 2. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_balanco_evolucao_cache_ano ON balanco_evolucao_cache(ano);
CREATE INDEX IF NOT EXISTS idx_balanco_evolucao_cache_ano_mes ON balanco_evolucao_cache(ano, mes_numero);

-- 3. Comentários para documentação
COMMENT ON TABLE balanco_evolucao_cache IS 'Cache dos valores líquidos calculados por mês/ano para otimizar a tela de balanço';
COMMENT ON COLUMN balanco_evolucao_cache.valor_liquido IS 'Valor líquido total (vistorias - remuneração) do mês';
COMMENT ON COLUMN balanco_evolucao_cache.data_calculo IS 'Data/hora em que o cálculo foi realizado';
COMMENT ON COLUMN balanco_evolucao_cache.data_atualizacao IS 'Data/hora da última atualização do registro';

-- 4. Função para atualizar automaticamente data_atualizacao
CREATE OR REPLACE FUNCTION update_balanco_evolucao_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para atualizar data_atualizacao automaticamente
DROP TRIGGER IF EXISTS trigger_update_balanco_evolucao_cache_updated_at ON balanco_evolucao_cache;
CREATE TRIGGER trigger_update_balanco_evolucao_cache_updated_at
  BEFORE UPDATE ON balanco_evolucao_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_balanco_evolucao_cache_updated_at();

-- 6. Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'balanco_evolucao_cache'
ORDER BY ordinal_position;

