// src/services/detalheProdutoService.js
import axios from 'axios';

// 1. Removida a barra do final para evitar a "barra dupla" (//)
// 2. Padronizado o nome para 'DetalhesProduto' conforme seu Controller C#
const API_URL = 'http://localhost:5189/api/DetalhesProduto';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Busca o detalhe de um produto pelo ID do PRODUTO.
 */
export const getDetalhePorProduto = async (produtoId) => {
  // O Axios vai montar: http://localhost:5189/api/DetalhesProduto/produto/{id}
  // Note que aqui o sufixo começa com barra, mas a baseURL NÃO termina com barra.
  const response = await api.get(`/produto/${produtoId}`);
  return response.data;
};

/**
 * Cria um detalhe para um produto.
 */
export const criarDetalhe = async (detalhe) => {
  // Para a rota raiz do controller, usamos apenas '/'
  const response = await api.post('/', detalhe);
  return response.data;
};

/**
 * Atualiza um detalhe existente pelo ID do DETALHE.
 */
export const atualizarDetalhe = async (id, detalhe) => {
  const response = await api.put(`/${id}`, detalhe);
  return response.data;
};

/**
 * Remove um detalhe pelo ID do DETALHE.
 */
export const deletarDetalhe = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};