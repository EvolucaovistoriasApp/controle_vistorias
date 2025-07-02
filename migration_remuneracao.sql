-- =============================================================================
-- MIGRAÇÃO: Sistema de Remuneração dos Vistoriadores
-- Descrição: Adiciona colunas para controlar remuneração individual dos vistoriadores
-- Data: 2025-01-02
-- =============================================================================

-- 1. Adicionar coluna valor_unitario_credito na tabela vistoriadores
-- Esta coluna armazena o valor que cada vistoriador recebe por crédito
ALTER TABLE vistoriadores 
ADD COLUMN IF NOT EXISTS valor_unitario_credito DECIMAL(10,2) DEFAULT 0.00;

-- 2. Adicionar coluna valor_unitario_vistoriador na tabela vistorias
-- Esta coluna armazena o valor unitário "congelado" no momento do lançamento da vistoria
ALTER TABLE vistorias 
ADD COLUMN IF NOT EXISTS valor_unitario_vistoriador DECIMAL(10,2) DEFAULT 0.00;

-- 3. Comentários das colunas para documentação
COMMENT ON COLUMN vistoriadores.valor_unitario_credito IS 'Valor que o vistoriador recebe por cada crédito (consumo) de vistoria realizada';
COMMENT ON COLUMN vistorias.valor_unitario_vistoriador IS 'Valor unitário do vistoriador no momento do lançamento da vistoria (histórico congelado)';

-- 4. Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('vistoriadores', 'vistorias') 
  AND column_name IN ('valor_unitario_credito', 'valor_unitario_vistoriador')
ORDER BY table_name, column_name; 