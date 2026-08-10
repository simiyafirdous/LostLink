import api from "./axios";

export const createClaim = async (claimData) => {
  const response = await api.post("/claims", claimData);
  return response.data;
};

export const getIncomingClaims = async () => {
  const response = await api.get("/claims/incoming");
  return response.data;
};

export const getMyClaims = async () => {
  const response = await api.get("/claims/mine");
  return response.data;
};

export const updateClaimStatus = async (id, status, reviewNote = "") => {
  const response = await api.patch(`/claims/${id}`, { status, reviewNote });
  return response.data;
};
