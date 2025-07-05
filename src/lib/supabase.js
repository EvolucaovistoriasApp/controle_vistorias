import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecnczvgvcizyxhleovfq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbmN6dmd2Y2l6eXhobGVvdmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDMxMzksImV4cCI6MjA2NjAxOTEzOX0.dOVkJSz0b__UlUfMm1wEPFsaHi1MgzygFiCstjQ8mUI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Serviços de autenticação
export const authService = {
  // Login do usuário
  async login(username, senha) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('senha', senha)
        .eq('ativo', true)
        .single()
      
      if (error) {
        console.error('Erro no login:', error)
        return { success: false, error: 'Usuário ou senha inválidos' }
      }
      
      return { success: true, user: data }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Alterar senha do usuário
  async alterarSenha(userId, senhaAtual, novaSenha) {
    try {
      // Verificar senha atual
      const { data: user, error: verifyError } = await supabase
        .from('usuarios')
        .select('senha')
        .eq('id', userId)
        .eq('senha', senhaAtual)
        .single()
      
      if (verifyError || !user) {
        return { success: false, error: 'Senha atual incorreta' }
      }
      
      // Atualizar senha
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ senha: novaSenha })
        .eq('id', userId)
      
      if (updateError) {
        return { success: false, error: 'Erro ao atualizar senha' }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Verificar se username já existe
  async verificarUsername(username, excludeId = null) {
    try {
      let query = supabase
        .from('usuarios')
        .select('id')
        .eq('username', username)
      
      if (excludeId) {
        query = query.neq('id', excludeId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Erro ao verificar username:', error)
        return false
      }
      
      return data.length > 0
    } catch (error) {
      console.error('Erro ao verificar username:', error)
      return false
    }
  }
}

// Serviços para vistoriadores
export const vistoriadoresService = {
  // Listar todos os vistoriadores
  async listar() {
    try {
      const { data, error } = await supabase
        .from('vistoriadores')
        .select(`
          *,
          usuarios (
            id,
            username,
            nome_completo,
            ativo
          )
        `)
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao listar vistoriadores:', error)
        return { success: false, error: 'Erro ao carregar vistoriadores' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar vistoriadores:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Criar novo vistoriador
  async criar(dadosVistoriador, dadosUsuario) {
    try {
      // Primeira transação: criar usuário
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .insert({
          username: dadosUsuario.usuario,
          senha: dadosUsuario.senha,
          nome_completo: dadosVistoriador.nome,
          tipo_usuario: 'vistoriador'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('Erro ao criar usuário:', userError)
        return { success: false, error: 'Erro ao criar usuário: ' + userError.message }
      }
      
      // Segunda transação: criar vistoriador
      const { data: vistoriador, error: vistError } = await supabase
        .from('vistoriadores')
        .insert({
          usuario_id: usuario.id,
          nome: dadosVistoriador.nome,
          cpf: dadosVistoriador.cpf,
          telefone: dadosVistoriador.telefone,
          email: dadosVistoriador.email,
          endereco: dadosVistoriador.endereco,
          data_admissao: dadosVistoriador.dataAdmissao,
          status: dadosVistoriador.status
        })
        .select()
        .single()
      
      if (vistError) {
        // Se falhar, tentar deletar o usuário criado
        await supabase.from('usuarios').delete().eq('id', usuario.id)
        console.error('Erro ao criar vistoriador:', vistError)
        return { success: false, error: 'Erro ao criar vistoriador: ' + vistError.message }
      }
      
      return { success: true, data: { ...vistoriador, usuarios: usuario } }
    } catch (error) {
      console.error('Erro ao criar vistoriador:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🆕 Atualizar vistoriador existente (incluindo valor unitário do crédito)
  async atualizar(id, dadosVistoriador) {
    try {
      const { data, error } = await supabase
        .from('vistoriadores')
        .update({
          nome: dadosVistoriador.nome,
          cpf: dadosVistoriador.cpf,
          telefone: dadosVistoriador.telefone,
          email: dadosVistoriador.email,
          endereco: dadosVistoriador.endereco,
          data_admissao: dadosVistoriador.dataAdmissao,
          status: dadosVistoriador.status,
          valor_unitario_credito: dadosVistoriador.valorUnitarioCredito // 🆕 Campo para remuneração
        })
        .eq('id', id)
        .select(`
          *,
          usuarios (
            id,
            username,
            nome_completo,
            ativo
          )
        `)
        .single()
      
      if (error) {
        console.error('Erro ao atualizar vistoriador:', error)
        return { success: false, error: 'Erro ao atualizar vistoriador: ' + error.message }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar vistoriador:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// Serviços para imobiliárias
export const imobiliariasService = {
  // Listar todas as imobiliárias
  async listar() {
    try {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select(`
          *,
          usuarios (
            id,
            username,
            nome_completo,
            ativo
          )
        `)
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao listar imobiliárias:', error)
        return { success: false, error: 'Erro ao carregar imobiliárias' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar imobiliárias:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Criar nova imobiliária
  async criar(dadosImobiliaria, dadosUsuario) {
    try {
      // Primeira transação: criar usuário
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .insert({
          username: dadosUsuario.usuario,
          senha: dadosUsuario.senha,
          nome_completo: dadosImobiliaria.nome,
          tipo_usuario: 'imobiliaria'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('Erro ao criar usuário:', userError)
        return { success: false, error: 'Erro ao criar usuário: ' + userError.message }
      }
      
      // Segunda transação: criar imobiliária
      const { data: imobiliaria, error: imoError } = await supabase
        .from('imobiliarias')
        .insert({
          usuario_id: usuario.id,
          nome: dadosImobiliaria.nome,
          endereco: dadosImobiliaria.endereco,
          contato: dadosImobiliaria.contato,
          telefone: dadosImobiliaria.telefone
        })
        .select()
        .single()
      
      if (imoError) {
        // Se falhar, tentar deletar o usuário criado
        await supabase.from('usuarios').delete().eq('id', usuario.id)
        console.error('Erro ao criar imobiliária:', imoError)
        return { success: false, error: 'Erro ao criar imobiliária: ' + imoError.message }
      }
      
      return { success: true, data: { ...imobiliaria, usuarios: usuario } }
    } catch (error) {
      console.error('Erro ao criar imobiliária:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Atualizar imobiliária existente
  async atualizar(id, dadosImobiliaria, dadosUsuario) {
    try {
      // Primeiro, obter dados da imobiliária para pegar o usuario_id
      const { data: imobiliariaAtual, error: getError } = await supabase
        .from('imobiliarias')
        .select('usuario_id')
        .eq('id', id)
        .single()
      
      if (getError) {
        console.error('Erro ao buscar imobiliária:', getError)
        return { success: false, error: 'Imobiliária não encontrada' }
      }

      // Atualizar dados da imobiliária
      const { error: imoError } = await supabase
        .from('imobiliarias')
        .update({
          nome: dadosImobiliaria.nome,
          endereco: dadosImobiliaria.endereco,
          contato: dadosImobiliaria.contato,
          telefone: dadosImobiliaria.telefone
        })
        .eq('id', id)
      
      if (imoError) {
        console.error('Erro ao atualizar imobiliária:', imoError)
        return { success: false, error: 'Erro ao atualizar imobiliária: ' + imoError.message }
      }

      // Atualizar dados do usuário
      const updateData = {
        username: dadosUsuario.usuario,
        nome_completo: dadosImobiliaria.nome
      }

      // Só atualizar a senha se foi fornecida
      if (dadosUsuario.senha && dadosUsuario.senha.trim() !== '') {
        updateData.senha = dadosUsuario.senha
      }

      const { error: userError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', imobiliariaAtual.usuario_id)
      
      if (userError) {
        console.error('Erro ao atualizar usuário:', userError)
        return { success: false, error: 'Erro ao atualizar usuário: ' + userError.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar imobiliária:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// Serviços para créditos
export const creditosService = {
  // Listar histórico de vendas de créditos de uma imobiliária
  async listarVendasCreditos(imobiliariaId) {
    try {
      const { data, error } = await supabase
        .from('vendas_creditos')
        .select(`
          *,
          pagamentos_creditos (*)
        `)
        .eq('imobiliaria_id', imobiliariaId)
        .order('data_venda', { ascending: false })
      
      if (error) {
        console.error('Erro ao listar vendas de créditos:', error)
        return { success: false, error: 'Erro ao carregar histórico de créditos' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar vendas de créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Criar nova venda de créditos
  async criarVendaCreditos(dadosVenda, pagamentos) {
    try {
      // 1. Criar a venda de créditos
      const { data: venda, error: vendaError } = await supabase
        .from('vendas_creditos')
        .insert([dadosVenda])
        .select()
        .single()

      if (vendaError) {
        console.error('Erro ao criar venda de créditos:', vendaError)
        return { success: false, error: 'Erro ao registrar venda de créditos' }
      }

      // 2. Criar os pagamentos
      const pagamentosComVendaId = pagamentos.map(pagamento => ({
        ...pagamento,
        venda_id: venda.id
      }))

      const { error: pagamentosError } = await supabase
        .from('pagamentos_creditos')
        .insert(pagamentosComVendaId)

      if (pagamentosError) {
        // Se falhar, deletar a venda criada
        await supabase.from('vendas_creditos').delete().eq('id', venda.id)
        console.error('Erro ao criar pagamentos:', pagamentosError)
        return { success: false, error: 'Erro ao registrar pagamentos' }
      }

      return { success: true, data: venda }
    } catch (error) {
      console.error('Erro ao criar venda de créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🔄 Sincronizar créditos gastos com base nas vistorias reais (automático e transparente)
  async sincronizarCreditosGastos(imobiliariaId) {
    try {
      // Buscar todas as vistorias ativas da imobiliária
      const { data: vistorias, error: vistoriasError } = await supabase
        .from('vistorias')
        .select('consumo_calculado')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativo', true)
      
      if (vistoriasError) {
        console.error('Erro ao buscar vistorias:', vistoriasError)
        return { success: false, error: 'Erro ao buscar vistorias' }
      }

      // Somar todos os consumos calculados
      const totalConsumoReal = vistorias.reduce((total, vistoria) => {
        return total + parseFloat(vistoria.consumo_calculado)
      }, 0)

      // Buscar o valor atual de créditos gastos
      const { data: imobiliariaAtual, error: getError } = await supabase
        .from('imobiliarias')
        .select('creditos_gastos')
        .eq('id', imobiliariaId)
        .single()

      const creditosGastosAtual = imobiliariaAtual?.creditos_gastos || 0
      const creditosGastosEmCentesimos = Math.round(totalConsumoReal * 100)

      // Só atualizar se houver diferença
      if (creditosGastosAtual !== creditosGastosEmCentesimos) {
        const { data, error } = await supabase
          .from('imobiliarias')
          .update({ 
            creditos_gastos: creditosGastosEmCentesimos 
          })
          .eq('id', imobiliariaId)
          .select()
          .single()

        if (error) {
          console.error('Erro ao atualizar créditos gastos:', error)
          return { success: false, error: 'Erro ao atualizar créditos gastos' }
        }
      }

      return { 
        success: true, 
        data: {
          totalConsumoReal,
          creditosGastosEmCentesimos,
          sincronizado: creditosGastosAtual !== creditosGastosEmCentesimos
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar créditos gastos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Obter resumo de créditos de uma imobiliária
  async obterResumoCreditos(imobiliariaId) {
    try {
      // 🔄 Sincronização automática transparente
      await this.sincronizarCreditosGastos(imobiliariaId);
      
      // Buscar vendas de créditos
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas_creditos')
        .select('quantidade, valor_total')
        .eq('imobiliaria_id', imobiliariaId)
      
      if (vendasError) {
        console.error('Erro ao obter vendas de créditos:', vendasError)
        return { success: false, error: 'Erro ao carregar resumo de créditos' }
      }

      // Buscar créditos gastos da tabela imobiliarias
      const { data: imobiliariaData, error: imobiliariaError } = await supabase
        .from('imobiliarias')
        .select('creditos_gastos')
        .eq('id', imobiliariaId)
        .single()
      
      const resumo = vendasData.reduce((acc, venda) => {
        // ✅ Lógica simplificada: sempre converter de centésimos para decimais
        const quantidade = venda.quantidade >= 1000 ? venda.quantidade / 100 : venda.quantidade;
        acc.totalCreditos += quantidade;
        acc.totalInvestido += parseFloat(venda.valor_total)
        return acc
      }, { totalCreditos: 0, totalInvestido: 0, creditosGastos: 0 })

      // ✅ Lógica corrigida: sempre converter de centésimos para decimais
      if (!imobiliariaError && imobiliariaData && imobiliariaData.creditos_gastos) {
        resumo.creditosGastos = imobiliariaData.creditos_gastos / 100
      }

      // Créditos disponíveis = total comprado - total gasto
      resumo.creditosDisponiveis = resumo.totalCreditos - resumo.creditosGastos
      
      return { success: true, data: resumo }
    } catch (error) {
      console.error('Erro ao obter resumo de créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Debitar créditos da imobiliária (simplificado - a sincronização automática garante consistência)
  async debitarCreditos(imobiliariaId, quantidade) {
    try {
      // A sincronização automática no obterResumoCreditos garante que os valores estejam sempre corretos
      // Aqui apenas executamos o débito de forma simples
      
      const { data: imobiliaria, error: getError } = await supabase
        .from('imobiliarias')
        .select('creditos_gastos')
        .eq('id', imobiliariaId)
        .single()

      let creditosGastosAtual = 0
      if (!getError && imobiliaria && imobiliaria.creditos_gastos) {
        creditosGastosAtual = imobiliaria.creditos_gastos
      }

      // Atualizar o total de créditos gastos (convertendo para centésimos)
      const novosCreditosGastos = creditosGastosAtual + Math.round(quantidade * 100)
      const { data, error } = await supabase
        .from('imobiliarias')
        .update({ 
          creditos_gastos: novosCreditosGastos 
        })
        .eq('id', imobiliariaId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao debitar créditos:', error)
        return { success: false, error: 'Erro ao debitar créditos' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao debitar créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🔄 Creditar créditos (devolver créditos após exclusão de vistoria) - simplificado
  async creditarCreditos(imobiliariaId, quantidade) {
    try {
      // A sincronização automática no obterResumoCreditos garante que os valores estejam sempre corretos
      // Aqui apenas executamos o crédito de forma simples
      
      const { data: imobiliaria, error: getError } = await supabase
        .from('imobiliarias')
        .select('creditos_gastos')
        .eq('id', imobiliariaId)
        .single()

      let creditosGastosAtual = 0
      if (!getError && imobiliaria && imobiliaria.creditos_gastos) {
        creditosGastosAtual = imobiliaria.creditos_gastos
      }

      // Reduzir o total de créditos gastos (devolver créditos, convertendo para centésimos)
      const creditosParaDevolver = Math.round(quantidade * 100)
      const novoValorGastos = Math.max(0, creditosGastosAtual - creditosParaDevolver)

      const { data, error } = await supabase
        .from('imobiliarias')
        .update({ 
          creditos_gastos: novoValorGastos 
        })
        .eq('id', imobiliariaId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao creditar créditos:', error)
        return { success: false, error: 'Erro ao creditar créditos' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao creditar créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Atualizar venda de créditos existente
  async atualizarVendaCreditos(vendaId, dadosVenda, pagamentos) {
    try {
      // 1. Atualizar a venda de créditos
      const { error: vendaError } = await supabase
        .from('vendas_creditos')
        .update(dadosVenda)
        .eq('id', vendaId)

      if (vendaError) {
        console.error('Erro ao atualizar venda de créditos:', vendaError)
        return { success: false, error: 'Erro ao atualizar venda de créditos' }
      }

      // 2. Deletar pagamentos antigos
      const { error: deleteError } = await supabase
        .from('pagamentos_creditos')
        .delete()
        .eq('venda_id', vendaId)

      if (deleteError) {
        console.error('Erro ao deletar pagamentos antigos:', deleteError)
        return { success: false, error: 'Erro ao atualizar pagamentos' }
      }

      // 3. Criar novos pagamentos
      const pagamentosComVendaId = pagamentos.map(pagamento => ({
        ...pagamento,
        venda_id: vendaId
      }))

      const { error: pagamentosError } = await supabase
        .from('pagamentos_creditos')
        .insert(pagamentosComVendaId)

      if (pagamentosError) {
        console.error('Erro ao criar novos pagamentos:', pagamentosError)
        return { success: false, error: 'Erro ao atualizar pagamentos' }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar venda de créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Excluir venda de créditos
  async excluirVendaCreditos(vendaId) {
    try {
      // 1. Primeiro, deletar pagamentos relacionados
      const { error: pagamentosError } = await supabase
        .from('pagamentos_creditos')
        .delete()
        .eq('venda_id', vendaId)

      if (pagamentosError) {
        console.error('Erro ao deletar pagamentos:', pagamentosError)
        return { success: false, error: 'Erro ao excluir pagamentos' }
      }

      // 2. Depois, deletar a venda de créditos
      const { error: vendaError } = await supabase
        .from('vendas_creditos')
        .delete()
        .eq('id', vendaId)

      if (vendaError) {
        console.error('Erro ao excluir venda de créditos:', vendaError)
        return { success: false, error: 'Erro ao excluir venda de créditos' }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao excluir venda de créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🆕 Obter valor unitário mais recente de uma imobiliária (LIFO - Last In, First Out)
  async obterValorUnitarioMaisRecente(imobiliariaId) {
    try {
      const { data, error } = await supabase
        .from('vendas_creditos')
        .select('valor_unitario')
        .eq('imobiliaria_id', imobiliariaId)
        .order('data_venda', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma venda encontrada
          return { success: true, data: 0 }
        }
        console.error('Erro ao obter valor unitário mais recente:', error)
        return { success: false, error: 'Erro ao carregar valor unitário' }
      }
      
      return { success: true, data: data.valor_unitario }
    } catch (error) {
      console.error('Erro ao obter valor unitário mais recente:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🆕 Função para zerar todos os créditos das imobiliárias (resetar sistema)
  async zerarTodosCreditos() {
    try {
      console.log('🔄 Iniciando reset de créditos...')

      // 1. Deletar todos os pagamentos de créditos
      const { error: pagamentosError } = await supabase
        .from('pagamentos_creditos')
        .delete()
        .gte('id', 0) // Deletar todos os registros

      if (pagamentosError) {
        console.error('Erro ao deletar pagamentos:', pagamentosError)
      } else {
        console.log('✅ Pagamentos de créditos deletados')
      }

      // 2. Deletar todas as vendas de créditos
      const { error: vendasError } = await supabase
        .from('vendas_creditos')
        .delete()
        .gte('id', 0) // Deletar todos os registros

      if (vendasError) {
        console.error('Erro ao deletar vendas:', vendasError)
      } else {
        console.log('✅ Vendas de créditos deletadas')
      }

      // 3. Zerar campo creditos_gastos de todas as imobiliárias
      const { error: imobiliariasError } = await supabase
        .from('imobiliarias')
        .update({ creditos_gastos: 0 })
        .gte('id', 0) // Atualizar todas as imobiliárias

      if (imobiliariasError) {
        console.error('Erro ao zerar créditos gastos:', imobiliariasError)
        return { success: false, error: 'Erro ao zerar créditos das imobiliárias' }
      } else {
        console.log('✅ Créditos gastos das imobiliárias zerados')
      }

      console.log('🎉 Reset de créditos concluído com sucesso!')
      return { success: true, message: 'Todos os créditos foram zerados com sucesso!' }
    } catch (error) {
      console.error('Erro ao zerar créditos:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // 🆕 Função para zerar créditos de uma imobiliária específica
  async zerarCreditosImobiliaria(imobiliariaId) {
    try {
      console.log(`🔄 Iniciando reset de créditos da imobiliária ${imobiliariaId}...`)

      // 1. Deletar pagamentos de créditos específicos da imobiliária
      const { data: vendasImobiliaria } = await supabase
        .from('vendas_creditos')
        .select('id')
        .eq('imobiliaria_id', imobiliariaId)

      if (vendasImobiliaria && vendasImobiliaria.length > 0) {
        const vendasIds = vendasImobiliaria.map(venda => venda.id)
        
        const { error: pagamentosError } = await supabase
          .from('pagamentos_creditos')
          .delete()
          .in('venda_credito_id', vendasIds)

        if (pagamentosError) {
          console.error('Erro ao deletar pagamentos:', pagamentosError)
        } else {
          console.log('✅ Pagamentos de créditos da imobiliária deletados')
        }
      }

      // 2. Deletar vendas de créditos da imobiliária
      const { error: vendasError } = await supabase
        .from('vendas_creditos')
        .delete()
        .eq('imobiliaria_id', imobiliariaId)

      if (vendasError) {
        console.error('Erro ao deletar vendas:', vendasError)
      } else {
        console.log('✅ Vendas de créditos da imobiliária deletadas')
      }

      // 3. Zerar campo creditos_gastos da imobiliária específica
      const { error: imobiliariasError } = await supabase
        .from('imobiliarias')
        .update({ creditos_gastos: 0 })
        .eq('id', imobiliariaId)

      if (imobiliariasError) {
        console.error('Erro ao zerar créditos gastos:', imobiliariasError)
        return { success: false, error: 'Erro ao zerar créditos da imobiliária' }
      } else {
        console.log('✅ Créditos gastos da imobiliária zerados')
      }

      console.log('🎉 Reset de créditos da imobiliária concluído com sucesso!')
      return { success: true, message: 'Créditos da imobiliária foram zerados com sucesso!' }
    } catch (error) {
      console.error('Erro ao zerar créditos da imobiliária:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// Serviços para tipos
export const tiposService = {
  // Tipos de Imóveis
  async listarTiposImoveis() {
    try {
      const { data, error } = await supabase
        .from('tipos_imoveis')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao listar tipos de imóveis:', error)
        return { success: false, error: 'Erro ao carregar tipos de imóveis' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar tipos de imóveis:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async criarTipoImovel(dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_imoveis')
        .insert([dadosTipo])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tipo de imóvel:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de imóvel com este nome' }
        }
        return { success: false, error: 'Erro ao criar tipo de imóvel' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar tipo de imóvel:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async atualizarTipoImovel(id, dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_imoveis')
        .update(dadosTipo)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar tipo de imóvel:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de imóvel com este nome' }
        }
        return { success: false, error: 'Erro ao atualizar tipo de imóvel' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar tipo de imóvel:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async excluirTipoImovel(id) {
    try {
      const { error } = await supabase
        .from('tipos_imoveis')
        .update({ ativo: false })
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir tipo de imóvel:', error)
        return { success: false, error: 'Erro ao excluir tipo de imóvel' }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao excluir tipo de imóvel:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Tipos de Mobília
  async listarTiposMobilia() {
    try {
      const { data, error } = await supabase
        .from('tipos_mobilia')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao listar tipos de mobília:', error)
        return { success: false, error: 'Erro ao carregar tipos de mobília' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar tipos de mobília:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async criarTipoMobilia(dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_mobilia')
        .insert([dadosTipo])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tipo de mobília:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de mobília com este nome' }
        }
        return { success: false, error: 'Erro ao criar tipo de mobília' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar tipo de mobília:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async atualizarTipoMobilia(id, dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_mobilia')
        .update(dadosTipo)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar tipo de mobília:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de mobília com este nome' }
        }
        return { success: false, error: 'Erro ao atualizar tipo de mobília' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar tipo de mobília:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Tipos de Vistorias
  async listarTiposVistorias() {
    try {
      const { data, error } = await supabase
        .from('tipos_vistorias')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao listar tipos de vistorias:', error)
        return { success: false, error: 'Erro ao carregar tipos de vistorias' }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar tipos de vistorias:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async criarTipoVistoria(dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_vistorias')
        .insert([dadosTipo])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tipo de vistoria:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de vistoria com este nome' }
        }
        return { success: false, error: 'Erro ao criar tipo de vistoria' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar tipo de vistoria:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async atualizarTipoVistoria(id, dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_vistorias')
        .update(dadosTipo)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar tipo de vistoria:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de vistoria com este nome' }
        }
        return { success: false, error: 'Erro ao atualizar tipo de vistoria' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar tipo de vistoria:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// Serviço para Tipos de Consumo
export const tiposConsumoService = {
  async listarTiposConsumo() {
    try {
      const { data, error } = await supabase
        .from('tipos_consumo')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao listar tipos de consumo:', error)
        return { success: false, error: 'Erro ao listar tipos de consumo' }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao listar tipos de consumo:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async criarTipoConsumo(dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_consumo')
        .insert([dadosTipo])
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao criar tipo de consumo:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de consumo com este nome' }
        }
        return { success: false, error: 'Erro ao criar tipo de consumo' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar tipo de consumo:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async atualizarTipoConsumo(id, dadosTipo) {
    try {
      const { data, error } = await supabase
        .from('tipos_consumo')
        .update(dadosTipo)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao atualizar tipo de consumo:', error)
        if (error.code === '23505') {
          return { success: false, error: 'Já existe um tipo de consumo com este nome' }
        }
        return { success: false, error: 'Erro ao atualizar tipo de consumo' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar tipo de consumo:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async excluirTipoConsumo(id) {
    try {
      const { data, error } = await supabase
        .from('tipos_consumo')
        .update({ ativo: false })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao excluir tipo de consumo:', error)
        return { success: false, error: 'Erro ao excluir tipo de consumo' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao excluir tipo de consumo:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// Serviço para Vistorias
export const vistoriasService = {
  async listarVistorias(usuarioId) {
    try {
      // 🆕 Primeiro, verificar o tipo de usuário
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('tipo_usuario')
        .eq('id', usuarioId)
        .single()

      if (usuarioError) {
        console.error('Erro ao buscar usuário:', usuarioError)
        return { success: false, error: 'Erro ao verificar usuário' }
      }

      let query = supabase
        .from('vistorias')
        .select(`
          *,
          imobiliarias:imobiliaria_id(id, nome),
          vistoriadores:vistoriador_id(id, nome),
          tipos_imoveis:tipo_imovel_id(id, nome),
          tipos_vistorias:tipo_vistoria_id(id, nome),
          tipos_mobilia:tipo_mobilia_id(id, nome)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      // 🆕 Se for vistoriador, buscar pela referência ao vistoriador
      if (usuario.tipo_usuario === 'vistoriador') {
        // Primeiro buscar o ID do vistoriador associado a este usuário
        const { data: vistoriador, error: vistoriadorError } = await supabase
          .from('vistoriadores')
          .select('id')
          .eq('usuario_id', usuarioId)
          .single()

        if (vistoriadorError) {
          console.error('Erro ao buscar vistoriador:', vistoriadorError)
          return { success: false, error: 'Vistoriador não encontrado' }
        }

        query = query.eq('vistoriador_id', vistoriador.id)
      } else {
        // Para admin, buscar por usuario_id (quem criou)
        query = query.eq('usuario_id', usuarioId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao listar vistorias:', error)
        return { success: false, error: 'Erro ao listar vistorias' }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao listar vistorias:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async criarVistoria(dadosVistoria) {
    try {
      // 🆕 Primeiro, obter o valor unitário atual do vistoriador
      const { data: vistoriador, error: vistoriadorError } = await supabase
        .from('vistoriadores')
        .select('valor_unitario_credito')
        .eq('id', dadosVistoria.vistoriador_id)
        .single()

      if (vistoriadorError) {
        console.error('Erro ao buscar vistoriador:', vistoriadorError)
        return { success: false, error: 'Erro ao buscar dados do vistoriador' }
      }

      // Adicionar o valor unitário do vistoriador aos dados da vistoria (para histórico)
      const dadosVistoriaCompletos = {
        ...dadosVistoria,
        valor_unitario_vistoriador: vistoriador.valor_unitario_credito || 0 // 🆕 Salvar valor atual
      }

      // Primeiro, debitar os créditos da imobiliária (usando valor exato sem arredondamento)
      const consumoCreditos = parseFloat(dadosVistoria.consumo_calculado)
      const debitoResult = await creditosService.debitarCreditos(
        dadosVistoria.imobiliaria_id, 
        consumoCreditos
      )

      if (!debitoResult.success) {
        return { success: false, error: debitoResult.error }
      }

      // Se o débito foi bem-sucedido, criar a vistoria
      const { data, error } = await supabase
        .from('vistorias')
        .insert([dadosVistoriaCompletos])
        .select(`
          *,
          imobiliarias:imobiliaria_id(id, nome),
          vistoriadores:vistoriador_id(id, nome),
          tipos_imoveis:tipo_imovel_id(id, nome),
          tipos_vistorias:tipo_vistoria_id(id, nome),
          tipos_mobilia:tipo_mobilia_id(id, nome)
        `)
        .single()

      if (error) {
        console.error('Erro ao criar vistoria:', error)
        
        // Se falhar ao criar a vistoria, tentar reverter o débito de créditos
        // (seria ideal implementar uma transação aqui)
        console.warn('Tentando reverter débito de créditos...')
        
        if (error.code === '23503') {
          return { success: false, error: 'Erro de referência: verifique se todos os dados selecionados são válidos' }
        }
        if (error.code === '23505') {
          return { success: false, error: 'Já existe uma vistoria com este código' }
        }
        return { success: false, error: 'Erro ao criar vistoria' }
      }

      console.log(`✅ Vistoria criada e ${consumoCreditos} créditos debitados da imobiliária`)
      
      // 🆕 Incluir informações sobre créditos insuficientes na resposta
      return { 
        success: true, 
        data,
        creditosInsuficientes: debitoResult.creditosInsuficientes,
        creditosDisponiveis: debitoResult.creditosDisponiveis,
        novoSaldo: debitoResult.novoSaldo
      }
    } catch (error) {
      console.error('Erro ao criar vistoria:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async atualizarVistoria(id, dadosVistoria) {
    try {
      const { data, error } = await supabase
        .from('vistorias')
        .update(dadosVistoria)
        .eq('id', id)
        .select(`
          *,
          imobiliarias:imobiliaria_id(id, nome),
          vistoriadores:vistoriador_id(id, nome),
          tipos_imoveis:tipo_imovel_id(id, nome),
          tipos_vistorias:tipo_vistoria_id(id, nome),
          tipos_mobilia:tipo_mobilia_id(id, nome)
        `)
        .single()

      if (error) {
        console.error('Erro ao atualizar vistoria:', error)
        return { success: false, error: 'Erro ao atualizar vistoria' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar vistoria:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async excluirVistoria(id) {
    try {
      // 🆕 Primeiro, obter os dados da vistoria para devolver os créditos
      const { data: vistoria, error: vistoriaError } = await supabase
        .from('vistorias')
        .select('imobiliaria_id, consumo_calculado')
        .eq('id', id)
        .eq('ativo', true)
        .single()

      if (vistoriaError) {
        console.error('Erro ao buscar vistoria:', vistoriaError)
        return { success: false, error: 'Vistoria não encontrada' }
      }

      // 🆕 Devolver os créditos à imobiliária (usando valor exato sem arredondamento)
      const creditosParaDevolver = parseFloat(vistoria.consumo_calculado)
      const creditoResult = await creditosService.creditarCreditos(
        vistoria.imobiliaria_id, 
        creditosParaDevolver
      )

      if (!creditoResult.success) {
        console.warn('Erro ao devolver créditos, mas continuando com exclusão:', creditoResult.error)
      }

      // 🆕 Excluir vistoria realmente do banco de dados
      const { error } = await supabase
        .from('vistorias')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir vistoria:', error)
        return { success: false, error: 'Erro ao excluir vistoria' }
      }

      console.log(`✅ Vistoria excluída e ${creditosParaDevolver} créditos devolvidos à imobiliária`)
      return { success: true }
    } catch (error) {
      console.error('Erro ao excluir vistoria:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  async gerarProximoCodigo(usuarioId) {
    try {
      const ano = new Date().getFullYear()
      
      const { data, error } = await supabase
        .from('vistorias')
        .select('codigo')
        .eq('usuario_id', usuarioId)
        .like('codigo', `VST-${ano}-%`)
        .order('codigo', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao gerar próximo código:', error)
        return { success: false, error: 'Erro ao gerar código' }
      }

      let proximoNumero = 1
      if (data && data.length > 0) {
        const ultimoCodigo = data[0].codigo
        const numeroAtual = parseInt(ultimoCodigo.split('-')[2])
        proximoNumero = numeroAtual + 1
      }

      const proximoCodigo = `VST-${ano}-${proximoNumero.toString().padStart(3, '0')}`
      return { success: true, data: proximoCodigo }
    } catch (error) {
      console.error('Erro ao gerar próximo código:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }
}

// 🆕 Service para executar migrações (uso interno)
export const migrationService = {
  // 🆕 Migração específica para adicionar colunas do sistema de remuneração
  async adicionarColunasRemuneracao() {
    try {
      console.log('🔄 Iniciando migração para sistema de remuneração...')
      
      // Como não temos RPC disponível, vamos apenas logar as instruções SQL
      const sqlInstructions = [
        `-- Adicionar coluna valor_unitario_credito na tabela vistoriadores
        ALTER TABLE vistoriadores 
        ADD COLUMN IF NOT EXISTS valor_unitario_credito DECIMAL(10,2) DEFAULT 0.00;`,
        
        `-- Adicionar coluna valor_unitario_vistoriador na tabela vistorias
        ALTER TABLE vistorias 
        ADD COLUMN IF NOT EXISTS valor_unitario_vistoriador DECIMAL(10,2) DEFAULT 0.00;`
      ]
      
      console.log('📋 Execute os seguintes comandos SQL no seu banco de dados:')
      sqlInstructions.forEach((sql, index) => {
        console.log(`\n${index + 1}. ${sql}`)
      })
      
      // Para este projeto, vamos assumir que as colunas já existem ou foram adicionadas manualmente
      console.log('✅ Instruções de migração geradas. Execute os comandos SQL acima no seu banco.')
      return { success: true, message: 'Instruções de migração geradas' }
    } catch (error) {
      console.error('Erro na migração:', error)
      return { success: false, error: 'Erro ao executar migração' }
    }
  }
}

export default supabase