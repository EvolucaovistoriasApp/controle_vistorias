import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faEye, faCreditCard, faTrash, faEyeSlash, faUser } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { imobiliariasService, creditosService } from '../lib/supabase';

// Componente para mostrar badge de créditos
const CreditosBadge = ({ imobiliariaId }) => {
  const [creditos, setCreditos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarCreditos = async () => {
      try {
        const result = await creditosService.obterResumoCreditos(imobiliariaId);
        if (result.success) {
          setCreditos(result.data.creditosDisponiveis);
        }
      } catch (error) {
        console.error('Erro ao carregar créditos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarCreditos();
  }, [imobiliariaId]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  return (
    <span className={`badge ${creditos > 10 ? 'bg-success' : creditos > 5 ? 'bg-warning' : 'bg-danger'}`}>
      {creditos.toFixed(2)}
    </span>
  );
};

const Imobiliarias = ({ deslogar, usuarioLogado }) => {
  // Estados para gerenciar as imobiliárias e o modal de cadastro
  const [imobiliarias, setImobiliarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [currentImobiliaria, setCurrentImobiliaria] = useState(null);
  const [editingVenda, setEditingVenda] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    contato: '',
    telefone: '',
    usuario: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creditData, setCreditData] = useState({
    quantidade: '',
    valorUnitario: '',
    valorTotal: 0,
    dataVenda: '',
    pagamentos: [{ dataPagamento: '', valorPagamento: '' }]
  });
  const [formErrors, setFormErrors] = useState({});
  const [creditErrors, setCreditErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [creditSuccessMessage, setCreditSuccessMessage] = useState('');
  
  // Novos estados para histórico de créditos
  const [historicoCreditos, setHistoricoCreditos] = useState([]);
  const [resumoCreditos, setResumoCreditos] = useState({
    totalCreditos: 0,
    totalInvestido: 0,
    creditosGastos: 0,
    creditosDisponiveis: 0
  });
  const [loadingCreditos, setLoadingCreditos] = useState(false);

  // Carregar imobiliárias do Supabase
  useEffect(() => {
    carregarImobiliarias();
  }, []);

  const carregarImobiliarias = async () => {
    try {
      setLoading(true);
      const result = await imobiliariasService.listar();
      
      if (result.success) {
        setImobiliarias(result.data);
        setError('');
      } else {
        setError(result.error || 'Erro ao carregar imobiliárias');
      }
    } catch (error) {
      console.error('Erro ao carregar imobiliárias:', error);
      setError('Erro ao carregar imobiliárias');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular valor total dos créditos
  const calcularValorTotal = () => {
    const quantidadeStr = (creditData.quantidade || '').toString().replace(',', '.');
    const valorUnitarioStr = (creditData.valorUnitario || '').toString().replace(',', '.');
    
    const quantidade = parseFloat(quantidadeStr) || 0;
    const valorUnitario = parseFloat(valorUnitarioStr) || 0;
    return quantidade * valorUnitario;
  };

  useEffect(() => {
    const valorTotal = calcularValorTotal();
    
    // Só atualizar se o valor total mudou para evitar loops
    if (valorTotal !== creditData.valorTotal) {
      setCreditData(prev => ({
        ...prev,
        valorTotal: valorTotal
      }));
    }
  }, [creditData.quantidade, creditData.valorUnitario]);

  // Função para obter a data atual formatada para input date
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Funções para manipulação do modal de cadastro
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nome: '', endereco: '', contato: '', telefone: '', usuario: '', senha: '' });
    setFormErrors({});
    setSuccessMessage('');
    setShowPassword(false);
    setSaving(false);
  };

  const handleShowModal = () => setShowModal(true);

  // Funções para manipulação do modal de edição de imobiliária
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentImobiliaria(null);
    setFormData({ nome: '', endereco: '', contato: '', telefone: '', usuario: '', senha: '' });
    setFormErrors({});
    setSuccessMessage('');
    setShowPassword(false);
    setSaving(false);
  };

  const handleShowEditModal = (imobiliaria) => {
    setCurrentImobiliaria(imobiliaria);
    setFormData({
      nome: imobiliaria.nome,
      endereco: imobiliaria.endereco,
      contato: imobiliaria.contato,
      telefone: imobiliaria.telefone,
      usuario: imobiliaria.usuarios?.username || '',
      senha: ''
    });
    setShowEditModal(true);
  };

  // Funções para manipulação do modal de visualização
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setCurrentImobiliaria(null);
    setHistoricoCreditos([]);
    setResumoCreditos({
      totalCreditos: 0,
      totalInvestido: 0,
      creditosGastos: 0,
      creditosDisponiveis: 0
    });
  };

  const handleShowViewModal = async (imobiliaria) => {
    setCurrentImobiliaria(imobiliaria);
    setShowViewModal(true);
    await carregarDadosCreditos(imobiliaria.id);
  };

  // Função para carregar dados de créditos
  const carregarDadosCreditos = async (imobiliariaId) => {
    try {
      setLoadingCreditos(true);
      
      // Carregar histórico de vendas
      const historicoResult = await creditosService.listarVendasCreditos(imobiliariaId);
      if (historicoResult.success) {
        setHistoricoCreditos(historicoResult.data);
      }
      
      // Carregar resumo de créditos
      const resumoResult = await creditosService.obterResumoCreditos(imobiliariaId);
      if (resumoResult.success) {
        setResumoCreditos(resumoResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de créditos:', error);
    } finally {
      setLoadingCreditos(false);
    }
  };

  // Funções para manipulação do modal de créditos
  const handleCloseCreditModal = () => {
    setShowCreditModal(false);
    setEditingVenda(null);
    setCreditData({ 
      quantidade: '', 
      valorUnitario: '', 
      valorTotal: 0,
      dataVenda: getCurrentDate(),
      pagamentos: [{ dataPagamento: getCurrentDate(), valorPagamento: '' }]
    });
    setCreditErrors({});
    setCreditSuccessMessage('');
  };

  const handleShowCreditModal = (imobiliaria) => {
    setCurrentImobiliaria(imobiliaria);
    setEditingVenda(null);
    setCreditData({
      quantidade: '',
      valorUnitario: '',
      valorTotal: 0,
      dataVenda: getCurrentDate(),
      pagamentos: [{ dataPagamento: getCurrentDate(), valorPagamento: '' }]
    });
    setShowCreditModal(true);
    setShowViewModal(false);
  };

  // Função para editar uma venda de créditos
  const handleEditVenda = (venda) => {
    setEditingVenda(venda);
    setCurrentImobiliaria(currentImobiliaria);
    // Detectar se é valor antigo (inteiro) ou novo (centésimos)
    const quantidade = venda.quantidade >= 1000 ? venda.quantidade / 100 : venda.quantidade;
    setCreditData({
      quantidade: quantidade.toString(),
      valorUnitario: venda.valor_unitario.toString(),
      valorTotal: parseFloat(venda.valor_total),
      dataVenda: new Date(venda.data_venda).toISOString().split('T')[0],
      pagamentos: [{ dataPagamento: new Date(venda.data_venda).toISOString().split('T')[0], valorPagamento: venda.valor_total.toString() }]
    });
    setShowCreditModal(true);
    setShowViewModal(false);
  };

  // Função para excluir uma venda de créditos
  const handleDeleteVenda = async (vendaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda de créditos?')) {
      try {
        setSaving(true);
        const result = await creditosService.excluirVendaCreditos(vendaId);
        
        if (result.success) {
          await carregarDadosCreditos(currentImobiliaria.id);
          setCreditSuccessMessage('Venda excluída com sucesso!');
          setTimeout(() => setCreditSuccessMessage(''), 3000);
        } else {
          setCreditErrors({ geral: result.error || 'Erro ao excluir venda' });
        }
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        setCreditErrors({ geral: 'Erro ao excluir venda' });
      } finally {
        setSaving(false);
      }
    }
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Função para lidar com mudanças nos campos de créditos
  const handleCreditInputChange = (e) => {
    const { name, value } = e.target;
    setCreditData({
      ...creditData,
      [name]: value
    });
  };

  // Função para lidar com mudanças nos pagamentos
  const handlePagamentoChange = (index, field, value) => {
    const newPagamentos = [...creditData.pagamentos];
    newPagamentos[index][field] = value;
    setCreditData({
      ...creditData,
      pagamentos: newPagamentos
    });
  };

  // Função para adicionar novo pagamento
  const addPagamento = () => {
    setCreditData({
      ...creditData,
      pagamentos: [...creditData.pagamentos, { dataPagamento: getCurrentDate(), valorPagamento: '' }]
    });
  };

  // Função para remover pagamento
  const removePagamento = (index) => {
    if (creditData.pagamentos.length > 1) {
      const newPagamentos = creditData.pagamentos.filter((_, i) => i !== index);
      setCreditData({
        ...creditData,
        pagamentos: newPagamentos
      });
    }
  };

  // Função para validar o formulário
  const validateForm = () => {
    const errors = {};
    if (!formData.nome.trim()) errors.nome = 'Nome da imobiliária é obrigatório';
    if (!formData.endereco.trim()) errors.endereco = 'Endereço é obrigatório';
    if (!formData.contato.trim()) errors.contato = 'Nome do contato é obrigatório';
    if (!formData.telefone.trim()) errors.telefone = 'Telefone de contato é obrigatório';
    if (!formData.usuario.trim()) errors.usuario = 'Nome de usuário é obrigatório';
    if (!formData.senha.trim()) errors.senha = 'Senha é obrigatória';
    else if (formData.senha.length < 6) errors.senha = 'Senha deve ter pelo menos 6 caracteres';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para validar o formulário de créditos
  const validateCreditForm = () => {
    const errors = {};
    
    // Normalizar valores para validação
    const quantidadeStr = (creditData.quantidade || '').toString().replace(',', '.');
    const valorUnitarioStr = (creditData.valorUnitario || '').toString().replace(',', '.');
    
    if (!creditData.quantidade || parseFloat(quantidadeStr) <= 0) {
      errors.quantidade = 'Quantidade de créditos deve ser maior que zero';
    }
    if (!creditData.valorUnitario || parseFloat(valorUnitarioStr) <= 0) {
      errors.valorUnitario = 'Valor unitário deve ser maior que zero';
    }
    if (!creditData.dataVenda) {
      errors.dataVenda = 'Data da venda é obrigatória';
    }

    // Validar pagamentos apenas se algum campo foi preenchido
    let temPagamentoPreenchido = false;
    let totalPagamentos = 0;
    
    creditData.pagamentos.forEach((pagamento, index) => {
      const temData = pagamento.dataPagamento && pagamento.dataPagamento.trim() !== '';
      const valorStr = pagamento.valorPagamento ? pagamento.valorPagamento.toString().trim() : '';
      const temValor = valorStr !== '' && valorStr !== '0' && valorStr !== '0,00' && parseFloat(valorStr) > 0;
      
      if (temData && temValor) {
        // Só validar se AMBOS os campos estão preenchidos
        temPagamentoPreenchido = true;
        totalPagamentos += parseFloat(valorStr);
      } else if (temData || temValor) {
        // Se apenas um campo está preenchido, validar que o outro também seja preenchido
        if (!temData) {
          errors[`dataPagamento${index}`] = 'Data de pagamento é obrigatória quando valor é informado';
        }
        if (!temValor) {
          errors[`valorPagamento${index}`] = 'Valor de pagamento deve ser maior que zero quando data é informada';
        }
        if (temValor) {
          totalPagamentos += parseFloat(valorStr);
        }
      }
    });

    // Verificar se total dos pagamentos corresponde ao valor total apenas se há pagamentos preenchidos
    const valorTotalCalculado = calcularValorTotal();
    if (temPagamentoPreenchido && Math.abs(totalPagamentos - valorTotalCalculado) > 0.01 && valorTotalCalculado > 0) {
      errors.pagamentos = `Total dos pagamentos (${formatCurrency(totalPagamentos)}) deve ser igual ao valor total (${formatCurrency(valorTotalCalculado)})`;
    }
    
    setCreditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para atualizar uma imobiliária existente
  const handleUpdateImobiliaria = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const dadosImobiliaria = {
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        contato: formData.contato.trim(),
        telefone: formData.telefone.trim()
      };

      const dadosUsuario = {
        usuario: formData.usuario.trim(),
        senha: formData.senha.trim() || null // null se não fornecida
      };

      const result = await imobiliariasService.atualizar(currentImobiliaria.id, dadosImobiliaria, dadosUsuario);

      if (result.success) {
        setSuccessMessage('Imobiliária atualizada com sucesso!');
        
        // Recarregar a lista
        await carregarImobiliarias();
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          handleCloseEditModal();
          setSuccessMessage('');
        }, 2000);
      } else {
        // Verificar se é erro de username duplicado
        if (result.error.includes('username') || result.error.includes('já existe')) {
          setFormErrors({ usuario: 'Este nome de usuário já está em uso' });
        } else {
          setFormErrors({ geral: result.error });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar imobiliária:', error);
      setFormErrors({ geral: 'Erro interno do servidor' });
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar uma nova imobiliária
  const handleSaveImobiliaria = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const dadosImobiliaria = {
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        contato: formData.contato.trim(),
        telefone: formData.telefone.trim()
      };

      const dadosUsuario = {
        usuario: formData.usuario.trim(),
        senha: formData.senha.trim()
      };

      const result = await imobiliariasService.criar(dadosImobiliaria, dadosUsuario);

      if (result.success) {
        setSuccessMessage('Imobiliária e usuário criados com sucesso!');
        
        // Recarregar a lista
        await carregarImobiliarias();
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          handleCloseModal();
          setSuccessMessage('');
        }, 2000);
      } else {
        // Verificar se é erro de username duplicado
        if (result.error.includes('username') || result.error.includes('já existe')) {
          setFormErrors({ usuario: 'Este nome de usuário já está em uso' });
        } else {
          setFormErrors({ geral: result.error });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar imobiliária:', error);
      setFormErrors({ geral: 'Erro interno do servidor' });
    } finally {
      setSaving(false);
    }
  };

  // Função para vender/editar créditos integrada com Supabase
  const handleSellCredits = async () => {
    // Validação básica apenas dos campos obrigatórios
    const errors = {};
    const quantidadeStr = (creditData.quantidade || '').toString().replace(',', '.');
    const valorUnitarioStr = (creditData.valorUnitario || '').toString().replace(',', '.');
    
    if (!creditData.quantidade || parseFloat(quantidadeStr) <= 0) {
      errors.quantidade = 'Quantidade de créditos deve ser maior que zero';
    }
    if (!creditData.valorUnitario || parseFloat(valorUnitarioStr) <= 0) {
      errors.valorUnitario = 'Valor unitário deve ser maior que zero';
    }
    if (!creditData.dataVenda) {
      errors.dataVenda = 'Data da venda é obrigatória';
    }

    // Verificar se há erros básicos
    if (Object.keys(errors).length > 0) {
      setCreditErrors(errors);
      return;
    }

    if (currentImobiliaria) {
      setSaving(true);
      setCreditErrors({});
      
      try {
        const quantidade = parseFloat(quantidadeStr);
        const valorUnitario = parseFloat(valorUnitarioStr);
        const valorTotal = calcularValorTotal();

        // Preparar dados da venda (quantidade armazenada em centésimos para precisão decimal)
        const dadosVenda = {
          imobiliaria_id: currentImobiliaria.id,
          data_venda: creditData.dataVenda,
          quantidade: Math.round(quantidade * 100), // Armazenar em centésimos
          valor_unitario: valorUnitario,
          valor_total: valorTotal
        };

        // Preparar dados dos pagamentos - apenas os que têm dados preenchidos
        const pagamentos = creditData.pagamentos
          .filter(pagamento => {
            const temData = pagamento.dataPagamento && pagamento.dataPagamento.trim() !== '';
            const valorStr = pagamento.valorPagamento ? pagamento.valorPagamento.toString().trim() : '';
            const temValor = valorStr !== '' && valorStr !== '0' && valorStr !== '0,00' && parseFloat(valorStr) > 0;
            return temData && temValor;
          })
          .map(pagamento => ({
            data_pagamento: pagamento.dataPagamento,
            valor_pagamento: parseFloat(pagamento.valorPagamento)
          }));

        let result;
        if (editingVenda) {
          // Atualizar venda existente
          result = await creditosService.atualizarVendaCreditos(editingVenda.id, dadosVenda, pagamentos);
          
          if (result.success) {
            setCreditSuccessMessage(`Venda de ${quantidade} créditos atualizada com sucesso! Total: ${formatCurrency(valorTotal)}`);
          }
        } else {
          // Criar nova venda
          result = await creditosService.criarVendaCreditos(dadosVenda, pagamentos);
          
          if (result.success) {
            setCreditSuccessMessage(`Venda de ${quantidade} créditos registrada com sucesso! Total: ${formatCurrency(valorTotal)}`);
          }
        }
        
        if (result.success) {
          // Recarregar dados de créditos da imobiliária
          await carregarDadosCreditos(currentImobiliaria.id);
          
          // Fechar modal após sucesso
          setTimeout(() => {
            handleCloseCreditModal();
            setShowViewModal(true);
          }, 2000);
        } else {
          setCreditErrors({ geral: result.error || `Erro ao ${editingVenda ? 'atualizar' : 'registrar'} venda de créditos` });
        }
      } catch (error) {
        console.error('Erro ao processar venda:', error);
        setCreditErrors({ geral: 'Erro interno. Tente novamente.' });
      } finally {
        setSaving(false);
      }
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid className="py-4">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
            <h5 className="mb-0">Imobiliárias</h5>
            {usuarioLogado?.tipo === 'admin' && (
              <Button variant="light" size="sm" onClick={handleShowModal}>
                <FontAwesomeIcon icon={faPlus} /> Nova Imobiliária
              </Button>
            )}
          </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
              <p className="mt-2">Carregando imobiliárias...</p>
            </div>
          ) : imobiliarias.length === 0 ? (
            <Alert variant="info">
              Nenhuma imobiliária cadastrada. Clique em "Nova Imobiliária" para adicionar.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Créditos Disponíveis</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {imobiliarias.map((imobiliaria, index) => (
                  <tr key={imobiliaria.id} onClick={() => handleShowViewModal(imobiliaria)} style={{ cursor: 'pointer' }}>
                    <td><strong>{imobiliaria.nome}</strong></td>
                    <td>{imobiliaria.endereco}</td>
                    <td>{imobiliaria.contato}</td>
                    <td>{imobiliaria.telefone}</td>
                    <td>
                      <CreditosBadge imobiliariaId={imobiliaria.id} />
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowViewModal(imobiliaria);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      {usuarioLogado?.tipo === 'admin' && (
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowEditModal(imobiliaria);
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para cadastro de nova imobiliária */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Nova Imobiliária</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {successMessage && (
            <Alert variant="success">{successMessage}</Alert>
          )}
          {formErrors.geral && (
            <Alert variant="danger">{formErrors.geral}</Alert>
          )}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Imobiliária</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="nome" 
                    value={formData.nome}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.nome}
                    disabled={saving}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.nome}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Contato</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="contato" 
                    value={formData.contato}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.contato}
                    disabled={saving}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.contato}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control 
                type="text" 
                name="endereco" 
                value={formData.endereco}
                onChange={handleInputChange}
                isInvalid={!!formErrors.endereco}
                disabled={saving}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.endereco}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefone de Contato</Form.Label>
              <Form.Control 
                type="text" 
                name="telefone" 
                value={formData.telefone}
                onChange={handleInputChange}
                isInvalid={!!formErrors.telefone}
                disabled={saving}
                placeholder="(11) 99999-9999"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.telefone}
              </Form.Control.Feedback>
            </Form.Group>

            <hr />
            <h6 className="text-muted mb-3">Dados de Acesso ao Sistema</h6>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome de Usuário</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="usuario" 
                    value={formData.usuario}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.usuario}
                    disabled={saving}
                    placeholder="nome.usuario"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.usuario}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Será usado para fazer login no sistema
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Senha</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type={showPassword ? "text" : "password"}
                      name="senha" 
                      value={formData.senha}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.senha}
                      disabled={saving}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Button 
                      variant="outline-secondary" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={saving}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.senha}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveImobiliaria} disabled={saving}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Criando...
              </>
            ) : (
              'Criar Imobiliária'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para visualização de imobiliária */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            Detalhes da Imobiliária
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {currentImobiliaria && (
            <>
              {/* Header com informações básicas */}
              <Row className="mb-4">
                <Col>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="py-3">
                      <Row className="align-items-center">
                        <Col md={8}>
                          <h4 className="mb-1 text-primary">{currentImobiliaria.nome}</h4>
                          <div className="text-muted">
                            <p className="mb-1">
                              <strong>Endereço:</strong> {currentImobiliaria.endereco}
                            </p>
                            <Row>
                              <Col md={6}>
                                <strong>Contato:</strong> {currentImobiliaria.contato}
                              </Col>
                              <Col md={6}>
                                <strong>Telefone:</strong> {currentImobiliaria.telefone}
                              </Col>
                            </Row>
                          </div>
                        </Col>
                        <Col md={4} className="text-end">
                          {usuarioLogado?.tipo === 'admin' && (
                            <Button 
                              variant="success" 
                              size="lg"
                              onClick={() => handleShowCreditModal(currentImobiliaria)}
                              className="mb-2"
                            >
                              <FontAwesomeIcon icon={faPlus} /> Vender Créditos
                            </Button>
                          )}
                          <div className="mt-2">
                            <small className="text-muted">Login:</small>
                            <div><code>{currentImobiliaria.usuarios?.username || 'N/A'}</code></div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Cards de resumo de créditos */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-2">
                        <FontAwesomeIcon icon={faCreditCard} className="text-danger fs-2" />
                      </div>
                      <h2 className="text-danger mb-1">
                        {loadingCreditos ? <Spinner animation="border" size="sm" /> : resumoCreditos.creditosGastos}
                      </h2>
                      <h6 className="text-muted mb-0">Créditos Gastos</h6>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-2">
                        <FontAwesomeIcon icon={faCreditCard} className="text-success fs-2" />
                      </div>
                                      <h2 className={`mb-1 ${resumoCreditos.creditosDisponiveis > 10 ? 'text-success' : resumoCreditos.creditosDisponiveis > 5 ? 'text-warning' : 'text-danger'}`}>
                  {loadingCreditos ? <Spinner animation="border" size="sm" /> : resumoCreditos.creditosDisponiveis.toFixed(2)}
                </h2>
                      <h6 className="text-muted mb-0">Créditos Disponíveis</h6>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Histórico de Vendas de Créditos */}
              <Row>
                <Col>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                        Histórico de Vendas de Créditos
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {loadingCreditos ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" variant="info" />
                          <p className="mt-2 text-muted">Carregando histórico...</p>
                        </div>
                      ) : historicoCreditos.length === 0 ? (
                        <div className="text-center py-4">
                          <FontAwesomeIcon icon={faCreditCard} className="text-muted fs-1 mb-3" />
                          <h6 className="text-muted">Nenhuma venda de créditos registrada</h6>
                          <p className="text-muted mb-0">
                            As vendas de créditos aparecerão aqui quando forem registradas.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="table-responsive">
                            <Table hover className="mb-4">
                              <thead className="table-light">
                                <tr>
                                  <th>Data</th>
                                  <th>Quantidade</th>
                                  <th>Valor Unitário</th>
                                  <th>Total</th>
                                  <th width="100">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {historicoCreditos.map((venda, index) => (
                                  <tr key={venda.id}>
                                    <td>
                                      <strong>{formatDate(venda.data_venda)}</strong>
                                    </td>
                                    <td>
                                      <span className="badge bg-primary fs-6">
                                        {(venda.quantidade >= 1000 ? venda.quantidade / 100 : venda.quantidade).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="text-muted">
                                      {formatCurrency(venda.valor_unitario)}
                                    </td>
                                    <td>
                                      <strong className="text-success">
                                        {formatCurrency(venda.valor_total)}
                                      </strong>
                                    </td>
                                    <td>
                                      {usuarioLogado?.tipo === 'admin' && (
                                        <>
                                          <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="me-1"
                                            onClick={() => handleEditVenda(venda)}
                                            title="Editar venda"
                                          >
                                            <FontAwesomeIcon icon={faEdit} />
                                          </Button>
                                          <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => handleDeleteVenda(venda.id)}
                                            title="Excluir venda"
                                            disabled={saving}
                                          >
                                            <FontAwesomeIcon icon={faTrash} />
                                          </Button>
                                        </>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                          
                          {/* Resumo final */}
                          <Row>
                            <Col md={6}>
                              <Card className="border-success">
                                <Card.Body className="text-center">
                                  <h4 className="text-success mb-1">
                                    {historicoCreditos.reduce((total, venda) => {
                                      const quantidade = venda.quantidade >= 1000 ? venda.quantidade / 100 : venda.quantidade;
                                      return total + quantidade;
                                    }, 0).toFixed(2)}
                                  </h4>
                                  <small className="text-muted">Total de Créditos Adquiridos</small>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={6}>
                              <Card className="border-primary">
                                <Card.Body className="text-center">
                                  <h4 className="text-primary mb-1">
                                    {formatCurrency(historicoCreditos.reduce((total, venda) => total + parseFloat(venda.valor_total), 0))}
                                  </h4>
                                  <small className="text-muted">Total Investido</small>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal para venda de créditos */}
      <Modal show={showCreditModal} onHide={handleCloseCreditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingVenda ? 'Editar Venda de Créditos' : 'Vender Créditos'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {creditSuccessMessage && (
            <Alert variant="success">{creditSuccessMessage}</Alert>
          )}
          {creditErrors.geral && (
            <Alert variant="danger">{creditErrors.geral}</Alert>
          )}
          {creditErrors.pagamentos && (
            <Alert variant="danger">{creditErrors.pagamentos}</Alert>
          )}
          {currentImobiliaria && (
            <>
              <Alert variant="info">
                <strong>Imobiliária:</strong> {currentImobiliaria.nome}<br />
                <strong>Usuário:</strong> {currentImobiliaria.usuarios?.username || 'N/A'}<br />
                                    <strong>Créditos Disponíveis:</strong> {resumoCreditos.creditosDisponiveis.toFixed(2)}
              </Alert>
              
              <Form>
                {/* Dados da Venda */}
                <Card className="mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Dados da Venda</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data da Venda</Form.Label>
                          <Form.Control 
                            type="date" 
                            name="dataVenda" 
                            value={creditData.dataVenda}
                            onChange={handleCreditInputChange}
                            isInvalid={!!creditErrors.dataVenda}
                          />
                          <Form.Control.Feedback type="invalid">
                            {creditErrors.dataVenda}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quantidade de Créditos</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="quantidade" 
                            value={creditData.quantidade}
                            onChange={handleCreditInputChange}
                            isInvalid={!!creditErrors.quantidade}
                            min="1"
                            placeholder="Ex: 50"
                          />
                          <Form.Control.Feedback type="invalid">
                            {creditErrors.quantidade}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Valor Unitário</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>R$</InputGroup.Text>
                            <Form.Control 
                              type="number" 
                              name="valorUnitario" 
                              value={creditData.valorUnitario}
                              onChange={handleCreditInputChange}
                              isInvalid={!!creditErrors.valorUnitario}
                              min="0.01"
                              step="0.01"
                              placeholder="Ex: 15.00"
                            />
                            <Form.Control.Feedback type="invalid">
                              {creditErrors.valorUnitario}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Alert variant="primary" className="text-center">
                      <h5 className="mb-0">
                        <strong>Valor Total: {formatCurrency(calcularValorTotal())}</strong>
                      </h5>
                      {creditData.quantidade && creditData.valorUnitario && (
                        <small>
                          {creditData.quantidade} créditos × {formatCurrency(parseFloat(creditData.valorUnitario) || 0)}
                        </small>
                      )}
                    </Alert>
                  </Card.Body>
                </Card>

                {/* Cronograma de Pagamentos */}
                <Card>
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Cronograma de Pagamentos</h6>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={addPagamento}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Adicionar Pagamento
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {creditData.pagamentos.map((pagamento, index) => (
                      <Row key={index} className="mb-3 align-items-center">
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Data de Pagamento {index + 1}</Form.Label>
                            <Form.Control 
                              type="date" 
                              value={pagamento.dataPagamento}
                              onChange={(e) => handlePagamentoChange(index, 'dataPagamento', e.target.value)}
                              isInvalid={!!creditErrors[`dataPagamento${index}`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {creditErrors[`dataPagamento${index}`]}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Valor do Pagamento {index + 1}</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>R$</InputGroup.Text>
                              <Form.Control 
                                type="number" 
                                value={pagamento.valorPagamento}
                                onChange={(e) => handlePagamentoChange(index, 'valorPagamento', e.target.value)}
                                isInvalid={!!creditErrors[`valorPagamento${index}`]}
                                min="0.01"
                                step="0.01"
                                placeholder="0,00"
                              />
                              <Form.Control.Feedback type="invalid">
                                {creditErrors[`valorPagamento${index}`]}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          {creditData.pagamentos.length > 1 && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removePagamento(index)}
                              className="mb-3"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          )}
                        </Col>
                      </Row>
                    ))}
                    
                    {creditData.pagamentos.length > 0 && (
                      <Alert variant="info" className="mt-3">
                        <strong>Total dos Pagamentos:</strong> {formatCurrency(
                          creditData.pagamentos.reduce((total, pagamento) => 
                            total + (parseFloat(pagamento.valorPagamento) || 0), 0
                          )
                        )}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreditModal}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleSellCredits}
            disabled={saving || !creditData.quantidade || !creditData.valorUnitario || calcularValorTotal() <= 0}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Registrando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCreditCard} /> {editingVenda ? 'Atualizar Venda' : 'Registrar Venda'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para edição de imobiliária */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Imobiliária</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {successMessage && (
            <Alert variant="success">{successMessage}</Alert>
          )}
          {formErrors.geral && (
            <Alert variant="danger">{formErrors.geral}</Alert>
          )}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Imobiliária</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="nome" 
                    value={formData.nome}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.nome}
                    disabled={saving}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.nome}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Contato</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="contato" 
                    value={formData.contato}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.contato}
                    disabled={saving}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.contato}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control 
                type="text" 
                name="endereco" 
                value={formData.endereco}
                onChange={handleInputChange}
                isInvalid={!!formErrors.endereco}
                disabled={saving}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.endereco}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefone de Contato</Form.Label>
              <Form.Control 
                type="text" 
                name="telefone" 
                value={formData.telefone}
                onChange={handleInputChange}
                isInvalid={!!formErrors.telefone}
                disabled={saving}
                placeholder="(11) 99999-9999"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.telefone}
              </Form.Control.Feedback>
            </Form.Group>

            <hr />
            <h6 className="text-muted mb-3">Dados de Acesso ao Sistema</h6>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome de Usuário</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="usuario" 
                    value={formData.usuario}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.usuario}
                    disabled={saving}
                    placeholder="nome.usuario"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.usuario}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Será usado para fazer login no sistema
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nova Senha (opcional)</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type={showPassword ? "text" : "password"}
                      name="senha" 
                      value={formData.senha}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.senha}
                      disabled={saving}
                      placeholder="Deixe em branco para manter a atual"
                    />
                    <Button 
                      variant="outline-secondary" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={saving}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.senha}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateImobiliaria} disabled={saving}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Atualizando...
              </>
            ) : (
              'Atualizar Imobiliária'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
    </DashboardLayout>
  );
};

export default Imobiliarias;