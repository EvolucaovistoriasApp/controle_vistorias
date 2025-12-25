import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faCheckCircle, faExclamationTriangle, faCalculator } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { supabase, creditosService } from '../lib/supabase';

const ProcessamentoBalanco = ({ deslogar, usuarioLogado }) => {
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  // Função auxiliar para calcular valor total das vistorias
  const calcularValorTotalVistorias = async (vistoriasData, imobiliariaId) => {
    try {
      let total = 0;
      
      for (const vistoria of vistoriasData) {
        let valorBase = 0;
        
        if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
          valorBase = parseFloat(vistoria.valor_monetario);
        } else {
          const result = await creditosService.obterValorUnitarioMaisRecente(imobiliariaId);
          if (result.success) {
            const valorUnitario = result.data;
            const consumo = parseFloat(vistoria.consumo_calculado) || 0;
            valorBase = valorUnitario * consumo;
          }
        }
        
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

  // Função para obter vistorias por período
  const obterVistoriasPorPeriodo = async (imobiliariaId, mes, ano) => {
    try {
      const query = supabase
        .from('vistorias')
        .select('*')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativo', true);

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

  // Função para obter dados de uma imobiliária específica
  const obterDadosConsumoImobiliaria = async (imobiliariaId, mes, ano) => {
    try {
      const resumoResult = await creditosService.obterResumoCreditos(imobiliariaId);
      const resumo = resumoResult.success ? resumoResult.data : {
        creditosDisponiveis: 0,
        creditosGastos: 0,
        totalCreditos: 0,
        totalInvestido: 0
      };

      const vistoriasData = await obterVistoriasPorPeriodo(imobiliariaId, mes, ano);
      const valorTotalVistorias = await calcularValorTotalVistorias(vistoriasData, imobiliariaId);
      
      const custoRemuneracao = vistoriasData.reduce((sum, v) => {
        const consumo = parseFloat(v.consumo_calculado || 0);
        const valorUnitario = parseFloat(v.valor_unitario_vistoriador || 0);
        return sum + (consumo * valorUnitario);
      }, 0);

      const valorLiquido = valorTotalVistorias - custoRemuneracao;

      return { valorLiquido };
    } catch (error) {
      console.error('Erro ao obter dados da imobiliária:', error);
      return { valorLiquido: 0 };
    }
  };

  // Função principal de processamento
  const processarBalanco = async () => {
    setProcessando(true);
    setProgresso(0);
    setMensagem('');
    setErro('');
    setSucesso(false);

    try {
      setMensagem('🔄 Iniciando processamento...');
      
      // Obter todas as imobiliárias
      const { data: imobiliariasData, error: imobiliariasError } = await supabase
        .from('imobiliarias')
        .select('id');
      
      if (imobiliariasError) throw imobiliariasError;

      const totalImobiliarias = imobiliariasData?.length || 0;
      const totalMeses = 12;
      const totalOperacoes = totalMeses * totalImobiliarias;
      let operacoesConcluidas = 0;

      setMensagem(`📊 Processando ${totalMeses} meses para ${totalImobiliarias} imobiliárias...`);

      // Processar cada mês
      for (let mesIndex = 0; mesIndex < 12; mesIndex++) {
        const mesNumero = mesIndex + 1;
        const mesString = mesNumero.toString().padStart(2, '0');
        
        setMensagem(`📅 Processando mês ${mesNumero} (${meses[mesIndex]})...`);
        
        let valorLiquidoTotal = 0;

        // Processar cada imobiliária
        for (const imobiliaria of imobiliariasData || []) {
          try {
            const consumoData = await obterDadosConsumoImobiliaria(
              imobiliaria.id, 
              mesString, 
              anoSelecionado.toString()
            );
            valorLiquidoTotal += consumoData.valorLiquido || 0;
            
            operacoesConcluidas++;
            const novoProgresso = Math.round((operacoesConcluidas / totalOperacoes) * 100);
            setProgresso(novoProgresso);
          } catch (error) {
            console.error(`Erro ao processar imobiliária ${imobiliaria.id} no mês ${mesNumero}:`, error);
          }
        }

        // Salvar no cache
        const { error: upsertError } = await supabase
          .from('balanco_evolucao_cache')
          .upsert({
            ano: anoSelecionado,
            mes_numero: mesNumero,
            valor_liquido: valorLiquidoTotal,
            data_calculo: new Date().toISOString()
          }, {
            onConflict: 'ano,mes_numero'
          });

        if (upsertError) {
          console.error(`Erro ao salvar cache do mês ${mesNumero}:`, upsertError);
        }
      }

      setMensagem('✅ Processamento concluído com sucesso!');
      setSucesso(true);
      setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        setMensagem('');
      }, 5000);

    } catch (error) {
      console.error('Erro ao processar balanço:', error);
      setErro(`Erro ao processar balanço: ${error.message}`);
      setMensagem('');
    } finally {
      setProcessando(false);
      setProgresso(100);
    }
  };

  // Carregar última atualização
  React.useEffect(() => {
    const carregarUltimaAtualizacao = async () => {
      try {
        const { data, error } = await supabase
          .from('balanco_evolucao_cache')
          .select('data_atualizacao')
          .eq('ano', anoSelecionado)
          .order('data_atualizacao', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const dataAtualizacao = new Date(data[0].data_atualizacao);
          setUltimaAtualizacao(dataAtualizacao.toLocaleString('pt-BR'));
        }
      } catch (error) {
        console.error('Erro ao carregar última atualização:', error);
      }
    };

    carregarUltimaAtualizacao();
  }, [anoSelecionado]);

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-0">
                      <FontAwesomeIcon icon={faCalculator} className="me-2" />
                      Processamento de Balanço
                    </h4>
                    <small>Calcule e atualize os valores do balanço financeiro</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <Form.Label className="text-white mb-0 me-2">Ano:</Form.Label>
                    <Form.Select
                      value={anoSelecionado}
                      onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                      disabled={processando}
                      style={{ width: '100px' }}
                    >
                      {Array.from({ length: 2030 - 2019 + 1 }, (_, i) => 2019 + i).map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  <strong>Atenção:</strong> Este processo calcula os valores líquidos de todas as imobiliárias 
                  para cada mês do ano selecionado. Pode levar alguns minutos dependendo da quantidade de dados.
                </Alert>

                {ultimaAtualizacao && (
                  <Alert variant="success">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    <strong>Última atualização:</strong> {ultimaAtualizacao}
                  </Alert>
                )}

                {erro && (
                  <Alert variant="danger" onClose={() => setErro('')} dismissible>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    {erro}
                  </Alert>
                )}

                {sucesso && (
                  <Alert variant="success" onClose={() => setSucesso(false)} dismissible>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Processamento concluído com sucesso! Os dados foram salvos no cache.
                  </Alert>
                )}

                {processando && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>{mensagem || 'Processando...'}</span>
                      <span>{progresso}%</span>
                    </div>
                    <ProgressBar now={progresso} animated striped />
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={processarBalanco}
                  disabled={processando}
                  className="w-100"
                >
                  {processando ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} className="me-2" />
                      Processar Balanço {anoSelecionado}
                    </>
                  )}
                </Button>

                <Alert variant="secondary" className="mt-3 mb-0">
                  <small>
                    <strong>Dica:</strong> Após processar, os dados ficarão disponíveis na tela de Balanço 
                    de forma muito mais rápida. Execute este processamento sempre que houver alterações 
                    significativas nas vistorias ou quando precisar atualizar os valores.
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default ProcessamentoBalanco;

