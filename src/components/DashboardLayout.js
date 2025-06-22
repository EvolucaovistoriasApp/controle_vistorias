import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, faTimes, faHome, 
  faBuilding, faHouseUser, faUserTie, 
  faBoxes, faSignOutAlt, faUser
} from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = ({ children, deslogar, usuarioLogado }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const location = useLocation();

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Automaticamente fechar sidebar no mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar na inicialização

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigateTo = (path) => {
    navigate(path);
    // Fechar sidebar ao navegar no mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Verificar se a rota atual corresponde ao caminho fornecido
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Menu items para reutilização baseado no tipo de usuário
  const getAllMenuItems = () => [
    { path: '/dashboard', icon: faHome, label: 'Dashboard', roles: ['admin', 'vistoriador', 'imobiliaria'] },
    { path: '/imobiliarias', icon: faBuilding, label: 'Imobiliárias', roles: ['admin'] },
    { path: '/tipos', icon: faHouseUser, label: 'Tipos', roles: ['admin'] },
    { path: '/vistoriadores', icon: faUserTie, label: 'Vistoriadores', roles: ['admin'] },
    { path: '/consumo', icon: faBoxes, label: 'Consumo', roles: ['admin'] },
    { path: '/perfil', icon: faUser, label: 'Meu Perfil', roles: ['admin', 'vistoriador', 'imobiliaria'] }
  ];

  // Filtrar menu items baseado no tipo de usuário
  const menuItems = getAllMenuItems().filter(item => 
    item.roles.includes(usuarioLogado?.tipo || 'admin')
  );

  // Overlay para mobile quando sidebar está aberta
  const renderOverlay = () => {
    if (isMobile && sidebarOpen) {
      return (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      );
    }
    return null;
  };

  // Sidebar para desktop e mobile
  const renderSidebar = () => {
    return (
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}`}>
        <div className="sidebar-header">
          <h3>Vistorias</h3>
          <Button 
            variant="link" 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
        <div className="sidebar-menu">
          <Nav className="flex-column">
            {menuItems.map((item) => (
              <Nav.Link 
                key={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigateTo(item.path)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Nav.Link>
            ))}
            
            {/* Botão de logout apenas na sidebar */}
            <Nav.Link 
              className="sidebar-item logout-item"
              onClick={deslogar}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Sair</span>
            </Nav.Link>
          </Nav>
        </div>
      </div>
    );
  };

  // Bottom Navigation para mobile
  const renderBottomNavigation = () => {
    if (!isMobile) return null;

    return (
      <div className="bottom-navigation">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigateTo(item.path)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`dashboard-wrapper ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
      {/* Overlay para mobile */}
      {renderOverlay()}
      
      {/* Sidebar */}
      {renderSidebar()}

      {/* Conteúdo principal */}
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-left">
            {(isMobile || !sidebarOpen) && (
              <Button 
                variant="outline-primary" 
                className="sidebar-toggle-btn" 
                onClick={toggleSidebar}
              >
                <FontAwesomeIcon icon={faBars} />
              </Button>
            )}
            <h2>Controle de Vistorias</h2>
          </div>
          
          {/* Botão de logout no header para desktop */}
          {!isMobile && (
            <Button variant="outline-danger" onClick={deslogar}>
              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
              Sair
            </Button>
          )}
          
          {/* Botão de logout no header para mobile */}
          {isMobile && (
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={deslogar}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </Button>
          )}
        </div>

        <div className="dashboard-content">
          {children}
        </div>
      </div>

      {/* Bottom Navigation para mobile */}
      {renderBottomNavigation()}
    </div>
  );
};

export default DashboardLayout;