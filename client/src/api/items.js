import api from "./axios";

export const getItems = async (params = {}) => {
  const response = await api.get("/items", { params });
  return response.data;
};

export const getItem = async (id) => {
  const response = await api.get(`/items/${id}`);
  return response.data;
};

export const getMyItems = async () => {
  const response = await api.get("/items/mine");
  return response.data;
};

export const createItem = async (formData) => {
  const response = await api.post("/items", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateItem = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/items/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
  });
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};

export const reanalyzeItem = async (id) => {
  const response = await api.post(`/items/${id}/reanalyze`);
  return response.data;
};
