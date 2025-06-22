import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';

const Login = ({ autenticar, carregandoAuth }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validação básica
    if (!usuario || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const sucesso = await autenticar(usuario, senha);
      if (sucesso) {
        navigate('/dashboard');
      } else {
        setErro('Usuário ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Erro interno do servidor. Tente novamente.');
    }
  };

  return (
    <Container className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h2>Controle de Vistorias</h2>
          <p>Sistema de gerenciamento de vistorias imobiliárias</p>
        </div>
        <Card.Body className="auth-body">
          <h3 className="text-center mb-4">Login</h3>
          {erro && <Alert variant="danger">{erro}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsuario">
              <Form.Label>Usuário</Form.Label>
              <Form.Control
                type="text"
                placeholder="Seu nome de usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                disabled={carregandoAuth}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formSenha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={carregandoAuth}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={carregandoAuth}>
                {carregandoAuth ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
        <div className="auth-footer">
          <div className="mb-2">
            <Link to="/recuperar-senha">Esqueceu sua senha?</Link>
          </div>
          <div>
            <small className="text-muted">Acesso restrito - Contas criadas pelo administrador</small>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default Login;