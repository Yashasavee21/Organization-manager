import axios from 'axios';

const API_URL = 'http://localhost:3000'; 

export const signup = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
