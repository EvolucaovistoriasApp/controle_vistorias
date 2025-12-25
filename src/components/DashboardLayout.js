import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, faTimes, faHome, 
  faBuilding, faHouseUser, faUserTie, 
  faBoxes, faSignOutAlt, faUser, faCalculator, faChartLine, faSync
} from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = ({ children, deslogar, usuarioLogado }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userExplicitlyToggled, setUserExplicitlyToggled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Detectar mudanças no tamanho da tela com debounce
  useEffect(() => {
    let timeoutId = null;
    
    const handleResize = () => {
      // Clear timeout anterior
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce de 150ms para evitar execução excessiva
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth <= 768;
        const wasMobile = isMobile;
        setIsMobile(mobile);
        
        // Só alterar estado da sidebar se houve mudança real de layout
        if (wasMobile !== mobile) {
          if (mobile) {
            // Sempre fechar sidebar no mobile, independente de ação do usuário
            setSidebarOpen(false);
            setUserExplicitlyToggled(false);
          } else {
            // No desktop, abrir sidebar apenas se usuário não fez toggle manual
            if (!userExplicitlyToggled) {
              setSidebarOpen(true);
            }
          }
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar na inicialização

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMobile, userExplicitlyToggled]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Marcar que usuário fez toggle explícito
    setUserExplicitlyToggled(true);
  };

  const navigateTo = (path) => {
    navigate(path);
    // Fechar sidebar ao navegar no mobile
    if (isMobile) {
      setSidebarOpen(false);
      setUserExplicitlyToggled(false);
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
    { path: '/orcamento', icon: faCalculator, label: 'Orçamento', roles: ['admin'] },
    { path: '/balanco', icon: faChartLine, label: 'Balanço', roles: ['admin'] },
    { path: '/processamento-balanco', icon: faSync, label: 'Processar Balanço', roles: ['admin'] },
    { path: '/perfil', icon: faUser, label: 'Meu Perfil', roles: ['admin', 'vistoriador', 'imobiliaria'] }
  ];

  // Filtrar menu items baseado no tipo de usuário
  const menuItems = getAllMenuItems().filter(item => 
    item.roles.includes(usuarioLogado?.tipo || 'admin')
  );

  // Overlay para mobile quando sidebar está aberta
  const renderOverlay = () => {
    // 🔒 Proteção: overlay só aparece no mobile se sidebar foi aberta explicitamente
    if (isMobile && sidebarOpen && userExplicitlyToggled) {
      return (
        <div 
          className="sidebar-overlay" 
          onClick={() => {
            setSidebarOpen(false);
            setUserExplicitlyToggled(false);
          }}
        />
      );
    }
    return null;
  };

  // Sidebar para desktop e mobile
  const renderSidebar = () => {
    // 🔒 Proteção extra: no mobile, sidebar só abre por ação explícita do usuário
    const shouldShowSidebar = isMobile ? (sidebarOpen && userExplicitlyToggled) : sidebarOpen;
    
    return (
      <div className={`sidebar ${shouldShowSidebar ? 'sidebar-open' : ''} ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}`}>
        <div className="sidebar-header">
          <h3>Vistorias</h3>
          <Button 
            variant="link" 
            className="sidebar-toggle" 
            onClick={() => {
              setSidebarOpen(false);
              if (isMobile) {
                setUserExplicitlyToggled(false);
              }
            }}
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

  // Bottom Navigation removida - menu hambúrguer já fornece acesso ao menu

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
    </div>
  );
};

export default DashboardLayout;