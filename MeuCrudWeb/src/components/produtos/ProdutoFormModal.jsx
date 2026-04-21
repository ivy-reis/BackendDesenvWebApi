// src/components/produtos/ProdutoFormModal.jsx — versão atualizada com Categoria

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

// NOVO: recebe também "categorias" — a lista de categorias da API
function ProdutoFormModal({ isOpen, onClose, produtoEditando, onSalvar, categorias }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  // NOVO: estado para o ID da categoria selecionada
  // Começa com string vazia (nada selecionado)
  const [categoriaId, setCategoriaId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (produtoEditando) {
        setNome(produtoEditando.nome || '');
        setDescricao(produtoEditando.descricao || '');
        setPreco(produtoEditando.preco?.toString() || '');
        setQuantidade(produtoEditando.quantidade?.toString() || '');
        // NOVO: pré-seleciona a categoria do produto sendo editado
        // .toString() porque o value do <select> é sempre string
        setCategoriaId(produtoEditando.categoriaId?.toString() || '');
      } else {
        setNome('');
        setDescricao('');
        setPreco('');
        setQuantidade('');
        setCategoriaId('');
      }
    }
  }, [isOpen, produtoEditando]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const produto = {
      nome,
      descricao,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
    };

    // NOVO: inclui categoriaId se houver categorias disponíveis
    if (categoriaId) {
      // parseInt converte a string "3" do select para o número 3
      produto.categoriaId = parseInt(categoriaId);
    }

    if (produtoEditando) {
      produto.id = produtoEditando.id;
      produto.dataCriacao = produtoEditando.dataCriacao;
    }

    onSalvar(produto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Notebook Dell XPS 15"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>

        {/* Campo Descrição */}
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="descricao"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: 16GB RAM, SSD 512GB"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>

        {/* ============================================================= */}
        {/* NOVO: SELETOR DE CATEGORIA                                     */}
        {/*                                                                */}
        {/* O <select> é renderizado apenas se houver categorias.          */}
        {/* Isso permite que o frontend funcione mesmo se o backend de     */}
        {/* categorias não estiver pronto (degrada graciosamente).         */}
        {/*                                                                */}
        {/* "required" garante que o usuário deve selecionar uma categoria */}
        {/* antes de enviar o formulário.                                  */}
        {/*                                                                */}
        {/* Cada <option> tem:                                             */}
        {/*   - value={cat.id}: o que é enviado (número do ID)            */}
        {/*   - texto: cat.nome (o que o usuário vê)                      */}
        {/* ============================================================= */}
        {categorias && categorias.length > 0 && (
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              id="categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
            >
              {/* Opção padrão — não é selecionável como valor final por causa do required */}
              <option value="">-- Selecione uma categoria --</option>

              {/* Renderiza uma <option> para cada categoria.
                  .map() itera pelo array e retorna um elemento JSX para cada item.
                  key={cat.id} é obrigatório no React para listas — ajuda o React
                  a identificar qual item mudou, foi adicionado ou removido. */}
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campos Preço e Quantidade lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$)
            </label>
            <input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Ex: 4500.00"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade
            </label>
            <input
              id="quantidade"
              type="number"
              min="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 10"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {produtoEditando ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProdutoFormModal;