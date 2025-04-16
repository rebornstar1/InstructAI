const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';


export async function fetchWithAuth(endpoint, options = {}) {
  
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

  
  const response = await fetch(`${API_URL}/api/users/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    
  });
  // const response = await fetch(`${API_URL}/api${endpoint}`, config);
  
  
  
  return response;
}

export async function getStreaKWithAuth(endpoint, options = {}) {
  
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    console.log("TOKEN" , token)
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}/api/users/record`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    
  });
    
  
  return response;
}