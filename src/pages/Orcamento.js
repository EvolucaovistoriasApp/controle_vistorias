import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faCheck, faTimes, faRefresh, faCopy, faPrint } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import DashboardLayout from '../components/DashboardLayout';
import { tiposConsumoService } from '../lib/supabase';

const Orcamento = ({ deslogar, usuarioLogado }) => {
  // Estados principais
  const [tiposConsumo, setTiposConsumo] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do formulário
  const [areaImovel, setAreaImovel] = useState('');
  const [creditoAvulso, setCreditoAvulso] = useState('1.85');
  const [taxasSelecionadas, setTaxasSelecionadas] = useState(new Set());
  const [taxasDeslocamentoSelecionadas, setTaxasDeslocamentoSelecionadas] = useState(new Set());
  
  // Estados de cálculo
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [showResultado, setShowResultado] = useState(false);
  const [capturandoImagem, setCapturandoImagem] = useState(false);

  // Taxas de deslocamento fixas (em m²)
  const taxasDeslocamento = [
    { id: 'desl_31_60', nome: 'Taxa de deslocamento 31 a 60 km', metros: 50, descricao: 'Adicional de 50m² para deslocamentos de 31 a 60km' },
    { id: 'desl_61_90', nome: 'Taxa de deslocamento 61 a 90 km', metros: 100, descricao: 'Adicional de 100m² para deslocamentos de 61 a 90km' },
    { id: 'desl_91_120', nome: 'Taxa de deslocamento 91 a 120 km', metros: 150, descricao: 'Adicional de 150m² para deslocamentos de 91 a 120km' },
    { id: 'desl_121_150', nome: 'Taxa de deslocamento 121 a 150 km', metros: 200, descricao: 'Adicional de 200m² para deslocamentos de 121 a 150km' }
  ];

  // Carregar tipos de consumo na inicialização
  useEffect(() => {
    carregarTiposConsumo();
  }, []);

  const carregarTiposConsumo = async () => {
    setLoading(true);
    try {
      const result = await tiposConsumoService.listarTiposConsumo();
      if (result.success) {
        setTiposConsumo(result.data || []);
      } else {
        console.error('Erro ao carregar tipos de consumo:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar seleção de taxa
  const toggleTaxa = (nomeCategoria, porcentagem) => {
    const novaSelecao = new Set(taxasSelecionadas);
    const chave = `${nomeCategoria}|${porcentagem}`;
    
    if (novaSelecao.has(chave)) {
      novaSelecao.delete(chave);
    } else {
      novaSelecao.add(chave);
    }
    
    setTaxasSelecionadas(novaSelecao);
  };

  // Função para verificar se uma taxa está selecionada
  const isTaxaSelecionada = (nomeCategoria, porcentagem) => {
    const chave = `${nomeCategoria}|${porcentagem}`;
    return taxasSelecionadas.has(chave);
  };

  // Função para alternar seleção de taxa de deslocamento
  const toggleTaxaDeslocamento = (taxaId) => {
    const novaSelecao = new Set(taxasDeslocamentoSelecionadas);
    
    if (novaSelecao.has(taxaId)) {
      novaSelecao.delete(taxaId);
    } else {
      novaSelecao.add(taxaId);
    }
    
    setTaxasDeslocamentoSelecionadas(novaSelecao);
  };

  // Função para verificar se uma taxa de deslocamento está selecionada
  const isTaxaDeslocamentoSelecionada = (taxaId) => {
    return taxasDeslocamentoSelecionadas.has(taxaId);
  };

  // Função principal de cálculo
  const calcularOrcamento = () => {
    if (!areaImovel || parseFloat(areaImovel) <= 0) {
      alert('Por favor, insira uma área válida para o imóvel.');
      return;
    }

    const area = parseFloat(areaImovel);
    const valorCredito = parseFloat(creditoAvulso) || 1.85;
    
    // Valor base da vistoria técnica (área * valor do crédito)
    const valorBase = area * valorCredito;
    
    // Calcular adicionais percentuais selecionados
    const adicionaisPercentuais = [];
    let totalAdicionaisPercentuais = 0;
    
    taxasSelecionadas.forEach(chave => {
      const [nome, porcentagemStr] = chave.split('|');
      const porcentagem = parseFloat(porcentagemStr);
      const valorAdicional = (valorBase * porcentagem) / 100;
      
      adicionaisPercentuais.push({
        nome,
        porcentagem,
        valor: valorAdicional,
        tipo: 'percentual'
      });
      
      totalAdicionaisPercentuais += valorAdicional;
    });

    // Calcular taxas de deslocamento selecionadas
    const taxasDeslocamentoAplicadas = [];
    let totalMetrosDeslocamento = 0;
    
    taxasDeslocamentoSelecionadas.forEach(taxaId => {
      const taxa = taxasDeslocamento.find(t => t.id === taxaId);
      if (taxa) {
        const valorTaxa = taxa.metros * valorCredito;
        
        taxasDeslocamentoAplicadas.push({
          nome: taxa.nome,
          metros: taxa.metros,
          valor: valorTaxa,
          tipo: 'deslocamento'
        });
        
        totalMetrosDeslocamento += taxa.metros;
      }
    });

    const totalValorDeslocamento = totalMetrosDeslocamento * valorCredito;

    // Calcular total de consumo em créditos (área + metros de deslocamento + adicionais convertidos)
    const totalConsumoCreditos = area + totalMetrosDeslocamento + (totalAdicionaisPercentuais / valorCredito);
    
    // Valor total da vistoria
    const valorTotal = valorBase + totalAdicionaisPercentuais + totalValorDeslocamento;

    const resultado = {
      areaImovel: area,
      valorCreditoAvulso: valorCredito,
      valorBase,
      adicionaisPercentuais,
      totalAdicionaisPercentuais,
      taxasDeslocamento: taxasDeslocamentoAplicadas,
      totalMetrosDeslocamento,
      totalValorDeslocamento,
      totalConsumoCreditos,
      valorTotal,
      dataCalculo: new Date()
    };

    setResultadoCalculo(resultado);
    setShowResultado(true);
  };

  // Função para limpar formulário
  const limparFormulario = () => {
    setAreaImovel('');
    setCreditoAvulso('1.85');
    setTaxasSelecionadas(new Set());
    setTaxasDeslocamentoSelecionadas(new Set());
    setResultadoCalculo(null);
    setShowResultado(false);
  };

  // Função para copiar orçamento
  const copiarOrcamento = () => {
    if (!resultadoCalculo) return;

    const adicionaisPercentuaisTexto = resultadoCalculo.adicionaisPercentuais?.length > 0 
      ? resultadoCalculo.adicionaisPercentuais.map(ad => 
          `• ${ad.nome} (+${ad.porcentagem}%): R$ ${ad.valor.toFixed(2)}`
        ).join('\n')
      : '';

    const taxasDeslocamentoTexto = resultadoCalculo.taxasDeslocamento?.length > 0
      ? resultadoCalculo.taxasDeslocamento.map(td => 
          `• ${td.nome} (+${td.metros}m²): R$ ${td.valor.toFixed(2)}`
        ).join('\n')
      : '';

    const texto = `
ORÇAMENTO DE VISTORIA TÉCNICA
═══════════════════════════════════════

Área do imóvel: ${resultadoCalculo.areaImovel.toFixed(2)} m²
Valor do crédito avulso: R$ ${resultadoCalculo.valorCreditoAvulso.toFixed(2)}

${adicionaisPercentuaisTexto ? 'ADICIONAIS PERCENTUAIS:' : ''}
${adicionaisPercentuaisTexto}

${taxasDeslocamentoTexto ? 'TAXAS DE DESLOCAMENTO:' : ''}
${taxasDeslocamentoTexto}

${(adicionaisPercentuaisTexto || taxasDeslocamentoTexto) ? `
RESUMO:
Valor base: R$ ${resultadoCalculo.valorBase.toFixed(2)}
Total adicionais percentuais: R$ ${(resultadoCalculo.totalAdicionaisPercentuais || 0).toFixed(2)}
Total taxas de deslocamento: R$ ${(resultadoCalculo.totalValorDeslocamento || 0).toFixed(2)}
` : ''}
TOTAL DE CONSUMO: ${resultadoCalculo.totalConsumoCreditos.toFixed(2)} créditos
VALOR DA VISTORIA TÉCNICA: R$ ${resultadoCalculo.valorTotal.toFixed(2)}

Data do orçamento: ${resultadoCalculo.dataCalculo.toLocaleString('pt-BR')}
    `.trim();

    navigator.clipboard.writeText(texto).then(() => {
      alert('Orçamento copiado para a área de transferência!');
    }).catch(() => {
      alert('Erro ao copiar orçamento. Tente novamente.');
    });
  };

  // Função para capturar e salvar como imagem
  const imprimirOrcamento = async () => {
    if (!resultadoCalculo) return;

    setCapturandoImagem(true);
    let originalStyle = null;
    
    try {
      // Encontrar o elemento que contém o resultado do orçamento
      const elemento = document.getElementById('resultado-orcamento');
      if (!elemento) {
        alert('Erro ao encontrar a área de resultado do orçamento.');
        return;
      }

      // Forçar um tamanho específico temporariamente para captura otimizada
      originalStyle = elemento.style.cssText;
      elemento.style.width = '480px';
      elemento.style.maxWidth = '480px';
      elemento.style.minWidth = '480px';

      // Aguardar um momento para o layout se ajustar
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configurações para melhor qualidade da imagem e tamanho otimizado
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#ffffff',
        scale: 2, // Aumenta a resolução
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        logging: false,
        width: 480, // Largura fixa otimizada
        height: elemento.offsetHeight,
        windowWidth: 480,
        windowHeight: elemento.offsetHeight + 50,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });

      // Restaurar o estilo original
      elemento.style.cssText = originalStyle;

      // Converter canvas para blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // Tentar usar a API moderna do clipboard (funciona no Chrome/Edge)
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob
                })
              ]);
              alert('Imagem do orçamento copiada para a área de transferência!');
            } else {
              // Fallback: criar link de download
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `orcamento-vistoria-${new Date().toISOString().split('T')[0]}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              alert('Imagem do orçamento baixada! Você pode compartilhá-la pelo WhatsApp.');
            }
          } catch (error) {
            console.error('Erro ao copiar imagem:', error);
            // Fallback final: download da imagem
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orcamento-vistoria-${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Imagem do orçamento baixada! Você pode compartilhá-la pelo WhatsApp.');
          }
        }
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('Erro ao capturar imagem:', error);
      alert('Erro ao gerar imagem do orçamento. Tente novamente.');
      
      // Restaurar estilo original em caso de erro
      const elemento = document.getElementById('resultado-orcamento');
      if (elemento && originalStyle !== null) {
        elemento.style.cssText = originalStyle;
      }
    } finally {
      setCapturandoImagem(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando dados de orçamento...</p>
            </div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">
                  <FontAwesomeIcon icon={faCalculator} className="me-2" />
                  Calculadora de Orçamento
                </h4>
                <small>Calcule o valor da vistoria técnica com base na área e condições do imóvel</small>
              </Card.Header>
              
              <Card.Body>
                <Row>
                  {/* Formulário de entrada */}
                  <Col lg={6}>
                    <h5 className="text-secondary mb-3">Dados do Imóvel</h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Área do imóvel (m²)</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={areaImovel}
                          onChange={(e) => setAreaImovel(e.target.value)}
                          placeholder="Ex: 65.27"
                        />
                        <InputGroup.Text>m²</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Valor do crédito avulso</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={creditoAvulso}
                          onChange={(e) => setCreditoAvulso(e.target.value)}
                          placeholder="1.85"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Valor personalizado por cliente
                      </Form.Text>
                    </Form.Group>

                    <h5 className="text-secondary mb-3">Adicionais Percentuais</h5>
                    
                    <div className="border rounded p-3 mb-4" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {tiposConsumo.length === 0 ? (
                        <p className="text-muted mb-0">Nenhuma taxa adicional configurada</p>
                      ) : (
                        tiposConsumo.map((tipo) => {
                          const isSelected = isTaxaSelecionada(tipo.nome, tipo.porcentagem);
                          return (
                            <div 
                              key={tipo.id} 
                              className={`p-2 mb-2 rounded border cursor-pointer ${isSelected ? 'bg-primary text-white' : 'bg-light'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleTaxa(tipo.nome, tipo.porcentagem)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{tipo.nome}</strong>
                                  <Badge bg={isSelected ? "light" : "primary"} className="ms-2">
                                    +{tipo.porcentagem}%
                                  </Badge>
                                </div>
                                <FontAwesomeIcon 
                                  icon={isSelected ? faCheck : faTimes} 
                                  className={isSelected ? "text-success" : "text-muted"}
                                />
                              </div>
                              <small className={isSelected ? "text-light" : "text-muted"}>
                                {tipo.descricao}
                              </small>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <h5 className="text-secondary mb-3">Taxas de Deslocamento</h5>
                    
                    <div className="border rounded p-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {taxasDeslocamento.map((taxa) => {
                        const isSelected = isTaxaDeslocamentoSelecionada(taxa.id);
                        return (
                          <div 
                            key={taxa.id} 
                            className={`p-2 mb-2 rounded border cursor-pointer ${isSelected ? 'bg-success text-white' : 'bg-light'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleTaxaDeslocamento(taxa.id)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{taxa.nome}</strong>
                                <Badge bg={isSelected ? "light" : "success"} className="ms-2">
                                  +{taxa.metros}m²
                                </Badge>
                              </div>
                              <FontAwesomeIcon 
                                icon={isSelected ? faCheck : faTimes} 
                                className={isSelected ? "text-warning" : "text-muted"}
                              />
                            </div>
                            <small className={isSelected ? "text-light" : "text-muted"}>
                              {taxa.descricao}
                            </small>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 d-grid gap-2">
                      <Button 
                        variant="success" 
                        size="lg" 
                        onClick={calcularOrcamento}
                        disabled={!areaImovel}
                      >
                        <FontAwesomeIcon icon={faCalculator} className="me-2" />
                        Calcular Orçamento
                      </Button>
                      
                      <Button 
                        variant="outline-secondary" 
                        onClick={limparFormulario}
                      >
                        <FontAwesomeIcon icon={faRefresh} className="me-2" />
                        Limpar Formulário
                      </Button>
                    </div>
                  </Col>

                  {/* Resultado do cálculo */}
                  <Col lg={6}>
                    {showResultado && resultadoCalculo ? (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-secondary mb-0">Resultado do Orçamento</h5>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={copiarOrcamento}
                            >
                              <FontAwesomeIcon icon={faCopy} className="me-1" />
                              Copiar
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              onClick={imprimirOrcamento}
                              disabled={capturandoImagem}
                            >
                              {capturandoImagem ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Gerando...
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faPrint} className="me-1" />
                                  Print
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div id="resultado-orcamento" style={{ maxWidth: '500px', width: '100%' }}>
                          <Card className="bg-light">
                            <Card.Header className="bg-primary text-white text-center">
                              <h6 className="mb-0">
                                <FontAwesomeIcon icon={faCalculator} className="me-2" />
                                Orçamento de Vistoria Técnica
                              </h6>
                            </Card.Header>
                            <Card.Body>
                              <Table className="mb-0" size="sm">
                              <tbody>
                                <tr>
                                  <td><strong>Área do imóvel:</strong></td>
                                  <td className="text-end">{resultadoCalculo.areaImovel.toFixed(2)} m²</td>
                                </tr>
                                
                                {resultadoCalculo.adicionaisPercentuais?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan="2" className="pt-3">
                                        <strong className="text-primary">Adicionais Percentuais:</strong>
                                      </td>
                                    </tr>
                                    {resultadoCalculo.adicionaisPercentuais.map((adicional, index) => (
                                      <tr key={index}>
                                        <td>
                                          <small>{adicional.nome} (+{adicional.porcentagem}%)</small>
                                        </td>
                                        <td className="text-end">
                                          <small>R$ {adicional.valor.toFixed(2)}</small>
                                        </td>
                                      </tr>
                                    ))}
                                  </>
                                )}

                                {resultadoCalculo.taxasDeslocamento?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan="2" className="pt-3">
                                        <strong className="text-success">Taxas de Deslocamento:</strong>
                                      </td>
                                    </tr>
                                    {resultadoCalculo.taxasDeslocamento.map((taxa, index) => (
                                      <tr key={index}>
                                        <td>
                                          <small>{taxa.nome} (+{taxa.metros}m²)</small>
                                        </td>
                                        <td className="text-end">
                                          <small>R$ {taxa.valor.toFixed(2)}</small>
                                        </td>
                                      </tr>
                                    ))}
                                  </>
                                )}
                                
                                <tr>
                                  <td colSpan="2"><hr className="my-2" /></td>
                                </tr>
                                
                                <tr>
                                  <td><strong>Total de consumo (créditos):</strong></td>
                                  <td className="text-end"><strong>{resultadoCalculo.totalConsumoCreditos.toFixed(2)}</strong></td>
                                </tr>
                                
                                <tr>
                                  <td><strong>Valor do crédito avulso:</strong></td>
                                  <td className="text-end">R$ {resultadoCalculo.valorCreditoAvulso.toFixed(2)}</td>
                                </tr>
                                
                                <tr className="table-success">
                                  <td><strong>Valor da vistoria técnica:</strong></td>
                                  <td className="text-end"><strong>R$ {resultadoCalculo.valorTotal.toFixed(2)}</strong></td>
                                </tr>
                                                              </tbody>
                              </Table>
                              
                              <Alert variant="warning" className="mt-3 mb-0">
                                <small>
                                  <strong>Importante:</strong> Com base nas informações fornecidas pelo cliente, 
                                  o valor da vistoria técnica fica em <strong>R$ {resultadoCalculo.valorTotal.toFixed(2)}</strong>. 
                                  Porém, as informações serão analisadas no local, podendo então haver mudanças no valor final.
                                </small>
                              </Alert>
                              
                              <div className="text-center mt-2">
                                <small className="text-muted">
                                  <FontAwesomeIcon icon={faCalculator} className="me-1" />
                                  Orçamento calculado em {resultadoCalculo.dataCalculo.toLocaleString('pt-BR')}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                        
                        <Alert variant="info" className="mt-3">
                          <small>
                            💡 <strong>Dica:</strong> Use o botão "Print" para gerar uma imagem do orçamento 
                            e compartilhar diretamente no WhatsApp com seus clientes.
                          </small>
                        </Alert>
                      </div>
                    ) : (
                      <div className="text-center text-muted mt-5">
                        <FontAwesomeIcon icon={faCalculator} size="3x" className="mb-3 opacity-50" />
                        <h5>Resultado do Orçamento</h5>
                        <p>Preencha os dados e clique em "Calcular Orçamento" para ver o resultado</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default Orcamento;
