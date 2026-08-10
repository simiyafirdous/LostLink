import api from "./axios";

export const getItemMatches = async (itemId) => {
  const response = await api.get(`/items/${itemId}/matches`);
  return response.data;
};

export const getVerifyQuestions = async (itemId) => {
  const response = await api.get(`/items/${itemId}/verify-questions`);
  return response.data;
};
