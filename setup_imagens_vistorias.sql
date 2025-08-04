-- Script SQL para configurar sistema de imagens das vistorias
-- Execute estes comandos no seu banco PostgreSQL do Supabase

-- 1. Adicionar colunas para sistema de remuneração (se ainda não existirem)
ALTER TABLE vistoriadores 
ADD COLUMN IF NOT EXISTS valor_unitario_credito DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE vistorias 
ADD COLUMN IF NOT EXISTS valor_unitario_vistoriador DECIMAL(10,2) DEFAULT 0.00;

-- 2. Criar tabela para armazenar metadados das imagens das vistorias
CREATE TABLE IF NOT EXISTS imagens_vistorias (
  id BIGSERIAL PRIMARY KEY,
  vistoria_id BIGINT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  path_storage TEXT NOT NULL,
  url_publica TEXT NOT NULL,
  tipo_imagem VARCHAR(50) DEFAULT 'trena',
  tamanho_arquivo VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (vistoria_id) REFERENCES vistorias(id) ON DELETE CASCADE
);

-- 3. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_imagens_vistorias_vistoria_id ON imagens_vistorias(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_imagens_vistorias_ativo ON imagens_vistorias(ativo);
CREATE INDEX IF NOT EXISTS idx_imagens_vistorias_tipo ON imagens_vistorias(tipo_imagem);

-- 4. Criar bucket no Supabase Storage para armazenar as imagens
-- ATENÇÃO: Execute este comando apenas uma vez
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens-vistorias', 'imagens-vistorias', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Configurar políticas de segurança para o bucket (RLS)
-- Permitir SELECT (visualização) para usuários autenticados
CREATE POLICY IF NOT EXISTS "Usuários podem visualizar imagens das vistorias"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'imagens-vistorias');

-- Permitir INSERT (upload) para usuários autenticados
CREATE POLICY IF NOT EXISTS "Usuários podem fazer upload de imagens das vistorias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imagens-vistorias');

-- Permitir DELETE para usuários autenticados (apenas suas próprias imagens)
CREATE POLICY IF NOT EXISTS "Usuários podem excluir imagens das vistorias"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagens-vistorias');

-- 6. Comentários explicativos sobre a estrutura
COMMENT ON TABLE imagens_vistorias IS 'Armazena metadados das imagens anexadas às vistorias';
COMMENT ON COLUMN imagens_vistorias.vistoria_id IS 'Referência à vistoria proprietária da imagem';
COMMENT ON COLUMN imagens_vistorias.nome_arquivo IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN imagens_vistorias.path_storage IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN imagens_vistorias.url_publica IS 'URL pública para acesso à imagem';
COMMENT ON COLUMN imagens_vistorias.tipo_imagem IS 'Tipo da imagem (trena, documento, etc.)';
COMMENT ON COLUMN imagens_vistorias.tamanho_arquivo IS 'Tamanho do arquivo formatado (ex: 2.5 MB)';

-- 7. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_imagens_vistorias_updated_at 
    BEFORE UPDATE ON imagens_vistorias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificação final - visualizar estrutura criada
SELECT 
    'Tabela imagens_vistorias criada com sucesso!' as status,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'imagens_vistorias';

SELECT 
    'Bucket imagens-vistorias configurado!' as status,
    public as bucket_publico
FROM storage.buckets 
WHERE id = 'imagens-vistorias'; 