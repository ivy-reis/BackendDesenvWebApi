// src/components/produtos/DetalheModal.jsx

// Este modal exibe, cria, edita e remove os detalhes técnicos de um produto.
// É o componente mais complexo deste módulo porque gerencia 3 estados:
//   1. Carregando (buscando da API)
//   2. Sem detalhe (produto nunca teve detalhe — formulário vazio)
//   3. Com detalhe (produto já tem detalhe — formulário preenchido)
//
// Fluxo completo:
//   Abre modal → GET /api/detalhesproduto/produto/{id}
//     → 200: preenche formulário, banner verde, botão "Atualizar"
//     → 404: formulário vazio, banner amarelo, botão "Cadastrar"
//   Salvar → POST (criar) ou PUT (atualizar), dependendo do estado
//   Remover → DELETE → limpa formulário, volta para estado "sem detalhe"

import { useState, useEffect } from 'react';
import { FileText, Save, Trash2, Loader } from 'lucide-react';
import Modal from '../ui/Modal';
import {
  getDetalhePorProduto,
  criarDetalhe,
  atualizarDetalhe,
  deletarDetalhe,
} from '../../services/detalheProdutoService';
import { useToast } from '../../hooks/useToast';

// Props:
// - isOpen: boolean — modal visível?
// - onClose: função — fechar modal
// - produto: objeto — o produto cujos detalhes queremos ver/editar
function DetalheModal({ isOpen, onClose, produto }) {
  // Estado do detalhe retornado pela API (objeto completo ou null)
  const [detalhe, setDetalhe] = useState(null);

  // Controla o spinner de carregamento
  const [loading, setLoading] = useState(false);

  // Flag que indica se o detalhe JÁ EXISTE no banco.
  // true  → o GET retornou 200 → o formulário é preenchido → Salvar = PUT
  // false → o GET retornou 404 → formulário vazio → Salvar = POST
  const [existe, setExiste] = useState(false);

  // Campos do formulário (cada um corresponde a uma coluna no banco)
  const [especificacoes, setEspecificacoes] = useState('');
  const [garantia, setGarantia] = useState('');
  const [paisDeOrigem, setPaisDeOrigem] = useState('');
  const [pesoGramas, setPesoGramas] = useState('');

  const toast = useToast();

  // =====================================================================
  // Efeito: busca o detalhe quando o modal abre
  //
  // O array de dependências [isOpen, produto] faz com que este efeito
  // execute toda vez que:
  //   - O modal abre (isOpen muda para true)
  //   - O produto muda (outro produto foi selecionado)
  //
  // A condição "if (isOpen && produto)" evita buscar quando o modal
  // está fechado ou quando não há produto selecionado.
  // =====================================================================
  useEffect(() => {
    if (isOpen && produto) {
      carregarDetalhe();
    }
  }, [isOpen, produto]);

  // =====================================================================
  // Busca o detalhe do produto na API
  //
  // Esta função trata o 404 como "sem detalhe" (não como erro).
  // =====================================================================
  const carregarDetalhe = async () => {
    try {
      setLoading(true);
      const data = await getDetalhePorProduto(produto.id);

      // Sucesso (200) — detalhe existe no banco
      setDetalhe(data);
      setExiste(true);
      // Preenche os campos com os dados existentes
      setEspecificacoes(data.especificacoes || '');
      setGarantia(data.garantia || '');
      setPaisDeOrigem(data.paisDeOrigem || '');
      setPesoGramas(data.pesoGramas?.toString() || '');
    } catch (error) {
      if (error.response?.status === 404) {
        // =====================================================
        // 404 = produto não tem detalhe (NORMAL, não é erro!)
        //
        // Limpa tudo e prepara o formulário para CRIAR.
        // =====================================================
        setDetalhe(null);
        setExiste(false);
        setEspecificacoes('');
        setGarantia('');
        setPaisDeOrigem('');
        setPesoGramas('');
      } else {
        // Erro real (500, timeout, API fora do ar, etc.)
        toast.error('Erro ao carregar detalhes do produto.');
        console.error('Erro:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================================
  // Salvar: cria ou atualiza dependendo do estado "existe"
  //
  // Se existe === true  → PUT /api/detalhesproduto/{detalhe.id}
  // Se existe === false → POST /api/detalhesproduto
  // =====================================================================
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      // Monta o objeto com os dados do formulário
      const dados = {
        especificacoes,
        garantia,
        paisDeOrigem,
        // Converte string para número, ou null se vazio
        pesoGramas: pesoGramas ? parseFloat(pesoGramas) : null,
        produtoId: produto.id,
      };

      if (existe && detalhe) {
        // ATUALIZAR — detalhe já existe no banco
        dados.id = detalhe.id; // PUT precisa do ID do detalhe
        await atualizarDetalhe(detalhe.id, dados);
        toast.success('Detalhes atualizados com sucesso!');
      } else {
        // CRIAR — detalhe ainda não existe
        await criarDetalhe(dados);
        toast.success('Detalhes cadastrados com sucesso!');
        setExiste(true); // Agora o detalhe existe
      }

      // Recarrega os dados do banco para manter tudo sincronizado
      await carregarDetalhe();
    } catch (error) {
      toast.error('Erro ao salvar os detalhes.');
      console.error('Erro:', error);
    }
  };

  // =====================================================================
  // Remover: deleta o detalhe e limpa o formulário
  //
  // Após remover, o produto volta ao estado "sem detalhe":
  //   - Banner muda de verde para amarelo
  //   - Botão muda de "Atualizar" para "Cadastrar"
  //   - Botão "Remover" desaparece
  // =====================================================================
  const handleDeletar = async () => {
  // Verificação de segurança: detalhe existe e tem um ID válido?
  if (!detalhe || !detalhe.id) {
    toast.error('Não foi possível identificar o ID do detalhe para remoção.');
    return;
  }

  try {
    // Agora o id não será mais 'undefined'
    await deletarDetalhe(detalhe.id);
    toast.success('Detalhes removidos com sucesso!');

    // Reseta todos os estados para voltar ao modo "Cadastrar" (banner amarelo)
    setDetalhe(null);
    setExiste(false);
    setEspecificacoes('');
    setGarantia('');
    setPaisDeOrigem('');
    setPesoGramas('');
  } catch (error) {
    toast.error('Erro ao remover os detalhes.');
    console.error('Erro ao deletar:', error);
  }
  };

  // Se não há produto selecionado, não renderiza nada
  if (!produto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes — ${produto.nome}`} size="lg">
      {/* Estado de carregamento */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-500">Carregando detalhes...</span>
        </div>
      ) : (
        <form onSubmit={handleSalvar} className="space-y-4">

          {/* ============================================================= */}
          {/* BANNER DE STATUS                                               */}
          {/*                                                                */}
          {/* Muda de cor e texto baseado no estado:                         */}
          {/* - Verde: "Este produto já possui detalhes cadastrados"         */}
          {/* - Amarelo: "Este produto ainda não possui detalhes"            */}
          {/*                                                                */}
          {/* Isso dá ao usuário um feedback visual imediato sobre o que     */}
          {/* está acontecendo — se está criando ou editando.                */}
          {/* ============================================================= */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            existe ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            <FileText className="w-4 h-4" />
            {existe
              ? 'Este produto já possui detalhes cadastrados. Edite abaixo.'
              : 'Este produto ainda não possui detalhes. Preencha abaixo para cadastrar.'}
          </div>

          {/* Campo Especificações Técnicas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especificações Técnicas
            </label>
            <textarea
              value={especificacoes}
              onChange={(e) => setEspecificacoes(e.target.value)}
              placeholder="Ex: Processador: i7 13ª geração, RAM: 16GB DDR5, SSD: 512GB NVMe"
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none"
            />
          </div>

          {/* Campo Garantia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Garantia
            </label>
            <input
              type="text"
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              placeholder="Ex: 1 ano pelo fabricante + 90 dias adicionais"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>

          {/* Campos País e Peso lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País de Origem
              </label>
              <input
                type="text"
                value={paisDeOrigem}
                onChange={(e) => setPaisDeOrigem(e.target.value)}
                placeholder="Ex: China"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (gramas)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={pesoGramas}
                onChange={(e) => setPesoGramas(e.target.value)}
                placeholder="Ex: 1850"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Barra de ações */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {/* Botão "Remover Detalhes" — só aparece se o detalhe já existe */}
            {existe && (
              <button
                type="button"
                onClick={handleDeletar}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remover Detalhes
              </button>
            )}

            {/* Espaçador flexível — empurra os botões seguintes para a direita */}
            <div className="flex-1" />

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>

            {/* Botão Salvar — texto muda baseado no estado */}
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {existe ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default DetalheModal;