import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/styles.css';
import { authService } from './lib/supabase';

// Páginas
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Dashboard from './pages/Dashboard';
import Imobiliarias from './pages/Imobiliarias';
import Tipos from './pages/Tipos';
import Vistoriadores from './pages/Vistoriadores';
import Consumo from './pages/Consumo';
import Perfil from './pages/Perfil';

function App() {
  // Estado para verificar se o usuário está autenticado
  const [autenticado, setAutenticado] = React.useState(false);
  const [usuarioLogado, setUsuarioLogado] = React.useState(null);
  const [carregandoAuth, setCarregandoAuth] = React.useState(false);

  // Componente para proteger rotas baseado no tipo de usuário
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!autenticado) {
      return <Navigate to="/" />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(usuarioLogado?.tipo)) {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  };

  // Função para autenticar o usuário com Supabase
  const autenticar = async (username, senha) => {
    setCarregandoAuth(true);
    
    try {
      const result = await authService.login(username, senha);
      
      if (result.success) {
        setAutenticado(true);
        setUsuarioLogado({
          id: result.user.id,
          username: result.user.username,
          nome: result.user.nome_completo,
          tipo: result.user.tipo_usuario
        });
        return true;
      } else {
        console.error('Erro de login:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      return false;
    } finally {
      setCarregandoAuth(false);
    }
  };

  // Função para deslogar
  const deslogar = () => {
    setAutenticado(false);
    setUsuarioLogado(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={autenticado ? <Navigate to="/dashboard" /> : <Login autenticar={autenticar} carregandoAuth={carregandoAuth} />} 
          />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'vistoriador', 'imobiliaria']}>
                <Dashboard deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/imobiliarias" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Imobiliarias deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tipos" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Tipos deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vistoriadores" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Vistoriadores deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/consumo" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Consumo deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/perfil" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'vistoriador', 'imobiliaria']}>
                <Perfil deslogar={deslogar} usuarioLogado={usuarioLogado} />
              </ProtectedRoute>
            } 
          />
          {/* Rota de redirecionamento para manter compatibilidade */}
          <Route 
            path="/imoveis" 
            element={<Navigate to="/tipos" />} 
          />
          {/* Redirecionamento para páginas não autorizadas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
