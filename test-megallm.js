// Test Mega LLM API connection
const { MEGALLM_API_KEY, MEGA_LLM_CONFIG } = require('./document_parser/config.js');

async function testMegaLLM() {
  console.log('🔍 Testing Mega LLM API connection...');
  console.log('API Key exists:', !!MEGALLM_API_KEY);
  console.log('Base URL:', MEGA_LLM_CONFIG.baseURL);
  console.log('Model:', MEGA_LLM_CONFIG.model);

  try {
    const response = await fetch(`${MEGA_LLM_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEGALLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MEGA_LLM_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "API working" if you receive this.'
          }
        ],
        max_tokens: 50
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('API Response:', result);
    return true;

  } catch (error) {
    console.error('Connection Error:', error);
    return false;
  }
}

testMegaLLM();
