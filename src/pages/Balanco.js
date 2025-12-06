import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, InputGroup, Alert, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faEdit, faPlus, faSave, faTimes, faPercent, faCalculator } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { supabase, creditosService } from '../lib/supabase';

const Balanco = ({ deslogar, usuarioLogado }) => {
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  
  // Estados das tabelas
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [dadosEngenheiro, setDadosEngenheiro] = useState([]);
  const [resumoDizimos, setResumoDizimos] = useState([]);
  
  // Estados dos modais
  const [showModalPercentual, setShowModalPercentual] = useState(false);
  const [modalData, setModalData] = useState({ tipo: '', mes: '', valor: '', percentual: '' });
  const [showModalEngenheiro, setShowModalEngenheiro] = useState(false);
  const [engenheiroData, setEngenheiroData] = useState({ mes: '', contrato: '', extra: '' });
  
  // Estados de controle
  const [editandoPercentual, setEditandoPercentual] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  // Carregar dados na inicialização
  useEffect(() => {
    carregarDados();
  }, [anoSelecionado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarDadosEvolucao(),
        carregarDadosEngenheiro(),
        carregarPercentuais()
      ]);
      calcularResumoDizimos();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };



  // Função auxiliar para calcular valor total das vistorias (copiada exata da tela imobiliárias)
  const calcularValorTotalVistorias = async (vistoriasData, imobiliariaId) => {
    try {
      let total = 0;
      
      // Calcular valor para cada vistoria
      for (const vistoria of vistoriasData) {
        let valorBase = 0;
        
        // Se a vistoria tem valor_monetario salvo, usar esse valor
        if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
          valorBase = parseFloat(vistoria.valor_monetario);
        } else {
          // Para vistorias antigas sem valor_monetario, calcular baseado no valor unitário mais recente
          const result = await creditosService.obterValorUnitarioMaisRecente(imobiliariaId);
          if (result.success) {
            const valorUnitario = result.data;
            const consumo = parseFloat(vistoria.consumo_calculado) || 0;
            valorBase = valorUnitario * consumo;
          }
        }
        
        // Aplicar desconto e adicionar ao total
        const desconto = parseFloat(vistoria.desconto) || 0;
        const valorFinal = Math.max(0, valorBase - desconto);
        total += valorFinal;
      }
      
      return total;
    } catch (error) {
      console.error('Erro ao calcular valor total das vistorias:', error);
      return 0;
    }
  };

  // Função para obter vistorias por período (copiada exata da tela imobiliárias)
  const obterVistoriasPorPeriodo = async (imobiliariaId, mes, ano) => {
    try {
      const query = supabase
        .from('vistorias')
        .select('*')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativo', true);

      // Aplicar filtros de período se especificados
      if (ano) {
        const startDate = `${ano}-01-01`;
        const endDate = `${ano}-12-31`;
        query.gte('data_vistoria', startDate).lte('data_vistoria', endDate);
      }

      if (mes && ano) {
        const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(ano), parseInt(mes), 0).toISOString().split('T')[0];
        query.gte('data_vistoria', startDate).lte('data_vistoria', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar vistorias:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao obter vistorias por período:', error);
      return [];
    }
  };

  // Função auxiliar para obter dados de uma imobiliária específica (copiada exata da tela imobiliárias)
  const obterDadosConsumoImobiliaria = async (imobiliariaId, mes, ano) => {
    try {
      // Obter resumo de créditos
      const resumoResult = await creditosService.obterResumoCreditos(imobiliariaId);
      const resumo = resumoResult.success ? resumoResult.data : {
        creditosDisponiveis: 0,
        creditosGastos: 0,
        totalCreditos: 0,
        totalInvestido: 0
      };

      // Obter dados das vistorias (com filtro de período se especificado)
      const vistoriasData = await obterVistoriasPorPeriodo(imobiliariaId, mes, ano);

      // Calcular métricas
      const quantidadeVistorias = vistoriasData.length;
      const consumoTotal = vistoriasData.reduce((sum, v) => sum + parseFloat(v.consumo_calculado || 0), 0);
      const areaTotal = vistoriasData.reduce((sum, v) => sum + parseFloat(v.area_imovel || 0), 0);
      
      // Calcular valor total das vistorias (o que é cobrado dos clientes)
      const valorTotalVistorias = await calcularValorTotalVistorias(vistoriasData, imobiliariaId);
      
      // Calcular custo de remuneração (o que é pago aos vistoriadores)
      const custoRemuneracao = vistoriasData.reduce((sum, v) => {
        const consumo = parseFloat(v.consumo_calculado || 0);
        const valorUnitario = parseFloat(v.valor_unitario_vistoriador || 0);
        return sum + (consumo * valorUnitario);
      }, 0);

      const creditoAtual = resumo.creditosDisponiveis;
      const creditoAdquirido = resumo.totalCreditos;
      const valorInvestido = resumo.totalInvestido;
      // CORREÇÃO: Valor Líquido = Valor das Vistorias - Remuneração dos Vistoriadores
      const valorLiquido = valorTotalVistorias - custoRemuneracao;
      const percentualCredito = creditoAdquirido > 0 ? (creditoAtual / creditoAdquirido) * 100 : 0;

      return {
        consumo: consumoTotal,
        creditoAtual,
        quantidadeVistorias,
        percentualCredito,
        areaM2: areaTotal,
        creditoAdquirido,
        valorInvestido,
        valorTotalVistorias,
        valorLiquido
      };
    } catch (error) {
      console.error('Erro ao obter dados da imobiliária:', error);
      return {
        consumo: 0,
        creditoAtual: 0,
        quantidadeVistorias: 0,
        percentualCredito: 0,
        areaM2: 0,
        creditoAdquirido: 0,
        valorInvestido: 0,
        valorTotalVistorias: 0,
        valorLiquido: 0
      };
    }
  };

  // Carregar dados da evolução (primeira tabela) - usando EXATAMENTE a mesma lógica da tela imobiliárias
  const carregarDadosEvolucao = async () => {
    try {
      console.log('🔄 Carregando dados de evolução para ano:', anoSelecionado);
      
      // Obter todas as imobiliárias (igual na tela de imobiliárias)
      const { data: imobiliariasData, error: imobiliariasError } = await supabase
        .from('imobiliarias')
        .select('id');
      
      if (imobiliariasError) throw imobiliariasError;

      console.log(`✅ Encontradas ${imobiliariasData?.length || 0} imobiliárias`);

      // Processar dados por mês (usando a MESMA lógica da tela de imobiliárias)
      const dadosPorMes = {};
      meses.forEach((mes, index) => {
        dadosPorMes[index + 1] = 0;
      });

      // Para cada mês, calcular o valor líquido total
      for (let mesIndex = 0; mesIndex < 12; mesIndex++) {
        const mesNumero = mesIndex + 1;
        const mesString = mesNumero.toString().padStart(2, '0');
        
        console.log(`🔍 Processando mês ${mesNumero} (${meses[mesIndex]})`);
        
        // Para cada imobiliária, obter dados de consumo do mês
        for (const imobiliaria of imobiliariasData || []) {
          try {
            // Usar a MESMA função que a tela de imobiliárias usa
            const consumoData = await obterDadosConsumoImobiliaria(imobiliaria.id, mesString, anoSelecionado.toString());
            dadosPorMes[mesNumero] += consumoData.valorLiquido || 0;
            
            if (consumoData.valorLiquido > 0) {
              console.log(`  💰 Imobiliária ${imobiliaria.id}: R$ ${consumoData.valorLiquido.toFixed(2)}`);
            }
          } catch (error) {
            console.error(`Erro ao processar imobiliária ${imobiliaria.id} no mês ${mesNumero}:`, error);
            // Continuar processamento mesmo com erro
          }
        }
        
        console.log(`✅ Total do mês ${mesNumero}: R$ ${dadosPorMes[mesNumero].toFixed(2)}`);
      }

      console.log('💰 Valores líquidos por mês (final):', dadosPorMes);

      // Buscar percentuais personalizados salvos para este ano
      const { data: percentuaisPersonalizados } = await supabase
        .from('balanco_percentuais')
        .select('mes_numero, percentual')
        .eq('ano', anoSelecionado)
        .eq('tipo', 'evolucao_dizimo');

      // Criar estrutura final
      const evolucaoMensal = meses.map((mes, index) => {
        const mesNumero = index + 1;
        const valorLiquido = dadosPorMes[mesNumero] || 0;
        
        // Verificar se há percentual personalizado para este mês
        const percentualPersonalizado = percentuaisPersonalizados?.find(p => p.mes_numero === mesNumero);
        const percentualDizimo = percentualPersonalizado?.percentual || 10; // Padrão 10%
        
        return {
          mes,
          liquido: valorLiquido,
          percentualDizimo: percentualDizimo,
          dizimo: valorLiquido * (percentualDizimo / 100)
        };
      });

      console.log('✅ Dados de evolução carregados com sucesso');
      setDadosEvolucao(evolucaoMensal);
    } catch (error) {
      console.error('❌ Erro ao carregar dados de evolução:', error);
      
      // Em caso de erro, criar estrutura vazia
      const evolucaoVazia = meses.map(mes => ({
        mes,
        liquido: 0,
        percentualDizimo: 10,
        dizimo: 0
      }));
      
      setDadosEvolucao(evolucaoVazia);
    }
  };

  // Carregar dados do engenheiro (segunda tabela)
  const carregarDadosEngenheiro = async () => {
    try {
      // Buscar ou criar dados do engenheiro para o ano
      const { data, error } = await supabase
        .from('balanco_engenheiro')
        .select('*')
        .eq('ano', anoSelecionado)
        .order('mes_numero');

      if (error && error.code !== 'PGRST116') throw error;

      // Se não existir dados, criar estrutura inicial
      if (!data || data.length === 0) {
        const dadosIniciais = meses.map((mes, index) => ({
          mes,
          mes_numero: index + 1,
          contrato: 0,
          percentualDesconto: 55, // Padrão 55%
          desconto: 0,
          extra: 0,
          salario: 0,
          percentualDizimo: 10, // Padrão 10%
          dizimo: 0
        }));
        setDadosEngenheiro(dadosIniciais);
      } else {
        setDadosEngenheiro(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do engenheiro:', error);
    }
  };

  // Carregar percentuais personalizados
  const carregarPercentuais = async () => {
    try {
      const { data, error } = await supabase
        .from('balanco_percentuais')
        .select('*')
        .eq('ano', anoSelecionado);

      if (error && error.code !== 'PGRST116') throw error;

      // Aplicar percentuais personalizados se existirem
      if (data && data.length > 0) {
        // Implementar lógica para aplicar percentuais personalizados
      }
    } catch (error) {
      console.error('Erro ao carregar percentuais:', error);
    }
  };

  // Calcular resumo dos dízimos (terceira tabela)
  const calcularResumoDizimos = () => {
    const resumo = meses.map(mes => {
      const evolucaoMes = dadosEvolucao.find(e => e.mes === mes);
      const engenheiroMes = dadosEngenheiro.find(e => e.mes === mes);
      
      const dizimoEvolucao = evolucaoMes?.dizimo || 0;
      const dizimoEngenheiro = engenheiroMes?.dizimo || 0;
      const total = dizimoEvolucao + dizimoEngenheiro;
      
      return {
        mes,
        dizimoEvolucao,
        dizimoEngenheiro,
        total
      };
    });
    
    setResumoDizimos(resumo);
  };

  // Recalcular após mudanças
  useEffect(() => {
    calcularResumoDizimos();
  }, [dadosEvolucao, dadosEngenheiro]);

  // Função para editar percentual
  const editarPercentual = (tipo, mes, valorAtual, percentualAtual) => {
    setModalData({
      tipo,
      mes,
      valor: valorAtual.toString(),
      percentual: percentualAtual.toString()
    });
    setShowModalPercentual(true);
  };

  // Salvar percentual editado
  const salvarPercentual = async () => {
    setSalvando(true);
    try {
      const novoPercentual = parseFloat(modalData.percentual);
      const valor = parseFloat(modalData.valor);
      const mesNumero = meses.indexOf(modalData.mes) + 1;
      
      if (modalData.tipo === 'evolucao') {
        // Salvar percentual personalizado no banco
        const { error: saveError } = await supabase
          .from('balanco_percentuais')
          .upsert({
            ano: anoSelecionado,
            mes: modalData.mes,
            mes_numero: mesNumero,
            tipo: 'evolucao_dizimo',
            percentual: novoPercentual,
            valor_base: valor,
            valor_calculado: valor * (novoPercentual / 100)
          }, {
            onConflict: 'ano,mes_numero,tipo'
          });

        if (saveError) throw saveError;

        // Atualizar estado local
        const novosDados = dadosEvolucao.map(item => 
          item.mes === modalData.mes 
            ? { ...item, percentualDizimo: novoPercentual, dizimo: valor * (novoPercentual / 100) }
            : item
        );
        setDadosEvolucao(novosDados);
        
      } else if (modalData.tipo === 'engenheiro_desconto') {
        // Salvar percentual de desconto do engenheiro
        const { error: saveError } = await supabase
          .from('balanco_percentuais')
          .upsert({
            ano: anoSelecionado,
            mes: modalData.mes,
            mes_numero: mesNumero,
            tipo: 'engenheiro_desconto',
            percentual: novoPercentual,
            valor_base: valor,
            valor_calculado: valor * (novoPercentual / 100)
          }, {
            onConflict: 'ano,mes_numero,tipo'
          });

        if (saveError) throw saveError;

        // Atualizar dados do engenheiro
        const novosDados = dadosEngenheiro.map(item => 
          item.mes === modalData.mes 
            ? { 
                ...item, 
                percentualDesconto: novoPercentual, 
                desconto: item.contrato * (novoPercentual / 100),
                salario: item.contrato - (item.contrato * (novoPercentual / 100)) + item.extra
              }
            : item
        );
        
        // Recalcular dízimo baseado no novo salário
        const dadosComDizimo = novosDados.map(item => {
          if (item.mes === modalData.mes) {
            return {
              ...item,
              dizimo: item.salario * (item.percentualDizimo / 100)
            };
          }
          return item;
        });
        
        setDadosEngenheiro(dadosComDizimo);
        
      } else if (modalData.tipo === 'engenheiro_dizimo') {
        // Salvar percentual de dízimo do engenheiro
        const { error: saveError } = await supabase
          .from('balanco_percentuais')
          .upsert({
            ano: anoSelecionado,
            mes: modalData.mes,
            mes_numero: mesNumero,
            tipo: 'engenheiro_dizimo',
            percentual: novoPercentual,
            valor_base: valor,
            valor_calculado: valor * (novoPercentual / 100)
          }, {
            onConflict: 'ano,mes_numero,tipo'
          });

        if (saveError) throw saveError;

        const novosDados = dadosEngenheiro.map(item => 
          item.mes === modalData.mes 
            ? { ...item, percentualDizimo: novoPercentual, dizimo: item.salario * (novoPercentual / 100) }
            : item
        );
        setDadosEngenheiro(novosDados);
      }
      
      setShowModalPercentual(false);
    } catch (error) {
      console.error('Erro ao salvar percentual:', error);
      alert('Erro ao salvar percentual. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Editar dados do engenheiro
  const editarEngenheiro = (mes) => {
    const dadosMes = dadosEngenheiro.find(d => d.mes === mes);
    setEngenheiroData({
      mes,
      contrato: dadosMes?.contrato?.toString() || '0',
      extra: dadosMes?.extra?.toString() || '0'
    });
    setShowModalEngenheiro(true);
  };

  // Salvar dados do engenheiro
  const salvarEngenheiro = () => {
    const contrato = parseFloat(engenheiroData.contrato) || 0;
    const extra = parseFloat(engenheiroData.extra) || 0;
    
    const novosDados = dadosEngenheiro.map(item => {
      if (item.mes === engenheiroData.mes) {
        const desconto = contrato * (item.percentualDesconto / 100);
        const salario = contrato - desconto + extra;
        const dizimo = salario * (item.percentualDizimo / 100);
        
        return {
          ...item,
          contrato,
          desconto,
          extra,
          salario,
          dizimo
        };
      }
      return item;
    });
    
    setDadosEngenheiro(novosDados);
    setShowModalEngenheiro(false);
  };

  if (loading) {
    return (
      <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando dados do balanço...</p>
            </div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-0">
                      <FontAwesomeIcon icon={faChartLine} className="me-2" />
                      Balanço Financeiro
                    </h4>
                    <small>Controle de receitas, despesas e dízimos</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <Form.Label className="text-white mb-0 me-2">Ano:</Form.Label>
                    <Form.Select
                      value={anoSelecionado}
                      onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                      style={{ width: '100px' }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </Card.Header>
            </Card>
          </Col>
        </Row>

        {/* Primeira Tabela - Evolução Vistorias */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Evolução Vistorias</h5>
                <small>Valores líquidos das imobiliárias</small>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Mês</th>
                        <th>Líquido (R$)</th>
                        <th>Dízimo %</th>
                        <th>Dízimo (R$)</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosEvolucao.map((item, index) => (
                        <tr key={index}>
                          <td className="text-capitalize">{item.mes}</td>
                          <td>R$ {item.liquido.toFixed(2)}</td>
                          <td>
                            <Badge bg="info">{item.percentualDizimo}%</Badge>
                          </td>
                          <td>R$ {item.dizimo.toFixed(2)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => editarPercentual('evolucao', item.mes, item.liquido, item.percentualDizimo)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Segunda Tabela - Engenheiro */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">Engenheiro</h5>
                <small>Contratos e remuneração</small>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Mês</th>
                        <th>Contrato (R$)</th>
                        <th>Desconto %</th>
                        <th>Desconto (R$)</th>
                        <th>Extra (R$)</th>
                        <th>Salário (R$)</th>
                        <th>Dízimo %</th>
                        <th>Dízimo (R$)</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosEngenheiro.map((item, index) => (
                        <tr key={index}>
                          <td className="text-capitalize">{item.mes}</td>
                          <td>R$ {item.contrato.toFixed(2)}</td>
                          <td>
                            <Badge bg="warning">{item.percentualDesconto}%</Badge>
                          </td>
                          <td>R$ {item.desconto.toFixed(2)}</td>
                          <td>R$ {item.extra.toFixed(2)}</td>
                          <td>R$ {item.salario.toFixed(2)}</td>
                          <td>
                            <Badge bg="info">{item.percentualDizimo}%</Badge>
                          </td>
                          <td>R$ {item.dizimo.toFixed(2)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => editarEngenheiro(item.mes)}
                                title="Editar valores"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => editarPercentual('engenheiro_desconto', item.mes, item.contrato, item.percentualDesconto)}
                                title="Editar % desconto"
                              >
                                <FontAwesomeIcon icon={faPercent} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Terceira Tabela - Resumo Dízimos */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Resumo - Dízimos</h5>
                <small>Consolidação dos dízimos das duas tabelas anteriores</small>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Mês</th>
                        <th>Dízimo Evolução (R$)</th>
                        <th>Dízimo Engenheiro (R$)</th>
                        <th>Total Dízimo (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumoDizimos.map((item, index) => (
                        <tr key={index}>
                          <td className="text-capitalize">{item.mes}</td>
                          <td>R$ {item.dizimoEvolucao.toFixed(2)}</td>
                          <td>R$ {item.dizimoEngenheiro.toFixed(2)}</td>
                          <td className="table-success">
                            <strong>R$ {item.total.toFixed(2)}</strong>
                          </td>
                        </tr>
                      ))}
                      <tr className="table-primary">
                        <td><strong>TOTAL ANUAL</strong></td>
                        <td><strong>R$ {resumoDizimos.reduce((acc, item) => acc + item.dizimoEvolucao, 0).toFixed(2)}</strong></td>
                        <td><strong>R$ {resumoDizimos.reduce((acc, item) => acc + item.dizimoEngenheiro, 0).toFixed(2)}</strong></td>
                        <td><strong>R$ {resumoDizimos.reduce((acc, item) => acc + item.total, 0).toFixed(2)}</strong></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal para editar percentual */}
      <Modal show={showModalPercentual} onHide={() => setShowModalPercentual(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faPercent} className="me-2" />
            Editar Percentual - {modalData.mes}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Valor Base</Form.Label>
              <InputGroup>
                <InputGroup.Text>R$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={modalData.valor}
                  onChange={(e) => setModalData({...modalData, valor: e.target.value})}
                  readOnly
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Percentual</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  step="0.1"
                  value={modalData.percentual}
                  onChange={(e) => setModalData({...modalData, percentual: e.target.value})}
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Alert variant="info">
              <small>
                Novo valor calculado: R$ {((parseFloat(modalData.valor) || 0) * (parseFloat(modalData.percentual) || 0) / 100).toFixed(2)}
              </small>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalPercentual(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarPercentual} disabled={salvando}>
            {salvando ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Salvar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar dados do engenheiro */}
      <Modal show={showModalEngenheiro} onHide={() => setShowModalEngenheiro(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Dados - {engenheiroData.mes}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Valor do Contrato</Form.Label>
              <InputGroup>
                <InputGroup.Text>R$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={engenheiroData.contrato}
                  onChange={(e) => setEngenheiroData({...engenheiroData, contrato: e.target.value})}
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Valor Extra</Form.Label>
              <InputGroup>
                <InputGroup.Text>R$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={engenheiroData.extra}
                  onChange={(e) => setEngenheiroData({...engenheiroData, extra: e.target.value})}
                />
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalEngenheiro(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarEngenheiro}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default Balanco;
