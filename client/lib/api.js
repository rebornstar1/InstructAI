const API_URL = 'http://localhost:8007/api';

export async function fetchWithAuth(endpoint, options = {}) {
  console.log("okay" , options)
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    console.log("TOKEN" , token)
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log("configg" , config)
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    
  });
  // const response = await fetch(`${API_URL}${endpoint}`, config);
  
  
  
  return response;
}