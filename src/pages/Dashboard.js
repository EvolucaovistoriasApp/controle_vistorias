import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTrash, faEdit, faMapMarkerAlt, faBolt } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { vistoriasService, imobiliariasService, vistoriadoresService, tiposService, tiposConsumoService, creditosService } from '../lib/supabase';

// 🆕 Componente para exibir valor monetário da vistoria (valor fixo salvo no momento do lançamento)
const ValorMonetarioVistoria = ({ vistoria }) => {
  const [valorMonetario, setValorMonetario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obterValor = async () => {
      try {
        setLoading(true);
        
        // Se a vistoria já tem valor_monetario salvo, usar esse valor
        if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
          setValorMonetario(parseFloat(vistoria.valor_monetario));
        } else {
          // Para vistorias antigas sem valor_monetario, calcular baseado no valor unitário mais recente
          const result = await creditosService.obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
          let valorUnitario = 0;
          
          if (result.success) {
            valorUnitario = result.data;
          }
          
          const consumo = parseFloat(vistoria.consumo_calculado) || 0;
          const valor = valorUnitario * consumo;
          setValorMonetario(valor);
        }
      } catch (error) {
        console.error('Erro ao obter valor monetário:', error);
        setValorMonetario(0);
      } finally {
        setLoading(false);
      }
    };

    obterValor();
  }, [vistoria.valor_monetario, vistoria.imobiliaria_id, vistoria.consumo_calculado]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <span className={`fw-bold ${valorMonetario > 0 ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.9em' }}>
      {formatCurrency(valorMonetario)}
    </span>
  );
};

// 🆕 Componente para calcular e exibir o total de valores das vistorias
const TotalValorVistorias = ({ vistorias }) => {
  const [totalValor, setTotalValor] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularTotal = async () => {
      try {
        setLoading(true);
        let total = 0;
        
        // Calcular valor para cada vistoria
        for (const vistoria of vistorias) {
          // Se a vistoria tem valor_monetario salvo, usar esse valor
          if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
            total += parseFloat(vistoria.valor_monetario);
          } else {
            // Para vistorias antigas sem valor_monetario, calcular baseado no valor unitário mais recente
            const result = await creditosService.obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
            if (result.success) {
              const valorUnitario = result.data;
              const consumo = parseFloat(vistoria.consumo_calculado) || 0;
              total += valorUnitario * consumo;
            }
          }
        }
        
        setTotalValor(total);
      } catch (error) {
        console.error('Erro ao calcular total:', error);
        setTotalValor(0);
      } finally {
        setLoading(false);
      }
    };

    calcularTotal();
  }, [vistorias]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  return (
    <span className="fw-bold text-primary fs-6">
      {formatCurrency(totalValor)}
    </span>
  );
};

const Dashboard = ({ deslogar, usuarioLogado }) => {
  // Estados para dados das vistorias
  const [vistorias, setVistorias] = useState([]);
  const [imobiliarias, setImobiliarias] = useState([]);
  const [vistoriadores, setVistoriadores] = useState([]);
  const [tiposImovel, setTiposImovel] = useState([]);
  const [tiposMobilia, setTiposMobilia] = useState([]);
  const [tiposVistoria, setTiposVistoria] = useState([]);
  const [tiposConsumo, setTiposConsumo] = useState([]);

  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [loadingModal, setLoadingModal] = useState(false);
  const [salvandoVistoria, setSalvandoVistoria] = useState(false);

  const [filtroTexto, setFiltroTexto] = useState('');

  // Estados para o modal de nova vistoria
  const [showNovaVistoriaModal, setShowNovaVistoriaModal] = useState(false);
  const [vistoriaData, setVistoriaData] = useState({
    codigo: '',
    imobiliariaId: '',
    vistoriadorId: '',
    tipoImovelId: '',
    tipoVistoriaId: '',
    endereco: '',
    dataVistoria: '',
    area: '',
    tipoMobiliaId: '',
    taxaDeslocamento: '',
    isExpress: false
  });
  const [vistoriaErrors, setVistoriaErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [valorUnitarioAtual, setValorUnitarioAtual] = useState(0);
  const [vistoriaEditando, setVistoriaEditando] = useState(null);
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [vistoriaParaExcluir, setVistoriaParaExcluir] = useState(null);
  const [excluindoVistoria, setExcluindoVistoria] = useState(false);

  // Carregamento de dados do Supabase
  useEffect(() => {
    carregarDadosReaisDoSupabase();
  }, []);

  const carregarDadosReaisDoSupabase = async () => {
    try {
      setLoading(true);
      
      // Carregar vistorias
      const vistoriaResult = await vistoriasService.listarVistorias(usuarioLogado.id);
      if (vistoriaResult.success) {
        setVistorias(vistoriaResult.data);
      }

      // Carregar imobiliárias
      const imobiliariaResult = await imobiliariasService.listar();
      if (imobiliariaResult.success) {
        setImobiliarias(imobiliariaResult.data);
      }

      // Carregar vistoriadores
      const vistoriadorResult = await vistoriadoresService.listar();
      if (vistoriadorResult.success) {
        setVistoriadores(vistoriadorResult.data);
      }

      // Carregar tipos
      const [tiposImovelResult, tiposMobiliaResult, tiposVistoriaResult, tiposConsumoResult] = await Promise.all([
        tiposService.listarTiposImoveis(),
        tiposService.listarTiposMobilia(),
        tiposService.listarTiposVistorias(),
        tiposConsumoService.listarTiposConsumo()
      ]);

      if (tiposImovelResult.success) setTiposImovel(tiposImovelResult.data);
      if (tiposMobiliaResult.success) setTiposMobilia(tiposMobiliaResult.data);
      if (tiposVistoriaResult.success) setTiposVistoria(tiposVistoriaResult.data);
      if (tiposConsumoResult.success) setTiposConsumo(tiposConsumoResult.data);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar vistorias
  const vistoriasFiltradas = vistorias.filter(vistoria => {
    const textoFiltro = filtroTexto.toLowerCase();
    return (
      vistoria.codigo.toLowerCase().includes(textoFiltro) ||
      (vistoria.imobiliarias?.nome || '').toLowerCase().includes(textoFiltro) ||
      (vistoria.vistoriadores?.nome || '').toLowerCase().includes(textoFiltro) ||
      vistoria.endereco.toLowerCase().includes(textoFiltro) ||
      (vistoria.tipos_imoveis?.nome || '').toLowerCase().includes(textoFiltro)
    );
  });

  // Função para obter data atual
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Funções do modal Nova Vistoria
  const handleShowNovaVistoriaModal = async () => {
    try {
      setLoadingModal(true);
      
      setVistoriaData({
        codigo: '', // Campo iniciando vazio
        imobiliariaId: '',
        vistoriadorId: '',
        tipoImovelId: '',
        tipoVistoriaId: '',
        endereco: '',
        dataVistoria: getCurrentDate(),
        area: '',
        tipoMobiliaId: '',
        isExpress: false
      });
      setShowNovaVistoriaModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseNovaVistoriaModal = () => {
    setShowNovaVistoriaModal(false);
    setVistoriaData({
      codigo: '',
      imobiliariaId: '',
      vistoriadorId: '',
      tipoImovelId: '',
      tipoVistoriaId: '',
      endereco: '',
      dataVistoria: '',
      area: '',
      tipoMobiliaId: '',
      taxaDeslocamento: '',
      isExpress: false
    });
    setVistoriaErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setValorUnitarioAtual(0);
    setVistoriaEditando(null); // 🆕 Limpar estado de edição
  };

  // Função para obter valor unitário mais recente
  const obterValorUnitarioMaisRecente = async (imobiliariaId) => {
    try {
      const result = await creditosService.obterValorUnitarioMaisRecente(imobiliariaId);
      if (result.success) {
        return result.data;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter valor unitário:', error);
      return 0;
    }
  };

  // Função para lidar com mudanças no formulário
  const handleVistoriaInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setVistoriaData({
      ...vistoriaData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Quando selecionar uma imobiliária, carregar o valor unitário mais recente
    if (name === 'imobiliariaId' && value) {
      try {
        const valorUnitario = await obterValorUnitarioMaisRecente(value);
        setValorUnitarioAtual(valorUnitario);
      } catch (error) {
        console.error('Erro ao carregar valor unitário:', error);
        setValorUnitarioAtual(0);
      }
    }
  };

  // Função para validar formulário
  const validateVistoriaForm = () => {
    const errors = {};
    
    if (!vistoriaData.codigo.trim()) errors.codigo = 'Código é obrigatório';
    if (!vistoriaData.imobiliariaId) errors.imobiliariaId = 'Imobiliária é obrigatória';
    if (!vistoriaData.vistoriadorId) errors.vistoriadorId = 'Vistoriador é obrigatório';
    if (!vistoriaData.tipoImovelId) errors.tipoImovelId = 'Tipo de imóvel é obrigatório';
    if (!vistoriaData.tipoVistoriaId) errors.tipoVistoriaId = 'Tipo de vistoria é obrigatório';
    if (!vistoriaData.endereco.trim()) errors.endereco = 'Endereço é obrigatório';
    if (!vistoriaData.dataVistoria) errors.dataVistoria = 'Data da vistoria é obrigatória';
    if (!vistoriaData.area || parseFloat(vistoriaData.area) <= 0) errors.area = 'Área deve ser maior que zero';
    if (!vistoriaData.tipoMobiliaId) errors.tipoMobiliaId = 'Tipo de mobília é obrigatório';

    setVistoriaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar/Atualizar vistoria
  const handleSaveVistoria = async () => {
    if (!validateVistoriaForm()) return;

    try {
      setSalvandoVistoria(true);
      setErrorMessage('');

      const consumoCalculado = calculateConsumo();
      const valorMonetario = consumoCalculado * valorUnitarioAtual;

      const dadosVistoria = {
        codigo: vistoriaData.codigo.trim(),
        usuario_id: usuarioLogado.id,
        imobiliaria_id: vistoriaData.imobiliariaId,
        vistoriador_id: vistoriaData.vistoriadorId,
        tipo_imovel_id: vistoriaData.tipoImovelId,
        tipo_vistoria_id: vistoriaData.tipoVistoriaId,
        tipo_mobilia_id: vistoriaData.tipoMobiliaId,
        endereco: vistoriaData.endereco.trim(),
        data_vistoria: vistoriaData.dataVistoria,
        area_imovel: parseFloat(vistoriaData.area),
        taxa_deslocamento: parseFloat(vistoriaData.taxaDeslocamento) || 0,
        is_express: vistoriaData.isExpress,
        consumo_calculado: consumoCalculado,
        valor_monetario: valorMonetario,
        status: 'pendente'
      };

      let result;
      if (vistoriaEditando) {
        // 🆕 Editar vistoria existente
        result = await vistoriasService.atualizarVistoria(vistoriaEditando.id, dadosVistoria);
        
        if (result.success) {
          // Atualizar na lista
          setVistorias(vistorias.map(v => 
            v.id === vistoriaEditando.id ? result.data : v
          ));
          setSuccessMessage(`Vistoria ${vistoriaData.codigo} atualizada com sucesso!`);
        }
      } else {
        // Criar nova vistoria
        result = await vistoriasService.criarVistoria(dadosVistoria);
        
        if (result.success) {
          setVistorias([result.data, ...vistorias]);
          const creditosDebitados = parseFloat(calculateConsumo().toFixed(2));
          setSuccessMessage(`Vistoria cadastrada com sucesso! ${creditosDebitados} créditos foram debitados da imobiliária.`);
        }
      }
      
      if (result.success) {
        setTimeout(() => {
          handleCloseNovaVistoriaModal();
        }, 2000);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar vistoria:', error);
      setErrorMessage('Erro interno do servidor');
    } finally {
      setSalvandoVistoria(false);
    }
  };

  // Cálculo de consumo baseado em dados da tabela tipos_consumo
  const calculateConsumo = () => {
    const area = parseFloat(vistoriaData.area) || 0;
    if (area === 0) return 0;

    let consumoTotal = area; // Base: 1 crédito por m²

    // Adicionar percentual por tipo de imóvel
    if (vistoriaData.tipoImovelId) {
      const tipoImovel = tiposImovel.find(t => t.id === vistoriaData.tipoImovelId);
      if (tipoImovel) {
        const tipoConsumo = tiposConsumo.find(tc => 
          tc.nome.toLowerCase() === tipoImovel.nome.toLowerCase()
        );
        if (tipoConsumo) {
          consumoTotal += (area * tipoConsumo.porcentagem / 100);
        }
      }
    }

    // Adicionar percentual por tipo de mobília
    if (vistoriaData.tipoMobiliaId) {
      const tipoMobilia = tiposMobilia.find(t => t.id === vistoriaData.tipoMobiliaId);
      if (tipoMobilia) {
        const tipoConsumo = tiposConsumo.find(tc => 
          tc.nome.toLowerCase() === tipoMobilia.nome.toLowerCase()
        );
        if (tipoConsumo) {
          consumoTotal += (area * tipoConsumo.porcentagem / 100);
        }
      }
    }

    // Adicionar percentual se for Express
    if (vistoriaData.isExpress) {
      const tipoConsumo = tiposConsumo.find(tc => 
        tc.nome.toLowerCase() === 'express'
      );
      if (tipoConsumo) {
        consumoTotal += (area * tipoConsumo.porcentagem / 100);
      }
    }

    // 🆕 Adicionar Taxa de Deslocamento (valor fixo, não multiplicado)
    const taxaDeslocamento = parseFloat(vistoriaData.taxaDeslocamento) || 0;
    consumoTotal += taxaDeslocamento;

    return consumoTotal;
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // 🆕 Função para editar vistoria
  const handleEditarVistoria = async (vistoria) => {
    try {
      setLoadingModal(true);
      setVistoriaEditando(vistoria);

      // Carregar valor unitário da imobiliária
      const valorUnitario = await obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
      setValorUnitarioAtual(valorUnitario);

      // Preencher formulário com dados da vistoria
      setVistoriaData({
        codigo: vistoria.codigo,
        imobiliariaId: vistoria.imobiliaria_id,
        vistoriadorId: vistoria.vistoriador_id,
        tipoImovelId: vistoria.tipo_imovel_id,
        tipoVistoriaId: vistoria.tipo_vistoria_id,
        endereco: vistoria.endereco,
        dataVistoria: vistoria.data_vistoria,
        area: vistoria.area_imovel.toString(),
        tipoMobiliaId: vistoria.tipo_mobilia_id,
        taxaDeslocamento: vistoria.taxa_deslocamento ? vistoria.taxa_deslocamento.toString() : '',
        isExpress: vistoria.is_express
      });

      setShowNovaVistoriaModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal de edição:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  // 🆕 Função para confirmar exclusão
  const handleConfirmarExclusao = (vistoria) => {
    setVistoriaParaExcluir(vistoria);
    setShowConfirmExcluir(true);
  };

  // 🆕 Função para excluir vistoria
  const handleExcluirVistoria = async () => {
    if (!vistoriaParaExcluir) return;

    try {
      setExcluindoVistoria(true);

      const result = await vistoriasService.excluirVistoria(vistoriaParaExcluir.id);
      
      if (result.success) {
        // Atualizar lista de vistorias
        setVistorias(vistorias.filter(v => v.id !== vistoriaParaExcluir.id));
        
        // Fechar modal de confirmação
        setShowConfirmExcluir(false);
        setVistoriaParaExcluir(null);
        
        // Mostrar mensagem de sucesso
        alert(`Vistoria ${vistoriaParaExcluir.codigo} excluída com sucesso! Os créditos foram devolvidos à imobiliária.`);
      } else {
        alert('Erro ao excluir vistoria: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir vistoria:', error);
      alert('Erro interno do servidor');
    } finally {
      setExcluindoVistoria(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando dashboard...</p>
            </div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid className="px-2">
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 className="text-primary mb-1">
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Dashboard de Vistorias
                    </h4>
                    <small className="text-muted">
                      {vistoriasFiltradas.length} vistorias encontradas
                    </small>
                  </div>
                  <Button 
                    variant="success" 
                    onClick={handleShowNovaVistoriaModal}
                    disabled={loading || loadingModal}
                    className="text-nowrap"
                  >
                    {loadingModal ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Nova Vistoria
                      </>
                    )}
                  </Button>
                </div>

                <Row className="mb-3">
                  <Col md={6} lg={4}>
                    <InputGroup size="sm">
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faSearch} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Filtrar vistorias..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                </Row>

                {/* Lista de Vistorias */}
                {vistoriasFiltradas.length === 0 ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faSearch} className="text-muted fs-1 mb-3" />
                    <h5 className="text-muted">Nenhuma vistoria encontrada</h5>
                    <p className="text-muted">
                      {filtroTexto ? 
                        'Tente ajustar os filtros de busca.' : 
                        'Clique em "Nova Vistoria" para cadastrar a primeira vistoria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="table-sm mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th style={{ width: '6%' }}>Código</th>
                          <th style={{ width: '12%' }}>Imobiliária</th>
                          <th style={{ width: '10%' }}>Vistoriador</th>
                          <th style={{ width: '8%' }}>Data</th>
                          <th style={{ width: '8%' }}>Tipo</th>
                          <th style={{ width: '6%' }}>Área</th>
                          <th style={{ width: '8%' }}>Mobília</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>Consumo</th>
                          <th style={{ width: '18%' }}>Endereço</th>
                          <th style={{ width: '9%' }}>Valor</th>
                          <th style={{ width: '8%' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vistoriasFiltradas.map((vistoria) => (
                          <tr key={vistoria.id}>
                            <td className="text-nowrap">
                              <strong className="text-primary" style={{ fontSize: '0.9em' }}>
                                {vistoria.codigo}
                              </strong>
                              {vistoria.is_express && (
                                <Badge bg="warning" size="sm" className="ms-1">
                                  <FontAwesomeIcon icon={faBolt} />
                                </Badge>
                              )}
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                              {vistoria.imobiliarias?.nome || 'N/A'}
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                              {vistoria.vistoriadores?.nome ? 
                                vistoria.vistoriadores.nome.split(' ')[0] + ' ' + (vistoria.vistoriadores.nome.split(' ')[1] || '') : 
                                'N/A'
                              }
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                              {formatDate(vistoria.data_vistoria)}
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85em' }}>
                              {vistoria.tipos_imoveis?.nome || 'N/A'}
                            </td>
                            <td className="text-nowrap text-center" style={{ fontSize: '0.9em' }}>
                              {vistoria.area_imovel}m²
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85em' }}>
                              {vistoria.tipos_mobilia?.nome || 'N/A'}
                            </td>
                            <td className="text-nowrap text-center" style={{ fontSize: '0.9em' }}>
                              <strong>{parseFloat(vistoria.consumo_calculado).toFixed(1)}</strong>
                            </td>
                            <td 
                              className="text-truncate" 
                              style={{ 
                                maxWidth: '150px',
                                fontSize: '0.85em' 
                              }}
                              title={vistoria.endereco}
                            >
                              {vistoria.endereco}
                            </td>
                            <td className="text-nowrap">
                              <ValorMonetarioVistoria vistoria={vistoria} />
                            </td>
                            <td className="text-nowrap">
                              <Button 
                                variant="outline-warning" 
                                size="sm" 
                                className="me-1 btn-sm"
                                title="Editar vistoria"
                                style={{ padding: '0.2rem 0.4rem' }}
                                onClick={() => handleEditarVistoria(vistoria)}
                              >
                                <FontAwesomeIcon icon={faEdit} size="sm" />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                className="btn-sm"
                                title="Excluir vistoria"
                                style={{ padding: '0.2rem 0.4rem' }}
                                onClick={() => handleConfirmarExclusao(vistoria)}
                              >
                                <FontAwesomeIcon icon={faTrash} size="sm" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="9" className="text-end"><strong>Total de Valores:</strong></td>
                          <td className="text-nowrap">
                            <TotalValorVistorias vistorias={vistoriasFiltradas} />
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal Nova/Editar Vistoria */}
        <Modal show={showNovaVistoriaModal} onHide={handleCloseNovaVistoriaModal} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>{vistoriaEditando ? 'Editar Vistoria' : 'Nova Vistoria'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMessage && (
              <Alert variant="success">{successMessage}</Alert>
            )}
            
            {errorMessage && (
              <Alert variant="danger">{errorMessage}</Alert>
            )}
            
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Código</Form.Label>
                    <Form.Control
                      type="text"
                      name="codigo"
                      value={vistoriaData.codigo}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.codigo}
                      placeholder="Ex: VST-2025-001"
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.codigo}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data da Vistoria</Form.Label>
                    <Form.Control
                      type="date"
                      name="dataVistoria"
                      value={vistoriaData.dataVistoria}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.dataVistoria}
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.dataVistoria}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Imobiliária</Form.Label>
                    <Form.Select
                      name="imobiliariaId"
                      value={vistoriaData.imobiliariaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.imobiliariaId}
                    >
                      <option value="">Selecione uma imobiliária</option>
                      {imobiliarias.map(imobiliaria => (
                        <option key={imobiliaria.id} value={imobiliaria.id}>
                          {imobiliaria.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.imobiliariaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vistoriador</Form.Label>
                    <Form.Select
                      name="vistoriadorId"
                      value={vistoriaData.vistoriadorId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.vistoriadorId}
                    >
                      <option value="">Selecione um vistoriador</option>
                      {vistoriadores.map(vistoriador => (
                        <option key={vistoriador.id} value={vistoriador.id}>
                          {vistoriador.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.vistoriadorId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Imóvel</Form.Label>
                    <Form.Select
                      name="tipoImovelId"
                      value={vistoriaData.tipoImovelId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoImovelId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposImovel.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoImovelId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Vistoria</Form.Label>
                    <Form.Select
                      name="tipoVistoriaId"
                      value={vistoriaData.tipoVistoriaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoVistoriaId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposVistoria.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoVistoriaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Mobília</Form.Label>
                    <Form.Select
                      name="tipoMobiliaId"
                      value={vistoriaData.tipoMobiliaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoMobiliaId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposMobilia.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoMobiliaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Endereço</Form.Label>
                    <Form.Control
                      type="text"
                      name="endereco"
                      value={vistoriaData.endereco}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.endereco}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.endereco}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Área do Imóvel</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="area"
                        value={vistoriaData.area}
                        onChange={handleVistoriaInputChange}
                        isInvalid={!!vistoriaErrors.area}
                        placeholder="120"
                        min="1"
                        step="0.01"
                      />
                      <InputGroup.Text>m²</InputGroup.Text>
                      <Form.Control.Feedback type="invalid">
                        {vistoriaErrors.area}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Taxa de Deslocamento</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="taxaDeslocamento"
                        value={vistoriaData.taxaDeslocamento}
                        onChange={handleVistoriaInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <InputGroup.Text>créditos</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Valor fixo adicionado ao consumo total (não multiplicado pela área)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="isExpress"
                      checked={vistoriaData.isExpress}
                      onChange={handleVistoriaInputChange}
                      label={
                        <span>
                          <FontAwesomeIcon icon={faBolt} className="text-warning me-1" />
                          Serviço Express
                        </span>
                      }
                    />
                    <Form.Text className="text-muted">
                      Marque esta opção se for um serviço com atendimento prioritário
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Consumo</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={calculateConsumo().toFixed(2)}
                        readOnly
                        className="text-end fw-bold"
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <InputGroup.Text>créditos</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Cálculo automático baseado na área e parâmetros
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Seção de Valor Monetário */}
              {vistoriaData.imobiliariaId && valorUnitarioAtual > 0 && (
                <Row>
                  <Col md={12}>
                    <Alert variant="info" className="text-center">
                      <h5 className="mb-1">
                        <strong>Valor da Vistoria: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(calculateConsumo() * valorUnitarioAtual)}</strong>
                      </h5>
                      <small className="text-muted">
                        {calculateConsumo().toFixed(2)} créditos × {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(valorUnitarioAtual)} (valor unitário mais recente)
                      </small>
                    </Alert>
                  </Col>
                </Row>
              )}

              {/* Alerta caso não haja vendas de crédito */}
              {vistoriaData.imobiliariaId && valorUnitarioAtual === 0 && (
                <Row>
                  <Col md={12}>
                    <Alert variant="warning" className="text-center">
                      <strong>⚠️ Atenção:</strong> Esta imobiliária ainda não possui créditos cadastrados.
                      <br />
                      <small>É necessário realizar uma venda de créditos antes de lançar vistorias.</small>
                    </Alert>
                  </Col>
                </Row>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseNovaVistoriaModal}>
              Cancelar
            </Button>
                            <Button 
                  variant="primary" 
                  onClick={handleSaveVistoria}
                  disabled={salvandoVistoria || imobiliarias.length === 0 || vistoriadores.length === 0}
                >
                  {salvandoVistoria ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={vistoriaEditando ? faEdit : faPlus} className="me-1" />
                      {vistoriaEditando ? 'Atualizar Vistoria' : 'Cadastrar Vistoria'}
                    </>
                  )}
                </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal show={showConfirmExcluir} onHide={() => setShowConfirmExcluir(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar Exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita.
            </Alert>
            <p>
              Deseja realmente excluir a vistoria <strong>{vistoriaParaExcluir?.codigo}</strong>?
            </p>
            <p className="text-muted">
              Os créditos consumidos (<strong>{vistoriaParaExcluir?.consumo_calculado} créditos</strong>) 
              serão automaticamente devolvidos à imobiliária <strong>{vistoriaParaExcluir?.imobiliarias?.nome}</strong>.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmExcluir(false)}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleExcluirVistoria}
              disabled={excluindoVistoria}
            >
              {excluindoVistoria ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Excluindo...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} className="me-1" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};

export default Dashboard; 