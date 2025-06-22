import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faEye, faSearch, faUserTie, faPhone, faEnvelope, faIdCard, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { vistoriadoresService, authService } from '../lib/supabase';

const Vistoriadores = ({ deslogar, usuarioLogado }) => {
  // Estados para gerenciar os vistoriadores
  const [vistoriadores, setVistoriadores] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  
  // Estados para filtros e busca
  const [filtroTexto, setFiltroTexto] = useState('');
  
  // Estados para o modal de cadastro
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentVistoriador, setCurrentVistoriador] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    dataAdmissao: '',
    status: 'Ativo',
    // Campos de autenticação
    usuario: '',
    senha: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [carregandoSalvar, setCarregandoSalvar] = useState(false);

  // Carregar vistoriadores ao montar o componente
  useEffect(() => {
    carregarVistoriadores();
  }, []);

  const carregarVistoriadores = async () => {
    setCarregandoLista(true);
    try {
      const result = await vistoriadoresService.listar();
      if (result.success) {
        setVistoriadores(result.data);
      } else {
        console.error('Erro ao carregar vistoriadores:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar vistoriadores:', error);
    } finally {
      setCarregandoLista(false);
    }
  };

  // Função para obter a data atual formatada para input date
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Função para filtrar vistoriadores
  const vistoriadoresFiltrados = vistoriadores.filter(vistoriador => {
    const textoFiltro = filtroTexto.toLowerCase();
    
    return (
      vistoriador.nome.toLowerCase().includes(textoFiltro) ||
      vistoriador.cpf.toLowerCase().includes(textoFiltro) ||
      vistoriador.telefone.toLowerCase().includes(textoFiltro) ||
      vistoriador.email.toLowerCase().includes(textoFiltro) ||
      vistoriador.endereco.toLowerCase().includes(textoFiltro)
    );
  });

  // Funções para manipulação do modal de cadastro
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      endereco: '',
      dataAdmissao: '',
      status: 'Ativo',
      usuario: '',
      senha: ''
    });
    setFormErrors({});
    setSuccessMessage('');
  };

  const handleShowModal = () => {
    setFormData({
      ...formData,
      dataAdmissao: getCurrentDate()
    });
    setShowModal(true);
  };

  // Funções para manipulação do modal de visualização
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setCurrentVistoriador(null);
  };

  const handleShowViewModal = (vistoriador) => {
    setCurrentVistoriador(vistoriador);
    setShowViewModal(true);
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação automática para CPF
    if (name === 'cpf') {
      const cpfFormatted = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
      
      setFormData({
        ...formData,
        [name]: cpfFormatted
      });
      return;
    }
    
    // Formatação automática para telefone
    if (name === 'telefone') {
      const phoneFormatted = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
      
      setFormData({
        ...formData,
        [name]: phoneFormatted
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Função para validar CPF
  const isValidCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Função para validar o formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!isValidCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }
    if (!formData.telefone.trim()) errors.telefone = 'Telefone é obrigatório';
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }
    if (!formData.endereco.trim()) errors.endereco = 'Endereço é obrigatório';
    if (!formData.dataAdmissao) errors.dataAdmissao = 'Data de admissão é obrigatória';
    
    // Validação dos campos de login
    if (!formData.usuario.trim()) {
      errors.usuario = 'Nome de usuário é obrigatório';
    } else if (formData.usuario.length < 3) {
      errors.usuario = 'Nome de usuário deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.usuario)) {
      errors.usuario = 'Nome de usuário pode conter apenas letras, números e underscore';
    }
    
    if (!formData.senha.trim()) {
      errors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 4) {
      errors.senha = 'Senha deve ter pelo menos 4 caracteres';
    }
    
    // Verificar se CPF já existe (exceto para o próprio registro em caso de edição)
    const cpfExists = vistoriadores.some(v => 
      v.cpf === formData.cpf && v.id !== (currentVistoriador?.id)
    );
    if (cpfExists) {
      errors.cpf = 'CPF já cadastrado';
    }
    
    // Verificar se e-mail já existe (exceto para o próprio registro em caso de edição)
    const emailExists = vistoriadores.some(v => 
      v.email.toLowerCase() === formData.email.toLowerCase() && v.id !== (currentVistoriador?.id)
    );
    if (emailExists) {
      errors.email = 'E-mail já cadastrado';
    }
    
    // A verificação de username será feita no backend/Supabase
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar um novo vistoriador
  const handleSaveVistoriador = async () => {
    if (validateForm()) {
      setCarregandoSalvar(true);
      try {
        const dadosVistoriador = {
          nome: formData.nome,
          cpf: formData.cpf,
          telefone: formData.telefone,
          email: formData.email,
          endereco: formData.endereco,
          dataAdmissao: formData.dataAdmissao,
          status: formData.status
        };

        const dadosUsuario = {
          usuario: formData.usuario,
          senha: formData.senha
        };

        const result = await vistoriadoresService.criar(dadosVistoriador, dadosUsuario);
        if (result.success) {
          await carregarVistoriadores(); // Recarregar lista
          setSuccessMessage('Vistoriador cadastrado com sucesso!');
          
          // Limpar o formulário e fechar o modal após um breve delay
          setTimeout(() => {
            handleCloseModal();
          }, 1500);
        } else {
          setFormErrors({ geral: result.error });
        }
      } catch (error) {
        console.error('Erro ao cadastrar vistoriador:', error);
        setFormErrors({ geral: 'Erro interno do servidor. Tente novamente.' });
      } finally {
        setCarregandoSalvar(false);
      }
    }
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para calcular tempo de trabalho
  const calculateWorkTime = (dataAdmissao) => {
    const admissao = new Date(dataAdmissao);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - admissao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} dias`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
      }
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
    }
  };

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
                      <FontAwesomeIcon icon={faUserTie} className="me-2" />
                      Lista de Vistoriadores
                    </h4>
                    <small className="text-muted">
                      Total: {vistoriadoresFiltrados.length} vistoriadores cadastrados
                    </small>
                  </div>
                  <Button variant="success" onClick={handleShowModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Novo Vistoriador
                  </Button>
                </div>

                {/* Campo de busca */}
                <Row className="mb-3">
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faSearch} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Pesquisar por nome, CPF, telefone, e-mail ou endereço..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                </Row>

                {/* Tabela de vistoriadores */}
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Telefone</th>
                        <th>E-mail</th>
                        <th>Data de Admissão</th>
                        <th>Tempo de Trabalho</th>
                        <th>Status</th>
                        <th width="120">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vistoriadoresFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
                            {filtroTexto ? 'Nenhum vistoriador encontrado com os critérios de busca' : 'Nenhum vistoriador cadastrado'}
                          </td>
                        </tr>
                      ) : (
                        vistoriadoresFiltrados.map((vistoriador) => (
                          <tr key={vistoriador.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faUserTie} className="text-primary me-2" />
                                <strong>{vistoriador.nome}</strong>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faIdCard} className="me-1" />
                                {vistoriador.cpf}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faPhone} className="me-1" />
                                {vistoriador.telefone}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                {vistoriador.email}
                              </small>
                            </td>
                            <td>{formatDate(vistoriador.dataAdmissao)}</td>
                            <td>
                              <small className="text-success fw-bold">
                                {calculateWorkTime(vistoriador.dataAdmissao)}
                              </small>
                            </td>
                            <td>
                              <span className={`badge bg-${vistoriador.status === 'Ativo' ? 'success' : 'secondary'}`}>
                                {vistoriador.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleShowViewModal(vistoriador)}
                                  title="Visualizar"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </div>
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

      {/* Modal para cadastro de novo vistoriador */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUserTie} className="me-2" />
            Cadastrar Novo Vistoriador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}
          
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome Completo</Form.Label>
                  <Form.Control
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.nome}
                    placeholder="Digite o nome completo"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.nome}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CPF</Form.Label>
                  <Form.Control
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.cpf}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.cpf}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.telefone}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.telefone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.email}
                    placeholder="exemplo@email.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Admissão</Form.Label>
                  <Form.Control
                    type="date"
                    name="dataAdmissao"
                    value={formData.dataAdmissao}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.dataAdmissao}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.dataAdmissao}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Endereço Completo</Form.Label>
              <Form.Control
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                isInvalid={!!formErrors.endereco}
                placeholder="Rua, número, bairro, cidade - CEP"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.endereco}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Seção de Dados de Acesso */}
            <hr />
            <h6 className="text-primary mb-3">
              <FontAwesomeIcon icon={faUserTie} className="me-2" />
              Dados de Acesso ao Sistema
            </h6>
            
            {formErrors.geral && (
              <Alert variant="danger" className="mb-3">
                {formErrors.geral}
              </Alert>
            )}

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
                    placeholder="Digite o nome de usuário"
                    disabled={carregandoSalvar}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.usuario}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Apenas letras, números e underscore. Mínimo 3 caracteres.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Senha</Form.Label>
                  <Form.Control
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.senha}
                    placeholder="Digite a senha"
                    disabled={carregandoSalvar}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.senha}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Mínimo 4 caracteres.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveVistoriador} disabled={carregandoSalvar}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            {carregandoSalvar ? 'Cadastrando...' : 'Cadastrar Vistoriador'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para visualização de vistoriador */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEye} className="me-2" />
            Detalhes do Vistoriador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentVistoriador && (
            <div>
              <Row className="mb-3">
                <Col md={8}>
                  <h5 className="text-primary">
                    <FontAwesomeIcon icon={faUserTie} className="me-2" />
                    {currentVistoriador.nome}
                  </h5>
                  <p className="text-muted mb-1">
                    <FontAwesomeIcon icon={faIdCard} className="me-2" />
                    CPF: {currentVistoriador.cpf}
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <span className={`badge bg-${currentVistoriador.status === 'Ativo' ? 'success' : 'secondary'} fs-6`}>
                    {currentVistoriador.status}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="py-2">
                      <h6 className="text-muted mb-1">Contato</h6>
                      <p className="mb-1">
                        <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                        {currentVistoriador.telefone}
                      </p>
                      <p className="mb-0">
                        <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                        {currentVistoriador.email}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="py-2">
                      <h6 className="text-muted mb-1">Trabalho</h6>
                      <p className="mb-1">
                        <strong>Admissão:</strong> {formatDate(currentVistoriador.dataAdmissao)}
                      </p>
                      <p className="mb-0">
                        <strong>Tempo:</strong> <span className="text-success">{calculateWorkTime(currentVistoriador.dataAdmissao)}</span>
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div>
                <h6 className="text-muted mb-2">Endereço</h6>
                <p className="mb-0">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                  {currentVistoriador.endereco}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewModal}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default Vistoriadores;