import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../lib/supabase';

const Perfil = ({ deslogar, usuarioLogado }) => {
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo específico quando o usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.senhaAtual) {
      errors.senhaAtual = 'Senha atual é obrigatória';
    }
    
    if (!formData.novaSenha) {
      errors.novaSenha = 'Nova senha é obrigatória';
    } else if (formData.novaSenha.length < 4) {
      errors.novaSenha = 'Nova senha deve ter pelo menos 4 caracteres';
    }
    
    if (!formData.confirmarSenha) {
      errors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      errors.confirmarSenha = 'Senhas não coincidem';
    }
    
    if (formData.senhaAtual === formData.novaSenha) {
      errors.novaSenha = 'A nova senha deve ser diferente da senha atual';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setCarregando(true);
    
    try {
      const result = await authService.alterarSenha(
        usuarioLogado.id,
        formData.senhaAtual,
        formData.novaSenha
      );
      
      if (result.success) {
        setSuccessMessage('Senha alterada com sucesso!');
        setFormData({
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        });
        setFormErrors({});
        
        // Limpar a mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setFormErrors({ senhaAtual: result.error });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setFormErrors({ senhaAtual: 'Erro interno do servidor. Tente novamente.' });
    } finally {
      setCarregando(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'atual':
        setShowSenhaAtual(!showSenhaAtual);
        break;
      case 'nova':
        setShowNovaSenha(!showNovaSenha);
        break;
      case 'confirmar':
        setShowConfirmarSenha(!showConfirmarSenha);
        break;
      default:
        break;
    }
  };

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid className="py-4">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Meu Perfil
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Informações do Usuário */}
                <div className="mb-4">
                  <Card className="bg-light">
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <p className="mb-2">
                            <strong>Nome de Usuário:</strong><br />
                            <span className="text-primary fs-5">{usuarioLogado?.username}</span>
                          </p>
                        </Col>
                        <Col md={6}>
                          <p className="mb-2">
                            <strong>Nome Completo:</strong><br />
                            <span className="text-secondary">{usuarioLogado?.nome}</span>
                          </p>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <p className="mb-0">
                            <strong>Tipo de Conta:</strong><br />
                            <span className={`badge ${usuarioLogado?.tipo === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                              {usuarioLogado?.tipo === 'admin' ? 'Administrador' : 
                               usuarioLogado?.tipo === 'vistoriador' ? 'Vistoriador' : 'Imobiliária'}
                            </span>
                          </p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </div>

                {/* Formulário de Alteração de Senha */}
                <div>
                  <h6 className="mb-3">
                    <FontAwesomeIcon icon={faKey} className="me-2" />
                    Alterar Senha
                  </h6>
                  
                  {successMessage && (
                    <Alert variant="success" className="mb-3">
                      {successMessage}
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Senha Atual</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showSenhaAtual ? 'text' : 'password'}
                              name="senhaAtual"
                              value={formData.senhaAtual}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.senhaAtual}
                              placeholder="Digite sua senha atual"
                              disabled={carregando}
                            />
                            <Button
                              variant="link"
                              className="position-absolute top-50 end-0 translate-middle-y border-0 p-2"
                              onClick={() => togglePasswordVisibility('atual')}
                              style={{ zIndex: 10 }}
                              disabled={carregando}
                            >
                              <FontAwesomeIcon icon={showSenhaAtual ? faEyeSlash : faEye} />
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {formErrors.senhaAtual}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nova Senha</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showNovaSenha ? 'text' : 'password'}
                              name="novaSenha"
                              value={formData.novaSenha}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.novaSenha}
                              placeholder="Digite a nova senha"
                              disabled={carregando}
                            />
                            <Button
                              variant="link"
                              className="position-absolute top-50 end-0 translate-middle-y border-0 p-2"
                              onClick={() => togglePasswordVisibility('nova')}
                              style={{ zIndex: 10 }}
                              disabled={carregando}
                            >
                              <FontAwesomeIcon icon={showNovaSenha ? faEyeSlash : faEye} />
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {formErrors.novaSenha}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirmar Nova Senha</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showConfirmarSenha ? 'text' : 'password'}
                              name="confirmarSenha"
                              value={formData.confirmarSenha}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.confirmarSenha}
                              placeholder="Confirme a nova senha"
                              disabled={carregando}
                            />
                            <Button
                              variant="link"
                              className="position-absolute top-50 end-0 translate-middle-y border-0 p-2"
                              onClick={() => togglePasswordVisibility('confirmar')}
                              style={{ zIndex: 10 }}
                              disabled={carregando}
                            >
                              <FontAwesomeIcon icon={showConfirmarSenha ? faEyeSlash : faEye} />
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {formErrors.confirmarSenha}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end">
                      <Button variant="primary" type="submit" className="px-4" disabled={carregando}>
                        <FontAwesomeIcon icon={faKey} className="me-2" />
                        {carregando ? 'Alterando...' : 'Alterar Senha'}
                      </Button>
                    </div>
                  </Form>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default Perfil; 