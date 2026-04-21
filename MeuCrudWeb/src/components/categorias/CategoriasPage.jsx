// src/components/categorias/CategoriasPage.jsx

// Este é o componente "orquestrador" da página de Categorias.
// Responsabilidades:
//   1. Carregar dados da API (categorias + produtos)
//   2. Gerenciar estados de UI (modal aberto, editando, deletando)
//   3. Chamar os services para CRUD
//   4. Otimizar a UI através de atualizações locais (State Lifting/Imutabilidade)

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Tag } from 'lucide-react';
import {
  getCategorias,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
} from '../../services/categoriaService';
import { getProdutos } from '../../services/produtoService';
import { useToast } from '../../hooks/useToast';
import CategoriaTable from './CategoriaTable';
import CategoriaFormModal from './CategoriaFormModal';
import ConfirmDialog from '../ui/ConfirmDialog';

function CategoriasPage() {
  // --- Estados de dados ---
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Estados de UI (controle de modais) ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [categoriaDeletando, setCategoriaDeletando] = useState(null);

  const toast = useToast();

  // Carrega dados quando o componente é montado
  useEffect(() => {
    carregarDados();
  }, []);

  // Carregamento inicial (necessário para popular o estado pela primeira vez)
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [dadosCategorias, dadosProdutos] = await Promise.all([
        getCategorias(),
        getProdutos(),
      ]);
      setCategorias(dadosCategorias);
      setProdutos(dadosProdutos);
    } catch (error) {
      toast.error('Não foi possível carregar os dados. Verifique se a API está rodando.');
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosPorCategoria = (categoriaId) => {
    return produtos.filter((p) => p.categoriaId === categoriaId).length;
  };

  const handleNovo = () => {
    setCategoriaEditando(null);
    setIsFormModalOpen(true);
  };

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setIsFormModalOpen(true);
  };

  // =====================================================================
  // HANDLER DE SALVAR OTIMIZADO (Atualização Local)
  // =====================================================================
  const handleSalvar = async (categoria) => {
    try {
      if (categoriaEditando) {
        // ATUALIZAR — PUT retorna 204 (sem body)
        await atualizarCategoria(categoria.id, categoria);

        // Atualização local do array: substitui apenas o item alterado
        setCategorias(prev =>
          prev.map(cat => cat.id === categoria.id ? categoria : cat)
        );

        toast.success(`Categoria "${categoria.nome}" atualizada com sucesso!`);
      } else {
        // CRIAR — POST retorna 201 com o objeto criado (incluindo o novo ID)
        const novaCategoria = await criarCategoria(categoria);

        // Atualização local do array: adiciona o novo objeto ao final da lista
        setCategorias(prev => [...prev, novaCategoria]);

        toast.success(`Categoria "${categoria.nome}" cadastrada com sucesso!`);
      }

      setIsFormModalOpen(false);
      setCategoriaEditando(null);
      // Otimização: Não chamamos carregarDados() para evitar tráfego de rede extra
    } catch (error) {
      toast.error('Erro ao salvar a categoria.');
      console.error('Erro ao salvar:', error);
    }
  };

  // =====================================================================
  // HANDLERS DE DELEÇÃO OTIMIZADOS (Atualização Local)
  // =====================================================================
  const handleConfirmarDelete = (categoria) => {
    setCategoriaDeletando(categoria);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletar = async () => {
    try {
      // DELETAR — DELETE retorna 204
      await deletarCategoria(categoriaDeletando.id);

      // Atualização local do array: remove o item excluído através de um filtro
      setCategorias(prev =>
        prev.filter(cat => cat.id !== categoriaDeletando.id)
      );

      toast.success(`Categoria "${categoriaDeletando.nome}" removida com sucesso!`);
      setIsDeleteDialogOpen(false);
      setCategoriaDeletando(null);
      // Otimização: Não chamamos carregarDados()
    } catch (error) {
      const mensagem =
        error.response?.data?.mensagem || 'Erro ao deletar a categoria.';
      toast.error(mensagem);
      setIsDeleteDialogOpen(false);
      console.error('Erro ao deletar:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Categorias</h1>
            <p className="text-sm text-gray-500">
              {categorias.length}{' '}
              {categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarDados}
            title="Recarregar lista"
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-3 text-gray-500">Carregando categorias...</span>
        </div>
      ) : (
        <CategoriaTable
          categorias={categorias}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditar={handleEditar}
          onDeletar={handleConfirmarDelete}
          produtosPorCategoria={produtosPorCategoria}
        />
      )}

      <CategoriaFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCategoriaEditando(null);
        }}
        categoriaEditando={categoriaEditando}
        onSalvar={handleSalvar}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCategoriaDeletando(null);
        }}
        onConfirm={handleDeletar}
        title="Deletar Categoria"
        message={
          categoriaDeletando
            ? `Tem certeza que deseja excluir a categoria "${categoriaDeletando.nome}"? Categorias com produtos associados não podem ser deletadas.`
            : ''
        }
      />
    </div>
  );
}

export default CategoriasPage;