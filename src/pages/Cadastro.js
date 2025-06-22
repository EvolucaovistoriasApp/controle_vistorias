import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';

const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setCarregando(true);

    // Validação básica
    if (!nome || !email || !senha || !confirmarSenha) {
      setErro('Por favor, preencha todos os campos.');
      setCarregando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      setCarregando(false);
      return;
    }

    // Simulação de tempo de processamento
    setTimeout(() => {
      setSucesso(true);
      setCarregando(false);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 1500);
  };

  return (
    <Container className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h2>Controle de Vistorias</h2>
          <p>Sistema de gerenciamento de vistorias imobiliárias</p>
        </div>
        <Card.Body className="auth-body">
          <h3 className="text-center mb-4">Criar Conta</h3>
          {erro && <Alert variant="danger">{erro}</Alert>}
          {sucesso && (
            <Alert variant="success">
              Cadastro realizado com sucesso! Redirecionando para o login...
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formNome">
              <Form.Label>Nome Completo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formSenha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formConfirmarSenha">
              <Form.Label>Confirmar Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirme sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={carregando || sucesso}>
                {carregando ? 'Processando...' : 'Cadastrar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
        <div className="auth-footer">
          <div>
            Já tem uma conta? <Link to="/">Faça login</Link>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default Cadastro;