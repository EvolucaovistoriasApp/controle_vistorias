import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faBoxes, faEye } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { tiposConsumoService } from '../lib/supabase';

const Consumo = ({ deslogar, usuarioLogado }) => {
  // Estados para gerenciar os tipos de consumo
  const [tiposConsumo, setTiposConsumo] = useState([]);
  const [loading, setLoading] = useState(true);
  

  
  // Estados para o modal de cadastro
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    porcentagem: '',
    descricao: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados para modal de visualização
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentTipo, setCurrentTipo] = useState(null);

  // Carregar dados do Supabase
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const result = await tiposConsumoService.listarTiposConsumo();

      if (result.success) {
        setTiposConsumo(result.data);
      } else {
        console.error('Erro ao carregar tipos de consumo:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };



  // Funções para manipulação do modal de cadastro
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nome: '',
      porcentagem: '',
      descricao: ''
    });
    setFormErrors({});
    setSuccessMessage('');
    setEditingTipo(null);
    setSaving(false);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  // Função para edição
  const handleEditTipo = (tipo) => {
    setEditingTipo(tipo);
    setFormData({
      nome: tipo.nome,
      porcentagem: tipo.porcentagem.toString(),
      descricao: tipo.descricao
    });
    setShowModal(true);
  };

  // Funções para modal de visualização
  const handleShowViewModal = (tipo) => {
    setCurrentTipo(tipo);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setCurrentTipo(null);
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação para porcentagem (aceitar apenas números)
    if (name === 'porcentagem') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Função para validar o formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome do tipo de consumo é obrigatório';
    }
    
    if (!formData.porcentagem && formData.porcentagem !== '0') {
      errors.porcentagem = 'Porcentagem é obrigatória';
    } else if (isNaN(parseFloat(formData.porcentagem)) || parseFloat(formData.porcentagem) < 0) {
      errors.porcentagem = 'Porcentagem deve ser um número válido maior ou igual a zero';
    }
    
    if (!formData.descricao.trim()) {
      errors.descricao = 'Descrição é obrigatória';
    }
    
    // Verificar se nome já existe (apenas na criação ou se alterou o nome na edição)
    if (!editingTipo || (editingTipo && editingTipo.nome !== formData.nome.trim())) {
      const nomeJaExiste = tiposConsumo.some(t => 
        t.nome.toLowerCase() === formData.nome.trim().toLowerCase()
      );
      if (nomeJaExiste) {
        errors.nome = 'Já existe um tipo de consumo com este nome';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar um tipo de consumo
  const handleSaveTipoConsumo = async () => {
    if (validateForm()) {
      setSaving(true);
      setFormErrors({});

      try {
        const dadosTipo = {
          nome: formData.nome.trim(),
          porcentagem: parseFloat(formData.porcentagem),
          descricao: formData.descricao.trim()
        };

        let result;
        if (editingTipo) {
          // Edição
          result = await tiposConsumoService.atualizarTipoConsumo(editingTipo.id, dadosTipo);
          if (result.success) {
            setSuccessMessage('Tipo de consumo atualizado com sucesso!');
          }
        } else {
          // Criação
          result = await tiposConsumoService.criarTipoConsumo(dadosTipo);
          if (result.success) {
            setSuccessMessage('Tipo de consumo cadastrado com sucesso!');
          }
        }

        if (result.success) {
          // Recarregar dados
          await carregarDados();
          
          // Fechar modal após sucesso
          setTimeout(() => {
            handleCloseModal();
          }, 1500);
        } else {
          setFormErrors({ geral: result.error || 'Erro ao salvar tipo de consumo' });
        }
      } catch (error) {
        console.error('Erro ao salvar tipo de consumo:', error);
        setFormErrors({ geral: 'Erro interno. Tente novamente.' });
      } finally {
        setSaving(false);
      }
    }
  };

  // Função para formatar porcentagem
  const formatPercentage = (value) => {
    return `${value}%`;
  };



  if (loading) {
    return (
      <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando tipos de consumo...</p>
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
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="text-primary mb-0">
                      <FontAwesomeIcon icon={faBoxes} className="me-2" />
                      Consumo de Crédito
                    </h4>
                    <small className="text-muted">
                      Total: {tiposConsumo.length} tipos de consumo cadastrados
                    </small>
                  </div>
                  <Button variant="success" onClick={handleShowModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Novo Tipo de Consumo
                  </Button>
                </div>



                {/* Tabela de tipos de consumo */}
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Tipo</th>
                        <th>Porcentagem</th>
                        <th>Descrição</th>
                        <th width="120">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiposConsumo.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-4">
                            Nenhum tipo de consumo cadastrado
                          </td>
                        </tr>
                      ) : (
                        tiposConsumo.map((tipoConsumo) => (
                          <tr key={tipoConsumo.id} onClick={() => handleShowViewModal(tipoConsumo)} style={{ cursor: 'pointer' }}>
                            <td>
                              <strong>{tipoConsumo.nome}</strong>
                            </td>
                            <td>
                              <Badge bg="primary">
                                {formatPercentage(tipoConsumo.porcentagem)}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {tipoConsumo.descricao}
                              </small>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowViewModal(tipoConsumo);
                                }}
                                title="Visualizar"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTipo(tipoConsumo);
                                }}
                                title="Editar"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal para cadastro/edição de tipo de consumo */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBoxes} className="me-2" />
            {editingTipo ? 'Editar Tipo de Consumo' : 'Cadastrar Novo Tipo de Consumo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}

          {formErrors.geral && (
            <Alert variant="danger" className="mb-3">
              {formErrors.geral}
            </Alert>
          )}
          
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Tipo de Consumo</Form.Label>
                  <Form.Control
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.nome}
                    placeholder="Ex: Express, Mobiliado, Semi Mobiliado, etc."
                    list="tipos-sugeridos"
                  />
                  <datalist id="tipos-sugeridos">
                    {tiposConsumo.map(tipo => (
                      <option key={tipo.id} value={tipo.nome} />
                    ))}
                    <option value="Express" />
                    <option value="Mobiliado" />
                    <option value="Semi Mobiliado" />
                    <option value="Vazio" />
                    <option value="Super Mobiliado" />
                    <option value="Urgente" />
                    <option value="Feriado" />
                    <option value="Fim de Semana" />
                  </datalist>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.nome}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Digite um nome personalizado ou escolha uma das sugestões
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Porcentagem (%)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="porcentagem"
                      value={formData.porcentagem}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.porcentagem}
                      placeholder="Ex: 25"
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                    <Form.Control.Feedback type="invalid">
                      {formErrors.porcentagem}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                isInvalid={!!formErrors.descricao}
                placeholder="Descreva quando este tipo de consumo deve ser aplicado..."
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.descricao}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveTipoConsumo}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                {editingTipo ? 'Atualizar Tipo de Consumo' : 'Cadastrar Tipo de Consumo'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para visualização de tipo de consumo */}
      <Modal show={showViewModal} onHide={handleCloseViewModal}>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes do Tipo de Consumo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTipo && (
            <>
              <h5>{currentTipo.nome}</h5>
              <hr />
              <p><strong>Porcentagem:</strong> <Badge bg="primary">{formatPercentage(currentTipo.porcentagem)}</Badge></p>
              <p><strong>Descrição:</strong> {currentTipo.descricao}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewModal}>
            Fechar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              handleCloseViewModal();
              handleEditTipo(currentTipo);
            }}
          >
            Editar
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default Consumo;