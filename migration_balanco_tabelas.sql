-- =============================================================================
-- MIGRAÇÃO: Tabelas para Sistema de Balanço Financeiro
-- Descrição: Cria tabelas para armazenar dados do engenheiro e percentuais personalizados
-- Data: 2025-01-XX
-- =============================================================================

-- 1. Criar tabela para dados do engenheiro (contratos, descontos, salários, dízimos)
CREATE TABLE IF NOT EXISTS balanco_engenheiro (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  mes_numero INTEGER NOT NULL CHECK (mes_numero >= 1 AND mes_numero <= 12),
  contrato DECIMAL(12,2) DEFAULT 0.00,
  percentual_desconto DECIMAL(5,2) DEFAULT 55.00,
  desconto DECIMAL(12,2) DEFAULT 0.00,
  extra DECIMAL(12,2) DEFAULT 0.00,
  salario DECIMAL(12,2) DEFAULT 0.00,
  percentual_dizimo DECIMAL(5,2) DEFAULT 10.00,
  dizimo DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano, mes_numero)
);

-- 2. Criar tabela para percentuais personalizados
CREATE TABLE IF NOT EXISTS balanco_percentuais (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  mes_numero INTEGER NOT NULL CHECK (mes_numero >= 1 AND mes_numero <= 12),
  tipo VARCHAR(50) NOT NULL, -- 'evolucao_dizimo', 'engenheiro_desconto', 'engenheiro_dizimo'
  percentual DECIMAL(5,2) NOT NULL,
  valor_base DECIMAL(12,2) DEFAULT 0.00,
  valor_calculado DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano, mes_numero, tipo)
);

-- 3. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_balanco_engenheiro_ano ON balanco_engenheiro(ano);
CREATE INDEX IF NOT EXISTS idx_balanco_engenheiro_ano_mes ON balanco_engenheiro(ano, mes_numero);
CREATE INDEX IF NOT EXISTS idx_balanco_percentuais_ano ON balanco_percentuais(ano);
CREATE INDEX IF NOT EXISTS idx_balanco_percentuais_ano_mes ON balanco_percentuais(ano, mes_numero);
CREATE INDEX IF NOT EXISTS idx_balanco_percentuais_tipo ON balanco_percentuais(tipo);

-- 4. Funções para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION update_balanco_engenheiro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_balanco_percentuais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_balanco_engenheiro_updated_at ON balanco_engenheiro;
CREATE TRIGGER trigger_update_balanco_engenheiro_updated_at
  BEFORE UPDATE ON balanco_engenheiro
  FOR EACH ROW
  EXECUTE FUNCTION update_balanco_engenheiro_updated_at();

DROP TRIGGER IF EXISTS trigger_update_balanco_percentuais_updated_at ON balanco_percentuais;
CREATE TRIGGER trigger_update_balanco_percentuais_updated_at
  BEFORE UPDATE ON balanco_percentuais
  FOR EACH ROW
  EXECUTE FUNCTION update_balanco_percentuais_updated_at();

-- 6. Comentários para documentação
COMMENT ON TABLE balanco_engenheiro IS 'Dados do engenheiro (contratos, descontos, salários e dízimos) por mês/ano';
COMMENT ON TABLE balanco_percentuais IS 'Percentuais personalizados aplicados aos cálculos do balanço';
COMMENT ON COLUMN balanco_percentuais.tipo IS 'Tipo do percentual: evolucao_dizimo, engenheiro_desconto, engenheiro_dizimo';

-- 7. Verificar se as tabelas foram criadas corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('balanco_engenheiro', 'balanco_percentuais')
ORDER BY table_name, ordinal_position;

