# Como Executar a Migration SQL no Supabase

## Passo a Passo

### 1. Acesse o Painel do Supabase
- Acesse: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto desejado

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Clique no botão **"New query"** (ou use o atalho Ctrl+N)

### 3. Execute a Migration
- Copie todo o conteúdo do arquivo `migration_balanco_tabelas.sql`
- Cole no editor SQL
- Clique no botão **"Run"** (ou pressione Ctrl+Enter)
- Aguarde a execução completar

### 4. Verificar se Funcionou
Execute esta query para verificar se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('balanco_engenheiro', 'balanco_percentuais');
```

Se retornar as duas tabelas, está tudo certo!

## Observações

- ⚠️ **A migration usa `CREATE TABLE IF NOT EXISTS`**, então é seguro executá-la mesmo se as tabelas já existirem
- ✅ Se você já está conseguindo salvar dados, provavelmente as tabelas já existem
- 🔍 Use o SQL Editor também para verificar dados, fazer queries de teste, etc.

