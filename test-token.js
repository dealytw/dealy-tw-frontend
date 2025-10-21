// Test script to check API token
const testToken = async () => {
  const token = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;
  const baseUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  
  console.log('Token exists:', !!token);
  console.log('Base URL:', baseUrl);
  console.log('Token preview:', token ? token.substring(0, 10) + '...' : 'No token');
  
  if (!token || !baseUrl) {
    console.log('Missing environment variables');
    return;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/topics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text.substring(0, 200));
  } catch (error) {
    console.log('Error:', error.message);
  }
};

testToken();
