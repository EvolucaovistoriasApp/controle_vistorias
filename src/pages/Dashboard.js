import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup, Modal, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTrash, faEdit, faBolt, faUserTie, faUsers, faCamera, faExpand, faTimes, faSync, faFilePdf, faMapMarkerAlt, faCalendarAlt, faHome, faRuler, faBox, faBuilding, faFilter, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DashboardLayout from '../components/DashboardLayout';
import { vistoriasService, imobiliariasService, vistoriadoresService, tiposService, tiposConsumoService, creditosService, migrationService, imagensVistoriaService } from '../lib/supabase';

// Hook para detectar se está em mobile
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    
    // Adicionar listener
    mediaQuery.addEventListener('change', handler);
    
    // Verificar imediatamente
    setMatches(mediaQuery.matches);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Componente para upload de imagens da trena a laser
const ImageUploadTrena = ({ imagens, onImagensChange, maxImages = 2 }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - imagens.length;
    
    if (files.length > remainingSlots) {
      alert(`Você pode adicionar no máximo ${remainingSlots} imagem(ns) restante(s).`);
      return;
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    files.forEach(file => {
      // Validar tipo de arquivo
      if (!allowedTypes.includes(file.type)) {
        alert(`Formato não suportado: ${file.name}. Use apenas JPEG, PNG ou WebP.`);
        return;
      }

      // Validar tamanho do arquivo
      if (file.size > maxFileSize) {
        alert(`Arquivo muito grande: ${file.name}. Tamanho máximo: 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const novaImagem = {
          id: Date.now() + Math.random(),
          file: file,
          dataUrl: event.target.result,
          nome: file.name,
          tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        };
        onImagensChange([...imagens, novaImagem]);
      };
      reader.readAsDataURL(file);
    });

    // Limpar o input
    e.target.value = '';
  };

  const removerImagem = async (imageId) => {
    const imagemParaRemover = imagens.find(img => img.id === imageId);
    
    // Se for uma imagem que veio do banco de dados, excluir do servidor
    if (imagemParaRemover && imagemParaRemover.fromDatabase) {
      if (window.confirm('Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.')) {
        try {
          // Aqui você pode implementar a exclusão individual no servidor se necessário
          // Por enquanto, apenas remove do estado local
          onImagensChange(imagens.filter(img => img.id !== imageId));
        } catch (error) {
          console.error('Erro ao remover imagem:', error);
          alert('Erro ao remover imagem. Tente novamente.');
        }
      }
    } else {
      // Para imagens novas (ainda não salvas), apenas remove do estado
      onImagensChange(imagens.filter(img => img.id !== imageId));
    }
  };

  const visualizarImagem = (imagem) => {
    setSelectedImage(imagem);
    setShowImageModal(true);
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label className="small text-muted">
          <FontAwesomeIcon icon={faCamera} className="me-1" />
          Imagens da Trena a Laser (Máximo {maxImages})
        </Form.Label>
        
        {/* Área de upload compacta */}
        <div className="border border-1 border-dashed rounded p-2 text-center" style={{ backgroundColor: '#f8f9fa' }}>
          {imagens.length < maxImages && (
            <div className="mb-2">
              <input
                type="file"
                id="imageUpload"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => document.getElementById('imageUpload').click()}
                className="btn-sm px-2 py-1"
              >
                <FontAwesomeIcon icon={faCamera} className="me-1" size="sm" />
                Anexar Fotos da Trena
              </Button>
              <div className="mt-1 text-muted" style={{ fontSize: '0.75rem' }}>
                Anexe fotos da trena a laser para validação da área
              </div>
            </div>
          )}

          {/* Miniaturas das imagens - compactas */}
          {imagens.length > 0 && (
            <div className="d-flex flex-wrap gap-1 justify-content-center">
              {imagens.map((imagem) => (
                <div key={imagem.id} className="position-relative">
                  <div
                    className="border rounded"
                    style={{
                      width: '60px',
                      height: '45px',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                    onClick={() => visualizarImagem(imagem)}
                  >
                    <img
                      src={imagem.dataUrl}
                      alt={imagem.nome}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
                         style={{ 
                           transition: 'opacity 0.2s',
                           opacity: '0'
                         }}
                         onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                         onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                      <FontAwesomeIcon icon={faExpand} className="text-white" size="lg" />
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 rounded-circle"
                    style={{
                      width: '18px',
                      height: '18px',
                      padding: '0',
                      fontSize: '10px',
                      transform: 'translate(50%, -50%)'
                    }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removerImagem(imagem.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} size="xs" />
                  </Button>
                  <div className="text-center mt-1">
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {imagem.nome.length > 8 ? imagem.nome.substring(0, 8) + '...' : imagem.nome}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {imagens.length === 0 && (
            <div className="text-muted">
              <FontAwesomeIcon icon={faCamera} size="lg" className="mb-1 opacity-50" />
              <div style={{ fontSize: '0.8rem' }}>Nenhuma imagem anexada</div>
            </div>
          )}
        </div>

        <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
          Clique nas miniaturas para expandir. Máximo de {maxImages} imagens.
        </Form.Text>
      </Form.Group>

      {/* Modal para visualização da imagem */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faCamera} className="me-2" />
            Visualizar Imagem da Trena
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImage && (
            <>
              <img
                src={selectedImage.dataUrl}
                alt={selectedImage.nome}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <div className="mt-3">
                <div><strong>Nome do arquivo:</strong> {selectedImage.nome}</div>
                {selectedImage.tamanho && (
                  <div className="text-muted"><strong>Tamanho:</strong> {selectedImage.tamanho}</div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// �� Componente para exibir valor monetário da vistoria (valor fixo salvo no momento do lançamento)
const ValorMonetarioVistoria = ({ vistoria }) => {
  const [valorMonetario, setValorMonetario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obterValor = async () => {
      try {
        setLoading(true);
        
        // 🆕 Verificar se a data da vistoria já passou ou é hoje
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataVistoria = new Date(vistoria.data_vistoria + 'T00:00:00')
        dataVistoria.setHours(0, 0, 0, 0)
        
        // Se a data é futura, valor é zero
        if (dataVistoria > hoje) {
          setValorMonetario(0);
          setLoading(false);
          return;
        }
        
        let valorBase = 0;
        
        // Se a vistoria já tem valor_monetario salvo, usar esse valor
        if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
          valorBase = parseFloat(vistoria.valor_monetario);
        } else {
          // Para vistorias antigas sem valor_monetario, calcular baseado no valor unitário mais recente
          const result = await creditosService.obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
          let valorUnitario = 0;
          
          if (result.success) {
            valorUnitario = result.data;
          }
          
          const consumo = parseFloat(vistoria.consumo_calculado) || 0;
          valorBase = valorUnitario * consumo;
        }
        
        // Aplicar desconto se existir
        const desconto = parseFloat(vistoria.desconto) || 0;
        const valorFinal = Math.max(0, valorBase - desconto);
        
        setValorMonetario(valorFinal);
      } catch (error) {
        console.error('Erro ao obter valor monetário:', error);
        setValorMonetario(0);
      } finally {
        setLoading(false);
      }
    };

    obterValor();
  }, [vistoria.valor_monetario, vistoria.imobiliaria_id, vistoria.consumo_calculado, vistoria.desconto, vistoria.data_vistoria]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <span className={`fw-bold ${valorMonetario > 0 ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.9em' }}>
      {formatCurrency(valorMonetario)}
    </span>
  );
};

// 🆕 Componente para calcular e exibir o total de valores das vistorias
// 🆕 Considera apenas vistorias já executadas (data passada ou atual)
const TotalValorVistorias = ({ vistorias }) => {
  const [totalValor, setTotalValor] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularTotal = async () => {
      try {
        setLoading(true);
        let total = 0;
        
        // 🆕 Data atual (sem horas, apenas data)
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        
        // Calcular valor apenas para vistorias já executadas
        for (const vistoria of vistorias) {
          // 🆕 Verificar se a data da vistoria já passou ou é hoje
          const dataVistoria = new Date(vistoria.data_vistoria + 'T00:00:00')
          dataVistoria.setHours(0, 0, 0, 0)
          
          // Só calcular se a data da vistoria já passou ou é hoje
          if (dataVistoria > hoje) {
            continue // Pular vistorias futuras
          }
          
          let valorBase = 0;
          
          // Se a vistoria tem valor_monetario salvo, usar esse valor
          if (vistoria.valor_monetario && vistoria.valor_monetario > 0) {
            valorBase = parseFloat(vistoria.valor_monetario);
          } else {
            // Para vistorias antigas sem valor_monetario, calcular baseado no valor unitário mais recente
            const result = await creditosService.obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
            if (result.success) {
              const valorUnitario = result.data;
              const consumo = parseFloat(vistoria.consumo_calculado) || 0;
              valorBase = valorUnitario * consumo;
            }
          }
          
          // Aplicar desconto e adicionar ao total
          const desconto = parseFloat(vistoria.desconto) || 0;
          const valorFinal = Math.max(0, valorBase - desconto);
          total += valorFinal;
        }
        
        setTotalValor(total);
      } catch (error) {
        console.error('Erro ao calcular total:', error);
        setTotalValor(0);
      } finally {
        setLoading(false);
      }
    };

    calcularTotal();
  }, [vistorias]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  return (
    <span className="fw-bold text-primary fs-6">
      {formatCurrency(totalValor)}
    </span>
  );
};

// 🆕 Componente para exibir valor da remuneração do vistoriador
const ValorRemuneracaoVistoriador = ({ vistoria }) => {
  const [valorRemuneracao, setValorRemuneracao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularRemuneracao = () => {
      try {
        // Usar o valor unitário salvo na vistoria (histórico congelado)
        const valorUnitario = vistoria.valor_unitario_vistoriador || 0;
        const consumo = parseFloat(vistoria.consumo_calculado) || 0;
        const remuneracao = valorUnitario * consumo;
        
        setValorRemuneracao(remuneracao);
      } catch (error) {
        console.error('Erro ao calcular remuneração:', error);
        setValorRemuneracao(0);
      } finally {
        setLoading(false);
      }
    };

    calcularRemuneracao();
  }, [vistoria]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <span className="text-muted">Calculando...</span>;
  }

  if (valorRemuneracao === null || valorRemuneracao === 0) {
    return <span className="text-muted">R$ 0,00</span>;
  }

  return (
    <span className="text-success fw-bold">
      {formatCurrency(valorRemuneracao)}
    </span>
  );
};

// 🆕 Componente para calcular o total da remuneração dos vistoriadores
// 🆕 Considera apenas vistorias já executadas (data passada ou atual)
const TotalRemuneracaoVistoriadores = ({ vistorias }) => {
  const [totalRemuneracao, setTotalRemuneracao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularTotal = () => {
      try {
        let total = 0;
        
        // 🆕 Data atual (sem horas, apenas data)
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        
        // Calcular remuneração apenas para vistorias já executadas
        vistorias.forEach(vistoria => {
          // 🆕 Verificar se a data da vistoria já passou ou é hoje
          const dataVistoria = new Date(vistoria.data_vistoria + 'T00:00:00')
          dataVistoria.setHours(0, 0, 0, 0)
          
          // Só calcular se a data da vistoria já passou ou é hoje
          if (dataVistoria > hoje) {
            return // Pular vistorias futuras
          }
          
          const valorUnitario = vistoria.valor_unitario_vistoriador || 0;
          const consumo = parseFloat(vistoria.consumo_calculado) || 0;
          const remuneracao = valorUnitario * consumo;
          total += remuneracao;
        });
        
        setTotalRemuneracao(total);
      } catch (error) {
        console.error('Erro ao calcular total de remuneração:', error);
        setTotalRemuneracao(0);
      } finally {
        setLoading(false);
      }
    };

    calcularTotal();
  }, [vistorias]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  return (
    <span className="fw-bold text-success fs-6">
      {formatCurrency(totalRemuneracao || 0)}
    </span>
  );
};



// Componente de Card para Mobile
const VistoriaCardMobile = ({ 
  vistoria, 
  formatDate, 
  handleEditarVistoria, 
  handleConfirmarExclusao, 
  isVistoriadorView = false,
  showVistoriadorColumn = true
}) => {
  return (
    <Card className="mb-3 shadow-sm" style={{ borderLeft: '4px solid #0d6efd' }}>
      <Card.Body className="p-3">
        {/* Cabeçalho do Card */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong className="text-primary fs-6">{vistoria.codigo}</strong>
              {vistoria.is_express && (
                <Badge bg="warning" className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faBolt} size="xs" />
                </Badge>
              )}
            </div>
            <div className="text-muted small">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
              {formatDate(vistoria.data_vistoria)}
            </div>
          </div>
          <div className="text-end">
            {isVistoriadorView ? (
              <ValorRemuneracaoVistoriador vistoria={vistoria} />
            ) : (
              <ValorMonetarioVistoria vistoria={vistoria} />
            )}
          </div>
        </div>

        {/* Informações Principais */}
        <div className="mb-2">
          <div className="d-flex align-items-center mb-1">
            <FontAwesomeIcon icon={faBuilding} className="text-muted me-2" size="sm" />
            <span className="small">{vistoria.imobiliarias?.nome || 'N/A'}</span>
          </div>
          {showVistoriadorColumn && vistoria.vistoriadores?.nome && (
            <div className="d-flex align-items-center mb-1">
              <FontAwesomeIcon icon={faUserTie} className="text-muted me-2" size="sm" />
              <span className="small">
                {vistoria.vistoriadores.nome.split(' ')[0] + ' ' + (vistoria.vistoriadores.nome.split(' ')[1] || '')}
              </span>
            </div>
          )}
          <div className="d-flex align-items-start mb-1">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-2 mt-1" size="sm" style={{ flexShrink: 0 }} />
            <span className="small" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} title={vistoria.endereco}>
              {vistoria.endereco}
            </span>
          </div>
        </div>

        {/* Detalhes em Grid */}
        <div className="row g-2 mb-2" style={{ marginLeft: 0, marginRight: 0 }}>
          <div className="col-6" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <div className="d-flex align-items-center" style={{ flexWrap: 'wrap' }}>
              <FontAwesomeIcon icon={faHome} className="text-muted me-1" size="xs" style={{ flexShrink: 0 }} />
              <span className="small text-muted" style={{ whiteSpace: 'nowrap' }}>Tipo:</span>
              <span className="small ms-1 fw-semibold" style={{ wordBreak: 'break-word' }}>{vistoria.tipos_imoveis?.nome || 'N/A'}</span>
            </div>
          </div>
          <div className="col-6" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <div className="d-flex align-items-center" style={{ flexWrap: 'wrap' }}>
              <FontAwesomeIcon icon={faRuler} className="text-muted me-1" size="xs" style={{ flexShrink: 0 }} />
              <span className="small text-muted" style={{ whiteSpace: 'nowrap' }}>Área:</span>
              <span className="small ms-1 fw-semibold">{vistoria.area_imovel}m²</span>
            </div>
          </div>
          <div className="col-6" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <div className="d-flex align-items-center" style={{ flexWrap: 'wrap' }}>
              <FontAwesomeIcon icon={faBox} className="text-muted me-1" size="xs" style={{ flexShrink: 0 }} />
              <span className="small text-muted" style={{ whiteSpace: 'nowrap' }}>Mobília:</span>
              <span className="small ms-1 fw-semibold" style={{ wordBreak: 'break-word' }}>{vistoria.tipos_mobilia?.nome || 'N/A'}</span>
            </div>
          </div>
          <div className="col-6" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <div className="d-flex align-items-center" style={{ flexWrap: 'wrap' }}>
              <span className="small text-muted" style={{ whiteSpace: 'nowrap' }}>Consumo:</span>
              <span className="small ms-1 fw-bold text-primary">
                {parseFloat(vistoria.consumo_calculado).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="d-flex gap-2 mt-2 pt-2 border-top">
          <Button 
            variant="outline-warning" 
            size="sm" 
            className="flex-fill"
            onClick={() => handleEditarVistoria(vistoria, isVistoriadorView)}
          >
            <FontAwesomeIcon icon={faEdit} className="me-1" />
            Editar
          </Button>
          {!isVistoriadorView && (
            <Button 
              variant="outline-danger" 
              size="sm"
              className="flex-fill"
              onClick={() => handleConfirmarExclusao(vistoria)}
            >
              <FontAwesomeIcon icon={faTrash} className="me-1" />
              Excluir
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// 🆕 Componente para tabela de vistorias (reutilizável para admin e vistoriador)
const TabelaVistorias = ({ 
  vistoriasFiltradas, 
  formatDate, 
  handleEditarVistoria, 
  handleConfirmarExclusao, 
  isVistoriadorView = false,
  usuarioLogado 
}) => {
  // Detectar se está em mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 🔍 Lógica correta: ocultar coluna apenas se o usuário logado é vistoriador
  const showVistoriadorColumn = usuarioLogado?.tipo !== 'vistoriador';
  
  if (vistoriasFiltradas.length === 0) {
    return (
      <div className="text-center py-5">
        <FontAwesomeIcon icon={faSearch} className="text-muted fs-1 mb-3" />
        <h5 className="text-muted">Nenhuma vistoria encontrada</h5>
        <p className="text-muted">
          {!isVistoriadorView ? 
            'Clique em "Nova Vistoria" para cadastrar a primeira vistoria.' :
            'Não há vistorias disponíveis para visualização.'
          }
        </p>
      </div>
    );
  }

  // Renderizar cards no mobile
  if (isMobile) {
    return (
      <div className="vistorias-mobile-list">
        {vistoriasFiltradas.map((vistoria) => (
          <VistoriaCardMobile
            key={vistoria.id}
            vistoria={vistoria}
            formatDate={formatDate}
            handleEditarVistoria={handleEditarVistoria}
            handleConfirmarExclusao={handleConfirmarExclusao}
            isVistoriadorView={isVistoriadorView}
            showVistoriadorColumn={showVistoriadorColumn}
          />
        ))}
      </div>
    );
  }

  // Renderizar tabela no desktop
  return (
    <div className="table-responsive">
      <Table hover className="table-sm mb-0">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '4%' }}>Código</th>
            <th style={{ width: showVistoriadorColumn ? '8%' : '10%' }}>Imobiliária</th>
            {showVistoriadorColumn && <th style={{ width: '7%' }}>Vistoriador</th>}
            <th style={{ width: '6%' }}>Data</th>
            <th style={{ width: '8%' }}>Tipo</th>
            <th style={{ width: '6%' }}>Área</th>
            <th style={{ width: '6%' }}>Mobília</th>
            <th style={{ width: '5%', textAlign: 'center' }}>Consumo</th>
            <th style={{ width: showVistoriadorColumn ? '37%' : '42%' }}>Endereço</th>
            <th style={{ width: '7%' }}>Valor</th>
            <th style={{ width: '6%' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vistoriasFiltradas.map((vistoria) => (
            <tr key={vistoria.id}>
              <td className="text-nowrap">
                <strong className="text-primary" style={{ fontSize: '0.9em' }}>
                  {vistoria.codigo}
                </strong>
                {vistoria.is_express && (
                  <Badge bg="warning" size="sm" className="ms-1">
                    <FontAwesomeIcon icon={faBolt} />
                  </Badge>
                )}
              </td>
              <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                {vistoria.imobiliarias?.nome || 'N/A'}
              </td>
              {showVistoriadorColumn && (
                <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                  {vistoria.vistoriadores?.nome ? 
                    vistoria.vistoriadores.nome.split(' ')[0] + ' ' + (vistoria.vistoriadores.nome.split(' ')[1] || '') : 
                    'N/A'
                  }
                </td>
              )}
              <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                {formatDate(vistoria.data_vistoria)}
              </td>
              <td className="text-nowrap" style={{ fontSize: '0.85em' }}>
                {vistoria.tipos_imoveis?.nome || 'N/A'}
              </td>
              <td className="text-nowrap" style={{ fontSize: '0.9em' }}>
                {vistoria.area_imovel}m²
              </td>
              <td className="text-nowrap" style={{ fontSize: '0.85em' }}>
                {vistoria.tipos_mobilia?.nome || 'N/A'}
              </td>
              <td className="text-nowrap text-center" style={{ fontSize: '0.9em' }}>
                <strong>{parseFloat(vistoria.consumo_calculado).toFixed(1)}</strong>
              </td>
              <td 
                className="text-truncate" 
                style={{ 
                  maxWidth: '300px',
                  fontSize: '0.85em' 
                }}
                title={vistoria.endereco}
              >
                {vistoria.endereco}
              </td>
              <td className="text-nowrap">
                {isVistoriadorView ? (
                  <ValorRemuneracaoVistoriador vistoria={vistoria} />
                ) : (
                  <ValorMonetarioVistoria vistoria={vistoria} />
                )}
              </td>
              <td className="text-nowrap">
                <Button 
                  variant="outline-warning" 
                  size="sm" 
                  className="me-1 btn-sm"
                  title="Editar vistoria"
                  style={{ padding: '0.2rem 0.4rem' }}
                  onClick={() => handleEditarVistoria(vistoria, isVistoriadorView)}
                >
                  <FontAwesomeIcon icon={faEdit} size="sm" />
                </Button>
                {!isVistoriadorView && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    className="btn-sm"
                    title="Excluir vistoria"
                    style={{ padding: '0.2rem 0.4rem' }}
                    onClick={() => handleConfirmarExclusao(vistoria)}
                  >
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const Dashboard = ({ deslogar, usuarioLogado }) => {
  // Detectar se está em mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Estados para dados das vistorias
  const [vistorias, setVistorias] = useState([]);
  const [imobiliarias, setImobiliarias] = useState([]);
  const [vistoriadores, setVistoriadores] = useState([]);
  const [tiposImovel, setTiposImovel] = useState([]);
  const [tiposMobilia, setTiposMobilia] = useState([]);
  const [tiposVistoria, setTiposVistoria] = useState([]);
  const [tiposConsumo, setTiposConsumo] = useState([]);

  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [loadingModal, setLoadingModal] = useState(false);
  const [salvandoVistoria, setSalvandoVistoria] = useState(false);
  // 🆕 Estado para controlar a aba ativa - vistoriadores iniciam na aba vistoriador
  const [activeTab, setActiveTab] = useState(usuarioLogado?.tipo === 'admin' ? 'administrador' : 'vistoriador');

  const [filtroTexto, setFiltroTexto] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [vistoriadorFiltro, setVistoriadorFiltro] = useState('');
  // Estado para controlar visibilidade dos filtros
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  // Estados para o modal de nova vistoria
  const [showNovaVistoriaModal, setShowNovaVistoriaModal] = useState(false);
  const [vistoriaData, setVistoriaData] = useState({
    codigo: '',
    imobiliariaId: '',
    vistoriadorId: '',
    tipoImovelId: '',
    tipoVistoriaId: '',
    endereco: '',
    dataVistoria: '',
    area: '',
    tipoMobiliaId: '',
    taxaDeslocamento: '',
    desconto: '',
    isExpress: false
  });
  const [vistoriaErrors, setVistoriaErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [valorUnitarioAtual, setValorUnitarioAtual] = useState(0);
  // 🆕 Estado para armazenar créditos disponíveis da imobiliária selecionada
  const [creditosDisponiveis, setCreditosDisponiveis] = useState(0);
  const [vistoriaEditando, setVistoriaEditando] = useState(null);
  const [isVistoriadorEditing, setIsVistoriadorEditing] = useState(false); // 🆕 Controla se é o vistoriador editando
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [vistoriaParaExcluir, setVistoriaParaExcluir] = useState(null);
  const [excluindoVistoria, setExcluindoVistoria] = useState(false);
  
  // Estado para imagens da trena a laser
  const [imagensTrena, setImagensTrena] = useState([]);
  
  // Estados para geração de relatório
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  // Carregamento de dados do Supabase
  useEffect(() => {
    if (usuarioLogado) {
      carregarDadosReaisDoSupabase();
      inicializarSistemaRemuneracao(); // 🆕 Inicializar sistema de remuneração
    }
  }, [usuarioLogado]);

  const carregarDadosReaisDoSupabase = async () => {
    try {
      setLoading(true);
      
      // Carregar vistorias
      console.log('🔄 Carregando vistorias para usuário:', usuarioLogado.id, 'Tipo:', usuarioLogado?.tipo);
      const vistoriaResult = await vistoriasService.listarVistorias(usuarioLogado.id);
      if (vistoriaResult.success) {
        console.log('✅ Vistorias carregadas:', vistoriaResult.data.length);
        console.log('📋 Códigos das vistorias encontradas:', vistoriaResult.data.map(v => v.codigo));
        
        // Log simples das vistorias carregadas
        if (usuarioLogado?.tipo === 'admin') {
          console.log('✅ [ADMIN] Carregando TODAS as vistorias do sistema');
        } else {
          console.log('✅ [VISTORIADOR] Carregando apenas vistorias próprias');
        }
        
        setVistorias(vistoriaResult.data);
      } else {
        console.error('❌ Erro ao carregar vistorias:', vistoriaResult.error);
      }

      // Carregar imobiliárias
      const imobiliariaResult = await imobiliariasService.listar();
      if (imobiliariaResult.success) {
        setImobiliarias(imobiliariaResult.data);
      }

      // Carregar vistoriadores
      const vistoriadorResult = await vistoriadoresService.listar();
      if (vistoriadorResult.success) {
        setVistoriadores(vistoriadorResult.data);
      }

      // Carregar tipos
      const [tiposImovelResult, tiposMobiliaResult, tiposVistoriaResult, tiposConsumoResult] = await Promise.all([
        tiposService.listarTiposImoveis(),
        tiposService.listarTiposMobilia(),
        tiposService.listarTiposVistorias(),
        tiposConsumoService.listarTiposConsumo()
      ]);

      if (tiposImovelResult.success) setTiposImovel(tiposImovelResult.data);
      if (tiposMobiliaResult.success) setTiposMobilia(tiposMobiliaResult.data);
      if (tiposVistoriaResult.success) setTiposVistoria(tiposVistoriaResult.data);
      if (tiposConsumoResult.success) setTiposConsumo(tiposConsumoResult.data);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para inicializar sistema de remuneração (executar apenas uma vez)
  const inicializarSistemaRemuneracao = async () => {
    try {
      const result = await migrationService.adicionarColunasRemuneracao();
      console.log('Sistema de remuneração inicializado:', result);
    } catch (error) {
      console.error('Erro ao inicializar sistema de remuneração:', error);
    }
  };

  // Função para filtrar vistorias com base nos filtros ativos
  // (O service já filtra por usuário/vistoriador)
  const vistoriasFiltradas = vistorias.filter(vistoria => {
    const textoFiltro = filtroTexto.toLowerCase();
    
    // Filtro de texto
    const matchTexto = (
      vistoria.codigo.toLowerCase().includes(textoFiltro) ||
      (vistoria.imobiliarias?.nome || '').toLowerCase().includes(textoFiltro) ||
      (vistoria.vistoriadores?.nome || '').toLowerCase().includes(textoFiltro) ||
      vistoria.endereco.toLowerCase().includes(textoFiltro) ||
      (vistoria.tipos_imoveis?.nome || '').toLowerCase().includes(textoFiltro)
    );
    
    // Filtro de período
    const dataVistoria = new Date(vistoria.data_vistoria);
    const matchDataInicio = !dataInicio || dataVistoria >= new Date(dataInicio);
    const matchDataFim = !dataFim || dataVistoria <= new Date(dataFim);
    
    // Filtro de vistoriador (apenas para admin)
    const matchVistoriador = !vistoriadorFiltro || vistoria.vistoriador_id === vistoriadorFiltro;
    
    return matchTexto && matchDataInicio && matchDataFim && matchVistoriador;
  });

  // Função para obter data atual
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Funções do modal Nova Vistoria
  const handleShowNovaVistoriaModal = async () => {
    try {
      setLoadingModal(true);
      
      setVistoriaData({
        codigo: '', // Campo iniciando vazio
        imobiliariaId: '',
        vistoriadorId: '',
        tipoImovelId: '',
        tipoVistoriaId: '',
        endereco: '',
        dataVistoria: getCurrentDate(),
        area: '',
        tipoMobiliaId: '',
        taxaDeslocamento: '',
        desconto: '',
        isExpress: false
      });
      setShowNovaVistoriaModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseNovaVistoriaModal = () => {
    setShowNovaVistoriaModal(false);
    setVistoriaData({
      codigo: '',
      imobiliariaId: '',
      vistoriadorId: '',
      tipoImovelId: '',
      tipoVistoriaId: '',
      endereco: '',
      dataVistoria: '',
      area: '',
      tipoMobiliaId: '',
      taxaDeslocamento: '',
      desconto: '',
      isExpress: false
    });
    setVistoriaErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setValorUnitarioAtual(0);
    setCreditosDisponiveis(0);
    setVistoriaEditando(null);
    setIsVistoriadorEditing(false);
    setImagensTrena([]);
  };

  // Função para obter valor unitário mais recente
  const obterValorUnitarioMaisRecente = async (imobiliariaId) => {
    try {
      const result = await creditosService.obterValorUnitarioMaisRecente(imobiliariaId);
      if (result.success) {
        return result.data;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter valor unitário:', error);
      return 0;
    }
  };

  // 🆕 Função para obter créditos disponíveis da imobiliária
  const obterCreditosDisponiveis = async (imobiliariaId) => {
    try {
      const result = await creditosService.obterResumoCreditos(imobiliariaId);
      if (result.success) {
        return result.data.creditosDisponiveis;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter créditos:', error);
      return 0;
    }
  };

  // Função para lidar com mudanças no formulário
  const handleVistoriaInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setVistoriaData({
      ...vistoriaData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Quando selecionar uma imobiliária, carregar o valor unitário mais recente e créditos disponíveis
    if (name === 'imobiliariaId' && value) {
      try {
        const [valorUnitario, creditos] = await Promise.all([
          obterValorUnitarioMaisRecente(value),
          obterCreditosDisponiveis(value)
        ]);
        setValorUnitarioAtual(valorUnitario);
        setCreditosDisponiveis(creditos);
      } catch (error) {
        console.error('Erro ao carregar dados da imobiliária:', error);
        setValorUnitarioAtual(0);
        setCreditosDisponiveis(0);
      }
    }
  };

  // Função para validar formulário
  const validateVistoriaForm = () => {
    const errors = {};
    
    if (!vistoriaData.codigo.trim()) errors.codigo = 'Código é obrigatório';
    if (!vistoriaData.imobiliariaId) errors.imobiliariaId = 'Imobiliária é obrigatória';
    if (!vistoriaData.vistoriadorId) errors.vistoriadorId = 'Vistoriador é obrigatório';
    if (!vistoriaData.tipoImovelId) errors.tipoImovelId = 'Tipo de imóvel é obrigatório';
    if (!vistoriaData.tipoVistoriaId) errors.tipoVistoriaId = 'Tipo de vistoria é obrigatório';
    if (!vistoriaData.endereco.trim()) errors.endereco = 'Endereço é obrigatório';
    if (!vistoriaData.dataVistoria) errors.dataVistoria = 'Data da vistoria é obrigatória';
    // 🆕 Permitir área zero (para permitir consumo zero)
    if (!vistoriaData.area || parseFloat(vistoriaData.area) < 0) errors.area = 'Área deve ser maior ou igual a zero';
    if (!vistoriaData.tipoMobiliaId) errors.tipoMobiliaId = 'Tipo de mobília é obrigatório';

    setVistoriaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar/Atualizar vistoria
  const handleSaveVistoria = async () => {
    if (!validateVistoriaForm()) return;

    try {
      setSalvandoVistoria(true);
      setErrorMessage('');

      const consumoCalculado = calculateConsumo();
      const valorMonetario = consumoCalculado * valorUnitarioAtual;

      // 🔍 Debug: Log detalhado do processo de edição
      console.log('🔍 PROCESSO DE EDIÇÃO - NOVA LÓGICA SEM DONO:');
      console.log('- Vistoria sendo editada:', vistoriaEditando?.codigo);
      console.log('- Usuário atual (quem está editando):', usuarioLogado.id);
      console.log('- É vistoriador editando?', isVistoriadorEditing);
      console.log('- Tipo do usuário:', usuarioLogado?.tipo);

      const dadosVistoria = {
        codigo: vistoriaData.codigo.trim(),
        // 🆕 Nova lógica: usuario_id não é mais relevante para filtros, mas mantemos para auditoria
        usuario_id: usuarioLogado.id,
        imobiliaria_id: vistoriaData.imobiliariaId,
        vistoriador_id: vistoriaData.vistoriadorId,
        tipo_imovel_id: vistoriaData.tipoImovelId,
        tipo_vistoria_id: vistoriaData.tipoVistoriaId,
        tipo_mobilia_id: vistoriaData.tipoMobiliaId,
        endereco: vistoriaData.endereco.trim(),
        data_vistoria: vistoriaData.dataVistoria,
        area_imovel: parseFloat(vistoriaData.area),
        // 🆕 Se for vistoriador editando, manter valores originais dos campos restritos
        taxa_deslocamento: isVistoriadorEditing && vistoriaEditando ? 
          vistoriaEditando.taxa_deslocamento : 
          (parseFloat(vistoriaData.taxaDeslocamento) || 0),
        desconto: isVistoriadorEditing && vistoriaEditando ? 
          vistoriaEditando.desconto : 
          (parseFloat(vistoriaData.desconto) || 0),
        is_express: isVistoriadorEditing && vistoriaEditando ? 
          vistoriaEditando.is_express : 
          vistoriaData.isExpress,
        consumo_calculado: consumoCalculado,
        valor_monetario: valorMonetario,
        status: 'pendente'
      };

      console.log('📦 Dados que serão enviados para atualização:', dadosVistoria);

      let result;
      if (vistoriaEditando) {
        // 🆕 Editar vistoria existente
        console.log('🔄 Enviando atualização para o servidor...');
        result = await vistoriasService.atualizarVistoria(vistoriaEditando.id, dadosVistoria);
        
        if (result.success) {
          console.log('✅ Atualização bem-sucedida. Dados retornados:', result.data);
          console.log('✅ Usuario_id após atualização:', result.data?.usuario_id);
          
          // 🆕 Recarregar lista completa para garantir sincronização entre usuários
          console.log('🔄 Recarregando lista do servidor...');
          await carregarDadosReaisDoSupabase();
          setSuccessMessage(`Vistoria ${vistoriaData.codigo} atualizada com sucesso!`);
        } else {
          console.error('❌ Erro na atualização:', result.error);
        }
      } else {
        // Criar nova vistoria
        result = await vistoriasService.criarVistoria(dadosVistoria);
        
        if (result.success) {
          setVistorias([result.data, ...vistorias]);
          const creditosDebitados = parseFloat(calculateConsumo().toFixed(2));
          
          // 🆕 Mensagem apropriada baseada na situação
          if (result.dataFutura) {
            setSuccessMessage(`✅ Vistoria cadastrada com sucesso! Como a data é futura (${formatDate(dadosVistoria.data_vistoria)}), os créditos serão debitados quando a data chegar.`);
          } else if (result.consumoZero || creditosDebitados === 0) {
            setSuccessMessage(`✅ Vistoria cadastrada com sucesso! Nenhum crédito debitado (consumo zero).`);
          } else if (result.creditosInsuficientes) {
            setSuccessMessage(`⚠️ Vistoria cadastrada com créditos insuficientes! ${creditosDebitados} créditos foram debitados da imobiliária. Saldo atual: ${result.novoSaldo.toFixed(2)} créditos.`);
          } else {
            setSuccessMessage(`✅ Vistoria cadastrada com sucesso! ${creditosDebitados} créditos foram debitados da imobiliária.`);
          }
        }
      }
      
      if (result.success) {
        // Processar imagens da trena a laser
        if (imagensTrena.length > 0) {
          try {
            const vistoriaId = vistoriaEditando ? vistoriaEditando.id : result.data.id;
            
            // Separar imagens novas das que já existem no banco
            const imagensNovas = imagensTrena.filter(img => !img.fromDatabase);
            const imagensExistentes = imagensTrena.filter(img => img.fromDatabase);
            
            // Upload apenas das imagens novas
            if (imagensNovas.length > 0) {
              const uploadResult = await imagensVistoriaService.uploadImagensTrena(vistoriaId, imagensNovas);
              
              if (uploadResult.success) {
                // Salvar metadados das imagens novas no banco
                await imagensVistoriaService.salvarImagensVistoria(vistoriaId, uploadResult.data);
                console.log(`✅ ${imagensNovas.length} nova(s) imagem(ns) da trena a laser salva(s) com sucesso`);
              } else {
                console.warn('⚠️ Erro ao salvar imagens novas:', uploadResult.error);
                setErrorMessage(`Vistoria salva, mas houve erro ao salvar as imagens: ${uploadResult.error}`);
              }
            }
            
            if (imagensExistentes.length > 0) {
              console.log(`✅ ${imagensExistentes.length} imagem(ns) existente(s) mantida(s)`);
            }
            
          } catch (imageError) {
            console.error('Erro ao processar imagens:', imageError);
            setErrorMessage('Vistoria salva, mas houve erro ao processar as imagens da trena');
          }
        }
        
        setTimeout(() => {
          handleCloseNovaVistoriaModal();
        }, 2000);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar vistoria:', error);
      setErrorMessage('Erro interno do servidor');
    } finally {
      setSalvandoVistoria(false);
    }
  };

  // Cálculo de consumo baseado em dados da tabela tipos_consumo
  const calculateConsumo = () => {
    const area = parseFloat(vistoriaData.area) || 0;
    if (area === 0) return 0;

    let consumoTotal = area; // Base: 1 crédito por m²

    // Adicionar percentual por tipo de imóvel
    if (vistoriaData.tipoImovelId) {
      const tipoImovel = tiposImovel.find(t => t.id === vistoriaData.tipoImovelId);
      if (tipoImovel) {
        const tipoConsumo = tiposConsumo.find(tc => 
          tc.nome.toLowerCase() === tipoImovel.nome.toLowerCase()
        );
        if (tipoConsumo) {
          consumoTotal += (area * tipoConsumo.porcentagem / 100);
        }
      }
    }

    // Adicionar percentual por tipo de mobília
    if (vistoriaData.tipoMobiliaId) {
      const tipoMobilia = tiposMobilia.find(t => t.id === vistoriaData.tipoMobiliaId);
      if (tipoMobilia) {
        const tipoConsumo = tiposConsumo.find(tc => 
          tc.nome.toLowerCase() === tipoMobilia.nome.toLowerCase()
        );
        if (tipoConsumo) {
          consumoTotal += (area * tipoConsumo.porcentagem / 100);
        }
      }
    }

    // Adicionar percentual se for Express
    const isExpressValue = isVistoriadorEditing && vistoriaEditando ? 
      vistoriaEditando.is_express : 
      vistoriaData.isExpress;
    
    if (isExpressValue) {
      const tipoConsumo = tiposConsumo.find(tc => 
        tc.nome.toLowerCase() === 'express'
      );
      if (tipoConsumo) {
        consumoTotal += (area * tipoConsumo.porcentagem / 100);
      }
    }

    // 🆕 Adicionar Taxa de Deslocamento (valor fixo, não multiplicado)
    const taxaDeslocamento = isVistoriadorEditing && vistoriaEditando ? 
      (parseFloat(vistoriaEditando.taxa_deslocamento) || 0) : 
      (parseFloat(vistoriaData.taxaDeslocamento) || 0);
    consumoTotal += taxaDeslocamento;

    return consumoTotal;
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // 🚧 Função para recuperar vistoria específica por código
  const recuperarVistoriaPorCodigo = async (codigo) => {
    try {
      console.log(`🔍 Investigando vistoria ${codigo}...`);
      
      const result = await vistoriasService.buscarVistoriaPorCodigo(codigo);
      
      if (result.success) {
        console.log(`✅ Vistoria ${codigo} encontrada:`, result.data);
        
        // Verificar se o usuario_id está correto (deve ser do admin)
        const adminUserId = usuarioLogado.id;
        
        if (result.data.usuario_id !== adminUserId) {
          // Corrigir o usuario_id para o admin
          console.log(`🔧 Corrigindo usuario_id da vistoria ${codigo} de ${result.data.usuario_id} para ${adminUserId}`);
          
          const correcao = await vistoriasService.atualizarVistoria(result.data.id, {
            usuario_id: adminUserId
          });
          
          if (correcao.success) {
            console.log(`✅ Usuario_id da vistoria ${codigo} corrigido!`);
            // Recarregar lista
            await carregarDadosReaisDoSupabase();
            alert(`Vistoria ${codigo} recuperada com sucesso! Ela deve aparecer no painel agora.`);
            return true;
          } else {
            console.error(`❌ Erro ao corrigir usuario_id da vistoria ${codigo}:`, correcao.error);
            alert(`Erro ao corrigir vistoria ${codigo}: ${correcao.error}`);
            return false;
          }
        } else {
          alert(`Vistoria ${codigo} encontrada e já está correta!\n\nUsuário ID: ${result.data.usuario_id}\nVerifique os filtros ou tente recarregar a página.`);
          return true;
        }
      } else {
        console.log(`❌ Vistoria ${codigo} não encontrada:`, result.error);
        alert(`Vistoria ${codigo} não encontrada: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao investigar vistoria ${codigo}:`, error);
      alert(`Erro ao investigar vistoria ${codigo}`);
      return false;
    }
  };

  // 🔧 Função robusta para recuperar todas as vistorias órfãs
  const recuperarTodasVistoriasOrfas = async () => {
    try {
      console.log('🔍 Iniciando busca por vistorias órfãs...');
      setLoading(true);
      
      // Buscar vistorias órfãs
      const result = await vistoriasService.buscarVistoriasOrfas(usuarioLogado.id);
      
      if (!result.success) {
        alert(`Erro ao buscar vistorias órfãs: ${result.error}`);
        return;
      }
      
      if (result.data.length === 0) {
        alert('✅ Nenhuma vistoria órfã encontrada! Todas as vistorias estão devidamente vinculadas.');
        return;
      }
      
      // Mostrar as vistorias encontradas e pedir confirmação
      const listaOrfas = result.data.map(v => 
        `- ${v.codigo} (${v.imobiliarias?.nome || 'S/Imob'}) - Área: ${v.area_imovel}m²`
      ).join('\n');
      
      const confirmar = window.confirm(
        `🔍 Encontradas ${result.data.length} vistorias órfãs:\n\n${listaOrfas}\n\n` +
        `Deseja transferir a propriedade dessas vistorias para sua conta de administrador?\n\n` +
        `⚠️ Isso fará com que elas apareçam novamente no seu painel.`
      );
      
      if (!confirmar) {
        console.log('❌ Correção cancelada pelo usuário');
        return;
      }
      
      // Corrigir as vistorias órfãs
      const idsParaCorrigir = result.data.map(v => v.id);
      const correcaoResult = await vistoriasService.corrigirVistoriasOrfas(idsParaCorrigir, usuarioLogado.id);
      
      if (correcaoResult.success) {
        // Recarregar lista
        await carregarDadosReaisDoSupabase();
        alert(`✅ ${correcaoResult.data.length} vistorias recuperadas com sucesso!\n\nElas devem aparecer no seu painel agora.`);
      } else {
        alert(`❌ Erro ao corrigir vistorias: ${correcaoResult.error}`);
      }
      
    } catch (error) {
      console.error('Erro geral ao recuperar vistorias órfãs:', error);
      alert('Erro geral ao recuperar vistorias órfãs');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Função para recarregar lista manualmente
  const handleRecarregarLista = async () => {
    try {
      setLoading(true);
      await carregarDadosReaisDoSupabase();
      setSuccessMessage('Lista de vistorias recarregada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao recarregar lista:', error);
      setErrorMessage('Erro ao recarregar lista de vistorias');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 📄 Função para gerar relatório em PDF
  const handleGerarRelatorio = async (isVistoriadorView = false) => {
    if (vistoriasFiltradas.length === 0) {
      alert('Não há vistorias para gerar o relatório!');
      return;
    }

    try {
      setGerandoRelatorio(true);

      // Criar um novo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Configurações de formatação
      const formatDate = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
      };

      const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value || 0);
      };

      const calcularTotalGeral = () => {
        return vistoriasFiltradas.reduce((total, vistoria) => {
          if (isVistoriadorView) {
            // Para vistoriador, calcular remuneração
            const valorUnitario = 0.5; // Valor padrão
            const consumo = parseFloat(vistoria.consumo_calculado) || 0;
            return total + (valorUnitario * consumo);
          } else {
            // Para admin, valor monetário total
            return total + (parseFloat(vistoria.valor_monetario) || 0);
          }
        }, 0);
      };

      // Cabeçalho do relatório
      doc.setFontSize(20);
      doc.setTextColor(13, 110, 253); // Cor azul do sistema
      doc.text('Controle de Vistorias', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      const tituloRelatorio = isVistoriadorView 
        ? 'Relatório de Remuneração - Vistoriador' 
        : 'Relatório de Vistorias - Administração';
      doc.text(tituloRelatorio, pageWidth / 2, 30, { align: 'center' });

      // Informações do relatório em layout horizontal
      const agora = new Date();
      const dataHoraRelatorio = agora.toLocaleString('pt-BR');
      
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      
      // Lado esquerdo - Informações do usuário
      doc.text(`Usuário: ${usuarioLogado?.nome || 'N/A'}`, 20, 45);
      doc.text(`Data/Hora: ${dataHoraRelatorio}`, 20, 50);
      doc.text(`Total de registros: ${vistoriasFiltradas.length}`, 20, 55);

      // Lado direito - Filtros aplicados (se houver)
      let yPosition = 60;
      if (filtroTexto || dataInicio || dataFim || vistoriadorFiltro) {
        doc.setFontSize(11);
        doc.setTextColor(73, 80, 87);
        doc.text('Filtros Aplicados:', pageWidth - 90, 45);
        
        let rightYPos = 50;
        doc.setFontSize(10);
        doc.setTextColor(102, 102, 102);
        
        if (filtroTexto) {
          doc.text(`Busca: ${filtroTexto}`, pageWidth - 90, rightYPos);
          rightYPos += 4;
        }
        if (dataInicio) {
          doc.text(`Data Início: ${formatDate(dataInicio)}`, pageWidth - 90, rightYPos);
          rightYPos += 4;
        }
        if (dataFim) {
          doc.text(`Data Fim: ${formatDate(dataFim)}`, pageWidth - 90, rightYPos);
          rightYPos += 4;
        }
        if (vistoriadorFiltro) {
          doc.text(`Vistoriador: ${vistoriadorFiltro}`, pageWidth - 90, rightYPos);
          rightYPos += 4;
        }
        yPosition = Math.max(60, rightYPos + 5);
      }

      // Preparar dados da tabela
      const tableColumns = isVistoriadorView 
        ? ['Código', 'Imobiliária', 'Data', 'Tipo', 'Área', 'Status', 'Consumo', 'Endereço', 'Remuneração']
        : ['Código', 'Imobiliária', 'Data', 'Tipo', 'Área', 'Status', 'Consumo', 'Endereço', 'Valor'];

      const tableData = vistoriasFiltradas.map(vistoria => {
        const endereco = vistoria.endereco && vistoria.endereco.length > 35 
          ? vistoria.endereco.substring(0, 35) + '...' 
          : vistoria.endereco || 'N/A';
        
        const baseData = [
          vistoria.codigo,
          vistoria.imobiliarias?.nome || 'N/A',
          formatDate(vistoria.data_vistoria),
          vistoria.tipos_imoveis?.nome || 'N/A',
          `${vistoria.area_imovel}m²`,
          vistoria.tipos_mobilia?.nome || 'N/A',
          vistoria.consumo_calculado || '0',
          endereco
        ];

        if (isVistoriadorView) {
          const remuneracao = 0.5 * parseFloat(vistoria.consumo_calculado);
          return [...baseData, formatCurrency(remuneracao)];
        } else {
          return [...baseData, formatCurrency(vistoria.valor_monetario)];
        }
      });

      // Gerar tabela com paginação automática
      doc.autoTable({
        head: [tableColumns],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [13, 110, 253],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 }, // Código
          1: { cellWidth: 22 }, // Imobiliária
          2: { halign: 'center', cellWidth: 18 }, // Data
          3: { cellWidth: 18 }, // Tipo
          4: { halign: 'center', cellWidth: 12 }, // Área
          5: { cellWidth: 18 }, // Status
          6: { halign: 'center', cellWidth: 12 }, // Consumo
          7: { cellWidth: 45, fontSize: 7 }, // Endereço
          8: { halign: 'right', cellWidth: 20 } // Remuneração/Valor
        },
        margin: { top: 10, bottom: 30 },
        didDrawPage: function (data) {
          // Rodapé em cada página
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          doc.text(
            'Relatório gerado automaticamente pelo Sistema de Controle de Vistorias',
            pageWidth / 2,
            pageHeight - 15,
            { align: 'center' }
          );
          doc.text(
            `© ${new Date().getFullYear()} - Todos os direitos reservados`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      // Adicionar total no final
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253);
      const totalLabel = isVistoriadorView ? 'Total de Remuneração: ' : 'Total Geral: ';
      const totalValue = formatCurrency(calcularTotalGeral());
      
      doc.text(totalLabel + totalValue, pageWidth - 20, finalY, { align: 'right' });

      // Salvar o PDF
      const agora2 = new Date();
      const timestamp = agora2.toISOString().slice(0, 19).replace(/:/g, '-');
      const tipoRelatorio = isVistoriadorView ? 'remuneracao' : 'vistorias';
      const nomeArquivo = `relatorio-${tipoRelatorio}-${timestamp}.pdf`;
      
      doc.save(nomeArquivo);

      setSuccessMessage(`Relatório PDF gerado e baixado com sucesso: ${nomeArquivo}`);
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      setErrorMessage('Erro ao gerar relatório PDF. Tente novamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setGerandoRelatorio(false);
    }
  };

  // 🆕 Função para editar vistoria
  const handleEditarVistoria = async (vistoria, isFromVistoriador = false) => {
    try {
      setLoadingModal(true);
      setVistoriaEditando(vistoria);
      setIsVistoriadorEditing(isFromVistoriador); // 🆕 Define se é do vistoriador

      // Carregar valor unitário da imobiliária
      const valorUnitario = await obterValorUnitarioMaisRecente(vistoria.imobiliaria_id);
      setValorUnitarioAtual(valorUnitario);

      // Preencher formulário com dados da vistoria
      setVistoriaData({
        codigo: vistoria.codigo,
        imobiliariaId: vistoria.imobiliaria_id,
        vistoriadorId: vistoria.vistoriador_id,
        tipoImovelId: vistoria.tipo_imovel_id,
        tipoVistoriaId: vistoria.tipo_vistoria_id,
        endereco: vistoria.endereco,
        dataVistoria: vistoria.data_vistoria,
        area: vistoria.area_imovel.toString(),
        tipoMobiliaId: vistoria.tipo_mobilia_id,
        taxaDeslocamento: vistoria.taxa_deslocamento ? vistoria.taxa_deslocamento.toString() : '',
        desconto: vistoria.desconto ? vistoria.desconto.toString() : '',
        isExpress: vistoria.is_express
      });

      // Carregar imagens existentes da vistoria
      try {
        const imagensResult = await imagensVistoriaService.carregarImagensVistoria(vistoria.id);
        if (imagensResult.success && imagensResult.data.length > 0) {
          // Converter dados do banco para o formato do componente
          const imagensFormatadas = imagensResult.data.map(img => ({
            id: img.id,
            nome: img.nome_arquivo,
            dataUrl: img.url_publica,
            tamanho: img.tamanho_arquivo,
            fromDatabase: true, // Flag para identificar que veio do banco
            databaseId: img.id
          }));
          setImagensTrena(imagensFormatadas);
        } else {
          setImagensTrena([]);
        }
      } catch (error) {
        console.error('Erro ao carregar imagens da vistoria:', error);
        setImagensTrena([]);
      }
      
      setShowNovaVistoriaModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal de edição:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  // 🆕 Função para confirmar exclusão
  const handleConfirmarExclusao = (vistoria) => {
    setVistoriaParaExcluir(vistoria);
    setShowConfirmExcluir(true);
  };

  // 🆕 Função para excluir vistoria
  const handleExcluirVistoria = async () => {
    if (!vistoriaParaExcluir) return;

    try {
      setExcluindoVistoria(true);

      // Primeiro, excluir as imagens associadas à vistoria
      try {
        await imagensVistoriaService.excluirImagensVistoria(vistoriaParaExcluir.id);
        console.log('✅ Imagens da vistoria excluídas com sucesso');
      } catch (imagensError) {
        console.warn('⚠️ Erro ao excluir imagens da vistoria:', imagensError);
        // Continua com a exclusão da vistoria mesmo se falhar ao excluir imagens
      }

      const result = await vistoriasService.excluirVistoria(vistoriaParaExcluir.id);
      
      if (result.success) {
        // Atualizar lista de vistorias
        setVistorias(vistorias.filter(v => v.id !== vistoriaParaExcluir.id));
        
        // Fechar modal de confirmação
        setShowConfirmExcluir(false);
        setVistoriaParaExcluir(null);
        
        // Mostrar mensagem de sucesso
        alert(`Vistoria ${vistoriaParaExcluir.codigo} excluída com sucesso! Os créditos foram devolvidos à imobiliária.`);
      } else {
        alert('Erro ao excluir vistoria: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir vistoria:', error);
      alert('Erro interno do servidor');
    } finally {
      setExcluindoVistoria(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando dashboard...</p>
            </div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout deslogar={deslogar} usuarioLogado={usuarioLogado}>
      <Container fluid className="dashboard-container-main" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="p-3">
                {/* 🆕 Navegação por Tabs */}
                <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
                  <Nav variant="tabs" className="mb-3">
                    {/* 🆕 Aba Administrador - Apenas para admins */}
                    {usuarioLogado?.tipo === 'admin' && (
                      <Nav.Item>
                        <Nav.Link eventKey="administrador">
                          <FontAwesomeIcon icon={faUserTie} className="me-2" />
                          Dashboard Administrador
                          <span className="text-muted ms-2">({vistoriasFiltradas.length} vistorias)</span>
                        </Nav.Link>
                      </Nav.Item>
                    )}
                    <Nav.Item>
                      <Nav.Link eventKey="vistoriador">
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        Dashboard Vistoriador
                        <span className="text-muted ms-2">({vistoriasFiltradas.length} vistorias)</span>
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    {/* Aba do Administrador - Apenas para admins */}
                    {usuarioLogado?.tipo === 'admin' && (
                      <Tab.Pane eventKey="administrador">
                      <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-${isMobile ? 'stretch' : 'center'} mb-3 gap-2`}>
                        <div className={isMobile ? 'text-center mb-2' : ''}>
                          <small className="text-muted">
                            Visualização de TODAS as vistorias - Criar, editar e excluir
                          </small>
                        </div>
                        <div className={`d-flex gap-2 ${isMobile ? 'flex-column w-100' : ''}`}>
                          {/* 📄 Botão para gerar relatório */}
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleGerarRelatorio(false)}
                            title="Gerar relatório em PDF"
                            disabled={loading || gerandoRelatorio || vistoriasFiltradas.length === 0}
                            className={isMobile ? 'w-100' : ''}
                          >
                            {gerandoRelatorio ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faFilePdf} className={isMobile ? 'me-2' : ''} />
                                {isMobile && 'Relatório PDF'}
                              </>
                            )}
                          </Button>

                          {/* 🔄 Botão para recarregar lista */}
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={handleRecarregarLista}
                            title="Recarregar lista de vistorias"
                            disabled={loading}
                            className={isMobile ? 'w-100' : ''}
                          >
                            <FontAwesomeIcon icon={faSync} spin={loading} className={isMobile ? 'me-2' : ''} />
                            {isMobile && 'Recarregar'}
                          </Button>
                          
                          <Button 
                            variant="success" 
                            onClick={handleShowNovaVistoriaModal}
                            disabled={loading || loadingModal}
                            className={isMobile ? 'w-100' : 'text-nowrap'}
                          >
                            {loadingModal ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Carregando...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                Nova Vistoria
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Total de Valores */}
                      <Row className="mb-3">
                        <Col md={12}>
                          <div className={`d-flex ${isMobile ? 'justify-content-center flex-column align-items-center' : 'justify-content-between align-items-center'} total-value-mobile`}>
                            <div className={`d-flex ${isMobile ? 'w-100 justify-content-center mb-2' : ''} align-items-center`}>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                                className={isMobile ? 'w-100' : ''}
                              >
                                <FontAwesomeIcon icon={faFilter} className="me-2" />
                                Filtros
                                <FontAwesomeIcon 
                                  icon={filtrosVisiveis ? faChevronUp : faChevronDown} 
                                  className="ms-2" 
                                  size="sm"
                                />
                              </Button>
                              {/* Indicador de filtros ativos */}
                              {(filtroTexto || dataInicio || dataFim || vistoriadorFiltro) && (
                                <Badge bg="primary" className="ms-2">
                                  {[
                                    filtroTexto ? 1 : 0,
                                    dataInicio ? 1 : 0,
                                    dataFim ? 1 : 0,
                                    vistoriadorFiltro ? 1 : 0
                                  ].reduce((a, b) => a + b, 0)}
                                </Badge>
                              )}
                            </div>
                            <div className={`d-flex ${isMobile ? 'w-100 justify-content-center' : ''} align-items-center`}>
                              <span className="text-muted me-2">Total de Valores:</span>
                              <span className="fs-5 text-primary fw-bold">
                                <TotalValorVistorias vistorias={vistoriasFiltradas} />
                              </span>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Filtros - Aba Administrador */}
                      {filtrosVisiveis && (
                      <Row className="mb-3 dashboard-filters-mobile" style={{ animation: 'slideDown 0.3s ease-out' }}>
                        <Col xs={12} md={6} lg={3}>
                          <InputGroup size="sm">
                            <InputGroup.Text>
                              <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Filtrar vistorias..."
                              value={filtroTexto}
                              onChange={(e) => setFiltroTexto(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                        <Col xs={6} md={3} lg={2}>
                          <Form.Control
                            type="date"
                            size="sm"
                            placeholder="Data início"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            title="Data de início"
                          />
                        </Col>
                        <Col xs={6} md={3} lg={2}>
                          <Form.Control
                            type="date"
                            size="sm"
                            placeholder="Data fim"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            title="Data final"
                          />
                        </Col>
                        <Col xs={12} md={6} lg={3}>
                          <Form.Select
                            size="sm"
                            value={vistoriadorFiltro}
                            onChange={(e) => setVistoriadorFiltro(e.target.value)}
                          >
                            <option value="">Todos os vistoriadores</option>
                            {vistoriadores.map(vistoriador => (
                              <option key={vistoriador.id} value={vistoriador.id}>
                                {vistoriador.nome}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={12} md={6} lg={2}>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              setFiltroTexto('');
                              setDataInicio('');
                              setDataFim('');
                              setVistoriadorFiltro('');
                            }}
                          >
                            Limpar Filtros
                          </Button>
                        </Col>
                      </Row>
                      )}

                      <TabelaVistorias 
                        vistoriasFiltradas={vistoriasFiltradas} 
                        formatDate={formatDate} 
                        handleEditarVistoria={handleEditarVistoria} 
                        handleConfirmarExclusao={handleConfirmarExclusao}
                        isVistoriadorView={false}
                        usuarioLogado={usuarioLogado}
                      />
                    </Tab.Pane>
                    )}

                    {/* Aba do Vistoriador */}
                    <Tab.Pane eventKey="vistoriador">
                      <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-${isMobile ? 'stretch' : 'center'} mb-3 gap-2`}>
                        <div className={isMobile ? 'text-center mb-2' : ''}>
                          <small className="text-muted">
                            Visualização apenas das SUAS vistorias - Edição permitida
                          </small>
                        </div>
                        <div className={`d-flex gap-2 ${isMobile ? 'flex-column w-100' : ''}`}>
                          {/* 📄 Botão para gerar relatório de remuneração */}
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleGerarRelatorio(true)}
                            title="Gerar relatório de remuneração em PDF"
                            disabled={loading || gerandoRelatorio || vistoriasFiltradas.length === 0}
                            className={isMobile ? 'w-100' : ''}
                          >
                            {gerandoRelatorio ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faFilePdf} className="me-1" />
                                {isMobile ? 'Relatório PDF' : 'Relatório'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Total de Remuneração */}
                      <Row className="mb-3">
                        <Col md={12}>
                          <div className={`d-flex ${isMobile ? 'justify-content-center flex-column align-items-center' : 'justify-content-between align-items-center'} total-value-mobile`}>
                            <div className={`d-flex ${isMobile ? 'w-100 justify-content-center mb-2' : ''} align-items-center`}>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                                className={isMobile ? 'w-100' : ''}
                              >
                                <FontAwesomeIcon icon={faFilter} className="me-2" />
                                Filtros
                                <FontAwesomeIcon 
                                  icon={filtrosVisiveis ? faChevronUp : faChevronDown} 
                                  className="ms-2" 
                                  size="sm"
                                />
                              </Button>
                              {/* Indicador de filtros ativos */}
                              {(filtroTexto || dataInicio || dataFim) && (
                                <Badge bg="primary" className="ms-2">
                                  {[
                                    filtroTexto ? 1 : 0,
                                    dataInicio ? 1 : 0,
                                    dataFim ? 1 : 0
                                  ].reduce((a, b) => a + b, 0)}
                                </Badge>
                              )}
                            </div>
                            <div className={`d-flex ${isMobile ? 'w-100 justify-content-center' : ''} align-items-center`}>
                              <span className="text-muted me-2">Total de Remuneração:</span>
                              <span className="fs-5 text-success fw-bold">
                                <TotalRemuneracaoVistoriadores vistorias={vistoriasFiltradas} />
                              </span>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Filtros - Aba Vistoriador */}
                      {filtrosVisiveis && (
                      <Row className="mb-3 dashboard-filters-mobile" style={{ animation: 'slideDown 0.3s ease-out' }}>
                        <Col xs={12} md={6} lg={4}>
                          <InputGroup size="sm">
                            <InputGroup.Text>
                              <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Filtrar vistorias..."
                              value={filtroTexto}
                              onChange={(e) => setFiltroTexto(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                        <Col xs={6} md={3} lg={2}>
                          <Form.Control
                            type="date"
                            size="sm"
                            placeholder="Data início"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            title="Data de início"
                          />
                        </Col>
                        <Col xs={6} md={3} lg={2}>
                          <Form.Control
                            type="date"
                            size="sm"
                            placeholder="Data fim"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            title="Data final"
                          />
                        </Col>
                        <Col xs={12} md={6} lg={2}>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              setFiltroTexto('');
                              setDataInicio('');
                              setDataFim('');
                            }}
                          >
                            Limpar Filtros
                          </Button>
                        </Col>
                      </Row>
                      )}

                      <TabelaVistorias 
                        vistoriasFiltradas={vistoriasFiltradas} 
                        formatDate={formatDate} 
                        handleEditarVistoria={handleEditarVistoria} 
                        handleConfirmarExclusao={handleConfirmarExclusao}
                        isVistoriadorView={true}
                        usuarioLogado={usuarioLogado}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal Nova/Editar Vistoria */}
        <Modal show={showNovaVistoriaModal} onHide={handleCloseNovaVistoriaModal} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>
              {vistoriaEditando ? 
                (isVistoriadorEditing ? 'Editar Vistoria (Vistoriador)' : 'Editar Vistoria') : 
                'Nova Vistoria'
              }
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMessage && (
              <Alert variant="success">{successMessage}</Alert>
            )}
            
            {errorMessage && (
              <Alert variant="danger">{errorMessage}</Alert>
            )}
            
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Código</Form.Label>
                    <Form.Control
                      type="text"
                      name="codigo"
                      value={vistoriaData.codigo}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.codigo}
                      placeholder="Ex: VST-2025-001"
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.codigo}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data da Vistoria</Form.Label>
                    <Form.Control
                      type="date"
                      name="dataVistoria"
                      value={vistoriaData.dataVistoria}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.dataVistoria}
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.dataVistoria}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Imobiliária</Form.Label>
                    <Form.Select
                      name="imobiliariaId"
                      value={vistoriaData.imobiliariaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.imobiliariaId}
                      disabled={isVistoriadorEditing}
                      style={isVistoriadorEditing ? { cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Selecione uma imobiliária</option>
                      {imobiliarias.map(imobiliaria => (
                        <option key={imobiliaria.id} value={imobiliaria.id}>
                          {imobiliaria.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.imobiliariaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vistoriador</Form.Label>
                    <Form.Select
                      name="vistoriadorId"
                      value={vistoriaData.vistoriadorId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.vistoriadorId}
                      disabled={isVistoriadorEditing}
                      style={isVistoriadorEditing ? { cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Selecione um vistoriador</option>
                      {vistoriadores.map(vistoriador => (
                        <option key={vistoriador.id} value={vistoriador.id}>
                          {vistoriador.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.vistoriadorId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Imóvel</Form.Label>
                    <Form.Select
                      name="tipoImovelId"
                      value={vistoriaData.tipoImovelId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoImovelId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposImovel.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoImovelId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Vistoria</Form.Label>
                    <Form.Select
                      name="tipoVistoriaId"
                      value={vistoriaData.tipoVistoriaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoVistoriaId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposVistoria.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoVistoriaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Mobília</Form.Label>
                    <Form.Select
                      name="tipoMobiliaId"
                      value={vistoriaData.tipoMobiliaId}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.tipoMobiliaId}
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposMobilia.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.tipoMobiliaId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Endereço</Form.Label>
                    <Form.Control
                      type="text"
                      name="endereco"
                      value={vistoriaData.endereco}
                      onChange={handleVistoriaInputChange}
                      isInvalid={!!vistoriaErrors.endereco}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                    />
                    <Form.Control.Feedback type="invalid">
                      {vistoriaErrors.endereco}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Área do Imóvel</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="area"
                        value={vistoriaData.area}
                        onChange={handleVistoriaInputChange}
                        isInvalid={!!vistoriaErrors.area}
                        placeholder="120"
                        min="1"
                        step="0.01"
                      />
                      <InputGroup.Text>m²</InputGroup.Text>
                      <Form.Control.Feedback type="invalid">
                        {vistoriaErrors.area}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

                                  <Row>
                {/* 🆕 Taxa de Deslocamento - ReadOnly para vistoriador */}
                <Col md={isVistoriadorEditing ? 6 : 4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Taxa de Deslocamento</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="taxaDeslocamento"
                        value={vistoriaData.taxaDeslocamento}
                        onChange={handleVistoriaInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        readOnly={isVistoriadorEditing}
                        style={isVistoriadorEditing ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      />
                      <InputGroup.Text>créditos</InputGroup.Text>
                    </InputGroup>
                    {!isVistoriadorEditing && (
                      <Form.Text className="text-muted">
                        Valor fixo adicionado ao consumo total (não multiplicado pela área)
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                
                {/* 🆕 Desconto - Oculto para vistoriador */}
                {!isVistoriadorEditing && (
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Desconto</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="desconto"
                          value={vistoriaData.desconto}
                          onChange={handleVistoriaInputChange}
                          placeholder="0,00"
                          min="0"
                          step="0.01"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Valor do desconto em reais aplicado ao valor final
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
                
                {/* 🆕 Serviço Express - Disabled para vistoriador */}
                <Col md={isVistoriadorEditing ? 6 : 4}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="isExpress"
                      checked={vistoriaData.isExpress}
                      onChange={handleVistoriaInputChange}
                      disabled={isVistoriadorEditing}
                      style={isVistoriadorEditing ? { cursor: 'not-allowed' } : {}}
                      label={
                        <span style={isVistoriadorEditing ? { color: '#6c757d', cursor: 'not-allowed' } : {}}>
                          <FontAwesomeIcon icon={faBolt} className="text-warning me-1" />
                          Serviço Express
                        </span>
                      }
                    />
                    {!isVistoriadorEditing && (
                      <Form.Text className="text-muted">
                        Marque esta opção se for um serviço com atendimento prioritário
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                {/* Campo Consumo - Sempre visível */}
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Consumo</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={calculateConsumo().toFixed(2)}
                        readOnly
                        className="text-end fw-bold"
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <InputGroup.Text>créditos</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Cálculo automático baseado na área e parâmetros
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Seção de Upload de Imagens da Trena a Laser - Apenas para edição */}
              {vistoriaEditando && (
                <Row>
                  <Col md={12}>
                    <ImageUploadTrena 
                      imagens={imagensTrena}
                      onImagensChange={setImagensTrena}
                      maxImages={2}
                    />
                  </Col>
                </Row>
              )}

              {/* Seção de Valor Monetário */}
              {vistoriaData.imobiliariaId && valorUnitarioAtual > 0 && (
                <Row>
                  <Col md={12}>
                    <Alert variant="info" className="text-center">
                      {(() => {
                        if (isVistoriadorEditing) {
                          // 🆕 Mostrar remuneração do vistoriador
                          const valorUnitarioVistoriador = vistoriaEditando?.valor_unitario_vistoriador || 0;
                          const remuneracao = calculateConsumo() * valorUnitarioVistoriador;
                          
                          return (
                            <>
                              <h5 className="mb-1 text-success">
                                <strong>Sua Remuneração: {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(remuneracao)}</strong>
                              </h5>
                              <div className="text-muted">
                                <small>
                                  {calculateConsumo().toFixed(2)} créditos × {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(valorUnitarioVistoriador)} = {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(remuneracao)}
                                </small>
                              </div>
                            </>
                          );
                        } else {
                          // Mostrar valor da vistoria para a imobiliária (admin)
                          const valorBase = calculateConsumo() * valorUnitarioAtual;
                          const desconto = parseFloat(vistoriaData.desconto) || 0;
                          const valorFinal = Math.max(0, valorBase - desconto);
                          
                          return (
                            <>
                              <h5 className="mb-1">
                                <strong>Valor da Vistoria: {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(valorFinal)}</strong>
                              </h5>
                              <div className="text-muted">
                                <small>
                                  {calculateConsumo().toFixed(2)} créditos × {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(valorUnitarioAtual)} = {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(valorBase)}
                                </small>
                                {desconto > 0 && (
                                  <div>
                                    <small>
                                      Desconto aplicado: -{new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(desconto)}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        }
                      })()}
                    </Alert>
                  </Col>
                </Row>
              )}

              {/* 🆕 Alerta de créditos insuficientes */}
              {vistoriaData.imobiliariaId && valorUnitarioAtual > 0 && creditosDisponiveis < calculateConsumo() && !isVistoriadorEditing && (
                <Row>
                  <Col md={12}>
                    <Alert variant="danger" className="text-center">
                      <strong>⚠️ Créditos insuficientes!</strong>
                      <br />
                      <div className="mt-2">
                        <small>
                          <strong>Créditos disponíveis:</strong> {creditosDisponiveis.toFixed(2)} créditos
                          <br />
                          <strong>Créditos necessários:</strong> {calculateConsumo().toFixed(2)} créditos
                          <br />
                          <strong>Saldo após vistoria:</strong> {(creditosDisponiveis - calculateConsumo()).toFixed(2)} créditos
                        </small>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          Esta vistoria pode ser lançada mesmo com créditos insuficientes. 
                          O saldo da imobiliária ficará negativo.
                        </small>
                      </div>
                    </Alert>
                  </Col>
                </Row>
              )}

              {/* Alerta caso não haja vendas de crédito */}
              {vistoriaData.imobiliariaId && valorUnitarioAtual === 0 && (
                <Row>
                  <Col md={12}>
                    <Alert variant="warning" className="text-center">
                      <strong>⚠️ Atenção:</strong> Esta imobiliária ainda não possui créditos cadastrados.
                      <br />
                      <small>É necessário realizar uma venda de créditos antes de lançar vistorias.</small>
                    </Alert>
                  </Col>
                </Row>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseNovaVistoriaModal}>
              Cancelar
            </Button>
                            <Button 
                  variant="primary" 
                  onClick={handleSaveVistoria}
                  disabled={salvandoVistoria || imobiliarias.length === 0 || vistoriadores.length === 0}
                >
                  {salvandoVistoria ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={vistoriaEditando ? faEdit : faPlus} className="me-1" />
                      {vistoriaEditando ? 'Atualizar Vistoria' : 'Cadastrar Vistoria'}
                    </>
                  )}
                </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal show={showConfirmExcluir} onHide={() => setShowConfirmExcluir(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar Exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita.
            </Alert>
            <p>
              Deseja realmente excluir a vistoria <strong>{vistoriaParaExcluir?.codigo}</strong>?
            </p>
            <p className="text-muted">
              Os créditos consumidos (<strong>{vistoriaParaExcluir?.consumo_calculado} créditos</strong>) 
              serão automaticamente devolvidos à imobiliária <strong>{vistoriaParaExcluir?.imobiliarias?.nome}</strong>.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmExcluir(false)}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleExcluirVistoria}
              disabled={excluindoVistoria}
            >
              {excluindoVistoria ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Excluindo...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} className="me-1" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>


      </Container>
    </DashboardLayout>
  );
};

export default Dashboard; 