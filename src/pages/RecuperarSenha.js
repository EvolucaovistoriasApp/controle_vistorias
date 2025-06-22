import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setCarregando(true);

    // Validação básica
    if (!email) {
      setErro('Por favor, informe seu email.');
      setCarregando(false);
      return;
    }

    // Simulação de tempo de processamento
    setTimeout(() => {
      setSucesso(true);
      setCarregando(false);
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
          <h3 className="text-center mb-4">Recuperar Senha</h3>
          {erro && <Alert variant="danger">{erro}</Alert>}
          {sucesso ? (
            <>
              <Alert variant="success">
                Enviamos um email com instruções para redefinir sua senha. Por favor, verifique sua caixa de entrada.
              </Alert>
              <div className="text-center mt-4">
                <Link to="/" className="btn btn-primary">
                  Voltar para o Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted mb-4">
                Informe seu email cadastrado e enviaremos instruções para redefinir sua senha.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Seu email cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={carregando}>
                    {carregando ? 'Enviando...' : 'Enviar Instruções'}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Card.Body>
        <div className="auth-footer">
          <div>
            Lembrou sua senha? <Link to="/">Voltar para o Login</Link>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default RecuperarSenha;