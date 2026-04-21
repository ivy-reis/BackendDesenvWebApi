import axios from 'axios';

const API_URL = 'http://localhost:5189/api/produtos';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProdutos = async () => {
  const response = await api.get('/');
  return response.data;
};

export const getProduto = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const criarProduto = async (produto) => {
  const response = await api.post('/', produto);
  return response.data;
};

export const atualizarProduto = async (id, produto) => {
    // 1. Trava de segurança: se a interface esquecer de passar o 'id' separado 
    // e enviar apenas atualizarProduto(produto), nós contornamos isso aqui.
    const dados = produto !== undefined ? produto : id;
    const produtoId = produto !== undefined ? id : dados.id;

    // 2. Garantimos as tipagens numéricas que o C# exige
    const produtoParaEnviar = { 
        ...dados, 
        id: Number(produtoId),
        preco: Number(dados.preco || 0), 
        quantidade: Number(dados.quantidade || 0)
    };

    // 3. Utilizamos o Axios de forma padronizada (igual aos outros métodos)
    const response = await api.put(`/${produtoId}`, produtoParaEnviar);
    
    // Obs: Em requisições PUT bem-sucedidas, o .NET costuma retornar 
    // 204 (No Content), então response.data será vazio, o que é o comportamento correto.
    return response.data; 
};

export const deletarProduto = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};