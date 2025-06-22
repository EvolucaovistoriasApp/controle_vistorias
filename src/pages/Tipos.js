import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Nav, Tab, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faEye, faHome, faCouch, faClipboard } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { tiposService } from '../lib/supabase';

const Tipos = ({ deslogar, usuarioLogado }) => {
  // Estados para gerenciar os tipos de imóveis
  const [tiposImovel, setTiposImovel] = useState([]);
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  const [errorImoveis, setErrorImoveis] = useState('');

  // Estados para gerenciar os tipos de mobília
  const [tiposMobilia, setTiposMobilia] = useState([]);
  const [loadingMobilia, setLoadingMobilia] = useState(true);
  const [errorMobilia, setErrorMobilia] = useState('');

  // Estados para gerenciar os tipos de vistorias
  const [tiposVistoria, setTiposVistoria] = useState([]);
  const [loadingVistorias, setLoadingVistorias] = useState(true);
  const [errorVistorias, setErrorVistorias] = useState('');

  // Estados para os modais de tipo de imóvel
  const [showModalTipoImovel, setShowModalTipoImovel] = useState(false);
  const [showViewModalTipoImovel, setShowViewModalTipoImovel] = useState(false);
  const [currentTipoImovel, setCurrentTipoImovel] = useState(null);
  const [formDataTipoImovel, setFormDataTipoImovel] = useState({
    nome: '',
    descricao: ''
  });
  const [formErrorsTipoImovel, setFormErrorsTipoImovel] = useState({});
  const [successMessageTipoImovel, setSuccessMessageTipoImovel] = useState('');
  const [savingTipoImovel, setSavingTipoImovel] = useState(false);

  // Estados para os modais de tipo de mobília
  const [showModalTipoMobilia, setShowModalTipoMobilia] = useState(false);
  const [showViewModalTipoMobilia, setShowViewModalTipoMobilia] = useState(false);
  const [currentTipoMobilia, setCurrentTipoMobilia] = useState(null);
  const [formDataTipoMobilia, setFormDataTipoMobilia] = useState({
    nome: '',
    descricao: ''
  });
  const [formErrorsTipoMobilia, setFormErrorsTipoMobilia] = useState({});
  const [successMessageTipoMobilia, setSuccessMessageTipoMobilia] = useState('');

  // Estados para os modais de tipo de vistoria
  const [showModalTipoVistoria, setShowModalTipoVistoria] = useState(false);
  const [showViewModalTipoVistoria, setShowViewModalTipoVistoria] = useState(false);
  const [currentTipoVistoria, setCurrentTipoVistoria] = useState(null);
  const [formDataTipoVistoria, setFormDataTipoVistoria] = useState({
    nome: '',
    descricao: ''
  });
  const [formErrorsTipoVistoria, setFormErrorsTipoVistoria] = useState({});
  const [successMessageTipoVistoria, setSuccessMessageTipoVistoria] = useState('');

  // Estados para edição
  const [editingTipoImovel, setEditingTipoImovel] = useState(null);
  const [editingTipoMobilia, setEditingTipoMobilia] = useState(null);
  const [editingTipoVistoria, setEditingTipoVistoria] = useState(null);
  const [savingMobilia, setSavingMobilia] = useState(false);
  const [savingVistoria, setSavingVistoria] = useState(false);

  // Carregar dados do Supabase
  useEffect(() => {
    carregarTiposImoveis();
    carregarTiposMobilia();
    carregarTiposVistorias();
  }, []);

  // Funções para carregar dados do Supabase
  const carregarTiposImoveis = async () => {
    try {
      setLoadingImoveis(true);
      const result = await tiposService.listarTiposImoveis();
      
      if (result.success) {
        setTiposImovel(result.data);
        setErrorImoveis('');
      } else {
        setErrorImoveis(result.error || 'Erro ao carregar tipos de imóveis');
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de imóveis:', error);
      setErrorImoveis('Erro ao carregar tipos de imóveis');
    } finally {
      setLoadingImoveis(false);
    }
  };

  const carregarTiposMobilia = async () => {
    try {
      setLoadingMobilia(true);
      const result = await tiposService.listarTiposMobilia();
      
      if (result.success) {
        setTiposMobilia(result.data);
        setErrorMobilia('');
      } else {
        setErrorMobilia(result.error || 'Erro ao carregar tipos de mobília');
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de mobília:', error);
      setErrorMobilia('Erro ao carregar tipos de mobília');
    } finally {
      setLoadingMobilia(false);
    }
  };

  const carregarTiposVistorias = async () => {
    try {
      setLoadingVistorias(true);
      const result = await tiposService.listarTiposVistorias();
      
      if (result.success) {
        setTiposVistoria(result.data);
        setErrorVistorias('');
      } else {
        setErrorVistorias(result.error || 'Erro ao carregar tipos de vistorias');
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de vistorias:', error);
      setErrorVistorias('Erro ao carregar tipos de vistorias');
    } finally {
      setLoadingVistorias(false);
    }
  };

  // Funções para manipulação do modal de cadastro de tipo de imóvel
  const handleCloseModalTipoImovel = () => {
    setShowModalTipoImovel(false);
    setFormDataTipoImovel({ nome: '', descricao: '' });
    setFormErrorsTipoImovel({});
    setSuccessMessageTipoImovel('');
    setSavingTipoImovel(false);
    setEditingTipoImovel(null);
  };

  const handleShowModalTipoImovel = () => setShowModalTipoImovel(true);

  // Funções para manipulação do modal de visualização de tipo de imóvel
  const handleCloseViewModalTipoImovel = () => {
    setShowViewModalTipoImovel(false);
    setCurrentTipoImovel(null);
  };

  const handleShowViewModalTipoImovel = (tipoImovel) => {
    setCurrentTipoImovel(tipoImovel);
    setShowViewModalTipoImovel(true);
  };

  // Funções para manipulação do modal de cadastro de tipo de mobília
  const handleCloseModalTipoMobilia = () => {
    setShowModalTipoMobilia(false);
    setFormDataTipoMobilia({ nome: '', descricao: '' });
    setFormErrorsTipoMobilia({});
    setSuccessMessageTipoMobilia('');
    setEditingTipoMobilia(null);
    setSavingMobilia(false);
  };

  const handleShowModalTipoMobilia = () => setShowModalTipoMobilia(true);

  // Funções para manipulação do modal de visualização de tipo de mobília
  const handleCloseViewModalTipoMobilia = () => {
    setShowViewModalTipoMobilia(false);
    setCurrentTipoMobilia(null);
  };

  const handleShowViewModalTipoMobilia = (tipoMobilia) => {
    setCurrentTipoMobilia(tipoMobilia);
    setShowViewModalTipoMobilia(true);
  };

  // Funções para manipulação do modal de cadastro de tipo de vistoria
  const handleCloseModalTipoVistoria = () => {
    setShowModalTipoVistoria(false);
    setFormDataTipoVistoria({ nome: '', descricao: '' });
    setFormErrorsTipoVistoria({});
    setSuccessMessageTipoVistoria('');
    setEditingTipoVistoria(null);
    setSavingVistoria(false);
  };

  const handleShowModalTipoVistoria = () => setShowModalTipoVistoria(true);

  // Funções para manipulação do modal de visualização de tipo de vistoria
  const handleCloseViewModalTipoVistoria = () => {
    setShowViewModalTipoVistoria(false);
    setCurrentTipoVistoria(null);
  };

  const handleShowViewModalTipoVistoria = (tipoVistoria) => {
    setCurrentTipoVistoria(tipoVistoria);
    setShowViewModalTipoVistoria(true);
  };

  // Funções para edição
  const handleEditTipoImovel = (tipoImovel) => {
    setEditingTipoImovel(tipoImovel);
    setFormDataTipoImovel({
      nome: tipoImovel.nome,
      descricao: tipoImovel.descricao
    });
    setShowModalTipoImovel(true);
  };

  const handleEditTipoMobilia = (tipoMobilia) => {
    setEditingTipoMobilia(tipoMobilia);
    setFormDataTipoMobilia({
      nome: tipoMobilia.nome,
      descricao: tipoMobilia.descricao
    });
    setShowModalTipoMobilia(true);
  };

  const handleEditTipoVistoria = (tipoVistoria) => {
    setEditingTipoVistoria(tipoVistoria);
    setFormDataTipoVistoria({
      nome: tipoVistoria.nome,
      descricao: tipoVistoria.descricao
    });
    setShowModalTipoVistoria(true);
  };

  // Função para lidar com mudanças nos campos do formulário de tipo de imóvel
  const handleInputChangeTipoImovel = (e) => {
    const { name, value } = e.target;
    setFormDataTipoImovel({
      ...formDataTipoImovel,
      [name]: value
    });
  };

  // Função para lidar com mudanças nos campos do formulário de tipo de mobília
  const handleInputChangeTipoMobilia = (e) => {
    const { name, value } = e.target;
    setFormDataTipoMobilia({
      ...formDataTipoMobilia,
      [name]: value
    });
  };

  // Função para lidar com mudanças nos campos do formulário de tipo de vistoria
  const handleInputChangeTipoVistoria = (e) => {
    const { name, value } = e.target;
    setFormDataTipoVistoria({
      ...formDataTipoVistoria,
      [name]: value
    });
  };

  // Função para validar o formulário de tipo de imóvel
  const validateFormTipoImovel = () => {
    const errors = {};
    if (!formDataTipoImovel.nome.trim()) errors.nome = 'Nome do tipo de imóvel é obrigatório';
    if (!formDataTipoImovel.descricao.trim()) errors.descricao = 'Descrição é obrigatória';
    
    setFormErrorsTipoImovel(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para validar o formulário de tipo de mobília
  const validateFormTipoMobilia = () => {
    const errors = {};
    if (!formDataTipoMobilia.nome.trim()) errors.nome = 'Nome do tipo de mobília é obrigatório';
    if (!formDataTipoMobilia.descricao.trim()) errors.descricao = 'Descrição é obrigatória';
    
    setFormErrorsTipoMobilia(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para validar o formulário de tipo de vistoria
  const validateFormTipoVistoria = () => {
    const errors = {};
    if (!formDataTipoVistoria.nome.trim()) errors.nome = 'Nome do tipo de vistoria é obrigatório';
    if (!formDataTipoVistoria.descricao.trim()) errors.descricao = 'Descrição é obrigatória';
    
    setFormErrorsTipoVistoria(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar um tipo de imóvel (criação ou edição)
  const handleSaveTipoImovel = async () => {
    if (validateFormTipoImovel()) {
      setSavingTipoImovel(true);
      setFormErrorsTipoImovel({});
      
      try {
        const dadosTipo = {
          nome: formDataTipoImovel.nome.trim(),
          descricao: formDataTipoImovel.descricao.trim()
        };
        
        let result;
        if (editingTipoImovel) {
          // Edição
          result = await tiposService.atualizarTipoImovel(editingTipoImovel.id, dadosTipo);
          if (result.success) {
            setSuccessMessageTipoImovel('Tipo de imóvel atualizado com sucesso!');
          }
        } else {
          // Criação
          result = await tiposService.criarTipoImovel(dadosTipo);
          if (result.success) {
            setSuccessMessageTipoImovel('Tipo de imóvel cadastrado com sucesso!');
          }
        }
        
        if (result.success) {
          // Recarregar a lista de tipos
          await carregarTiposImoveis();
          
          // Fechar modal após sucesso
          setTimeout(() => {
            handleCloseModalTipoImovel();
          }, 1500);
        } else {
          setFormErrorsTipoImovel({ geral: result.error || 'Erro ao salvar tipo de imóvel' });
        }
      } catch (error) {
        console.error('Erro ao salvar tipo de imóvel:', error);
        setFormErrorsTipoImovel({ geral: 'Erro interno. Tente novamente.' });
      } finally {
        setSavingTipoImovel(false);
      }
    }
  };

  // Função para salvar um tipo de mobília (criação ou edição)
  const handleSaveTipoMobilia = async () => {
    if (validateFormTipoMobilia()) {
      setSavingMobilia(true);
      setFormErrorsTipoMobilia({});
      
      try {
        const dadosTipo = {
          nome: formDataTipoMobilia.nome.trim(),
          descricao: formDataTipoMobilia.descricao.trim()
        };
        
        let result;
        if (editingTipoMobilia) {
          // Edição
          result = await tiposService.atualizarTipoMobilia?.(editingTipoMobilia.id, dadosTipo) || 
                   await tiposService.criarTipoMobilia(dadosTipo); // fallback se método não existir
          if (result.success) {
            setSuccessMessageTipoMobilia('Tipo de mobília atualizado com sucesso!');
          }
        } else {
          // Criação
          result = await tiposService.criarTipoMobilia(dadosTipo);
          if (result.success) {
            setSuccessMessageTipoMobilia('Tipo de mobília cadastrado com sucesso!');
          }
        }
        
        if (result.success) {
          // Recarregar a lista de tipos
          await carregarTiposMobilia();
          
          // Fechar modal após sucesso
          setTimeout(() => {
            handleCloseModalTipoMobilia();
          }, 1500);
        } else {
          setFormErrorsTipoMobilia({ geral: result.error || 'Erro ao salvar tipo de mobília' });
        }
      } catch (error) {
        console.error('Erro ao salvar tipo de mobília:', error);
        setFormErrorsTipoMobilia({ geral: 'Erro interno. Tente novamente.' });
      } finally {
        setSavingMobilia(false);
      }
    }
  };

  // Função para salvar um tipo de vistoria (criação ou edição)
  const handleSaveTipoVistoria = async () => {
    if (validateFormTipoVistoria()) {
      setSavingVistoria(true);
      setFormErrorsTipoVistoria({});
      
      try {
        const dadosTipo = {
          nome: formDataTipoVistoria.nome.trim(),
          descricao: formDataTipoVistoria.descricao.trim()
        };
        
        let result;
        if (editingTipoVistoria) {
          // Edição
          result = await tiposService.atualizarTipoVistoria?.(editingTipoVistoria.id, dadosTipo) || 
                   await tiposService.criarTipoVistoria(dadosTipo); // fallback se método não existir
          if (result.success) {
            setSuccessMessageTipoVistoria('Tipo de vistoria atualizado com sucesso!');
          }
        } else {
          // Criação
          result = await tiposService.criarTipoVistoria(dadosTipo);
          if (result.success) {
            setSuccessMessageTipoVistoria('Tipo de vistoria cadastrado com sucesso!');
          }
        }
        
        if (result.success) {
          // Recarregar a lista de tipos
          await carregarTiposVistorias();
          
          // Fechar modal após sucesso
          setTimeout(() => {
            handleCloseModalTipoVistoria();
          }, 1500);
        } else {
          setFormErrorsTipoVistoria({ geral: result.error || 'Erro ao salvar tipo de vistoria' });
        }
      } catch (error) {
        console.error('Erro ao salvar tipo de vistoria:', error);
        setFormErrorsTipoVistoria({ geral: 'Erro interno. Tente novamente.' });
      } finally {
        setSavingVistoria(false);
      }
    }
  };

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid className="py-4">
        <Tab.Container id="tipos-tabs" defaultActiveKey="tipos-imovel">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
              <div>
                <h5 className="mb-0">Tipos</h5>
                <Nav variant="tabs" className="mt-2 border-0 tipos-tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="tipos-imovel" className="text-white">
                      <FontAwesomeIcon icon={faHome} className="me-2" />
                      Tipos de Imóvel
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="tipos-mobilia" className="text-white">
                      <FontAwesomeIcon icon={faCouch} className="me-2" />
                      Tipos de Mobília
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="tipos-vistoria" className="text-white">
                      <FontAwesomeIcon icon={faClipboard} className="me-2" />
                      Tipos de Vistorias
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                <Tab.Pane eventKey="tipos-imovel">
                  <div className="d-flex justify-content-end mb-3">
                    {usuarioLogado?.tipo === 'admin' && (
                      <Button variant="primary" onClick={handleShowModalTipoImovel}>
                        <FontAwesomeIcon icon={faPlus} /> Novo Tipo de Imóvel
                      </Button>
                    )}
                  </div>
                  
                  {errorImoveis && (
                    <Alert variant="danger" className="mb-3">
                      {errorImoveis}
                    </Alert>
                  )}
                  
                  {loadingImoveis ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Carregando...</span>
                      </Spinner>
                      <p className="mt-2">Carregando tipos de imóveis...</p>
                    </div>
                  ) : tiposImovel.length === 0 ? (
                    <Alert variant="info">
                      Nenhum tipo de imóvel cadastrado. {usuarioLogado?.tipo === 'admin' && 'Clique em "Novo Tipo de Imóvel" para adicionar.'}
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nome</th>
                          <th>Descrição</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposImovel.map((tipoImovel, index) => (
                          <tr key={tipoImovel.id} onClick={() => handleShowViewModalTipoImovel(tipoImovel)} style={{ cursor: 'pointer' }}>
                            <td>{index + 1}</td>
                            <td><strong>{tipoImovel.nome}</strong></td>
                            <td>{tipoImovel.descricao}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowViewModalTipoImovel(tipoImovel);
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
                                    handleEditTipoImovel(tipoImovel);
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
                </Tab.Pane>
                
                <Tab.Pane eventKey="tipos-mobilia">
                  <div className="d-flex justify-content-end mb-3">
                    <Button variant="primary" onClick={handleShowModalTipoMobilia}>
                      <FontAwesomeIcon icon={faPlus} /> Novo Tipo de Mobília
                    </Button>
                  </div>
                  
                  {tiposMobilia.length === 0 ? (
                    <Alert variant="info">
                      Nenhum tipo de mobília cadastrado. Clique em "Novo Tipo de Mobília" para adicionar.
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nome</th>
                          <th>Descrição</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposMobilia.map((tipoMobilia, index) => (
                          <tr key={tipoMobilia.id} onClick={() => handleShowViewModalTipoMobilia(tipoMobilia)} style={{ cursor: 'pointer' }}>
                            <td>{index + 1}</td>
                            <td><strong>{tipoMobilia.nome}</strong></td>
                            <td>{tipoMobilia.descricao}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowViewModalTipoMobilia(tipoMobilia);
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTipoMobilia(tipoMobilia);
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="tipos-vistoria">
                  <div className="d-flex justify-content-end mb-3">
                    <Button variant="primary" onClick={handleShowModalTipoVistoria}>
                      <FontAwesomeIcon icon={faPlus} /> Novo Tipo de Vistoria
                    </Button>
                  </div>
                  
                  {tiposVistoria.length === 0 ? (
                    <Alert variant="info">
                      Nenhum tipo de vistoria cadastrado. Clique em "Novo Tipo de Vistoria" para adicionar.
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nome</th>
                          <th>Descrição</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposVistoria.map((tipoVistoria, index) => (
                          <tr key={tipoVistoria.id} onClick={() => handleShowViewModalTipoVistoria(tipoVistoria)} style={{ cursor: 'pointer' }}>
                            <td>{index + 1}</td>
                            <td><strong>{tipoVistoria.nome}</strong></td>
                            <td>{tipoVistoria.descricao}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowViewModalTipoVistoria(tipoVistoria);
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTipoVistoria(tipoVistoria);
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Tab.Container>

        {/* Modal para cadastro de novo tipo de imóvel */}
        <Modal show={showModalTipoImovel} onHide={handleCloseModalTipoImovel}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTipoImovel ? 'Editar Tipo de Imóvel' : 'Novo Tipo de Imóvel'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMessageTipoImovel && (
              <Alert variant="success">{successMessageTipoImovel}</Alert>
            )}
            {formErrorsTipoImovel.geral && (
              <Alert variant="danger">{formErrorsTipoImovel.geral}</Alert>
            )}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Tipo de Imóvel</Form.Label>
                <Form.Control 
                  type="text" 
                  name="nome" 
                  value={formDataTipoImovel.nome}
                  onChange={handleInputChangeTipoImovel}
                  isInvalid={!!formErrorsTipoImovel.nome}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoImovel.nome}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descrição</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="descricao" 
                  value={formDataTipoImovel.descricao}
                  onChange={handleInputChangeTipoImovel}
                  isInvalid={!!formErrorsTipoImovel.descricao}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoImovel.descricao}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseModalTipoImovel}
              disabled={savingTipoImovel}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveTipoImovel}
              disabled={savingTipoImovel}
            >
              {savingTipoImovel ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para visualização de tipo de imóvel */}
        <Modal show={showViewModalTipoImovel} onHide={handleCloseViewModalTipoImovel}>
          <Modal.Header closeButton>
            <Modal.Title>Detalhes do Tipo de Imóvel</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentTipoImovel && (
              <>
                <h5>{currentTipoImovel.nome}</h5>
                <hr />
                <p><strong>Descrição:</strong> {currentTipoImovel.descricao}</p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseViewModalTipoImovel}>
              Fechar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                handleCloseViewModalTipoImovel();
                handleEditTipoImovel(currentTipoImovel);
              }}
            >
              Editar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para cadastro de novo tipo de mobília */}
        <Modal show={showModalTipoMobilia} onHide={handleCloseModalTipoMobilia}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTipoMobilia ? 'Editar Tipo de Mobília' : 'Novo Tipo de Mobília'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMessageTipoMobilia && (
              <Alert variant="success">{successMessageTipoMobilia}</Alert>
            )}
            {formErrorsTipoMobilia.geral && (
              <Alert variant="danger">{formErrorsTipoMobilia.geral}</Alert>
            )}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Tipo de Mobília</Form.Label>
                <Form.Control 
                  type="text" 
                  name="nome" 
                  value={formDataTipoMobilia.nome}
                  onChange={handleInputChangeTipoMobilia}
                  isInvalid={!!formErrorsTipoMobilia.nome}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoMobilia.nome}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descrição</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="descricao" 
                  value={formDataTipoMobilia.descricao}
                  onChange={handleInputChangeTipoMobilia}
                  isInvalid={!!formErrorsTipoMobilia.descricao}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoMobilia.descricao}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseModalTipoMobilia}
              disabled={savingMobilia}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveTipoMobilia}
              disabled={savingMobilia}
            >
              {savingMobilia ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Salvando...
                </>
              ) : (
                editingTipoMobilia ? 'Atualizar' : 'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para visualização de tipo de mobília */}
        <Modal show={showViewModalTipoMobilia} onHide={handleCloseViewModalTipoMobilia}>
          <Modal.Header closeButton>
            <Modal.Title>Detalhes do Tipo de Mobília</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentTipoMobilia && (
              <>
                <h5>{currentTipoMobilia.nome}</h5>
                <hr />
                <p><strong>Descrição:</strong> {currentTipoMobilia.descricao}</p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseViewModalTipoMobilia}>
              Fechar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                handleCloseViewModalTipoMobilia();
                handleEditTipoMobilia(currentTipoMobilia);
              }}
            >
              Editar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para cadastro de novo tipo de vistoria */}
        <Modal show={showModalTipoVistoria} onHide={handleCloseModalTipoVistoria}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTipoVistoria ? 'Editar Tipo de Vistoria' : 'Novo Tipo de Vistoria'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMessageTipoVistoria && (
              <Alert variant="success">{successMessageTipoVistoria}</Alert>
            )}
            {formErrorsTipoVistoria.geral && (
              <Alert variant="danger">{formErrorsTipoVistoria.geral}</Alert>
            )}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Tipo de Vistoria</Form.Label>
                <Form.Control 
                  type="text" 
                  name="nome" 
                  value={formDataTipoVistoria.nome}
                  onChange={handleInputChangeTipoVistoria}
                  isInvalid={!!formErrorsTipoVistoria.nome}
                  placeholder="Ex: Entrada, Saída, Conferência"
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoVistoria.nome}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descrição</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="descricao" 
                  value={formDataTipoVistoria.descricao}
                  onChange={handleInputChangeTipoVistoria}
                  isInvalid={!!formErrorsTipoVistoria.descricao}
                  placeholder="Descreva o tipo de serviço de vistoria"
                />
                <Form.Control.Feedback type="invalid">
                  {formErrorsTipoVistoria.descricao}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseModalTipoVistoria}
              disabled={savingVistoria}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveTipoVistoria}
              disabled={savingVistoria}
            >
              {savingVistoria ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Salvando...
                </>
              ) : (
                editingTipoVistoria ? 'Atualizar' : 'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para visualização de tipo de vistoria */}
        <Modal show={showViewModalTipoVistoria} onHide={handleCloseViewModalTipoVistoria}>
          <Modal.Header closeButton>
            <Modal.Title>Detalhes do Tipo de Vistoria</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentTipoVistoria && (
              <>
                <h5>{currentTipoVistoria.nome}</h5>
                <hr />
                <p><strong>Descrição:</strong> {currentTipoVistoria.descricao}</p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseViewModalTipoVistoria}>
              Fechar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                handleCloseViewModalTipoVistoria();
                handleEditTipoVistoria(currentTipoVistoria);
              }}
            >
              Editar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};

export default Tipos; 