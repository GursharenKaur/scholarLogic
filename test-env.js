// Test environment variables
console.log('🔍 Testing Environment Variables...');
console.log('NEXT_PUBLIC_MEGALLM_API_KEY exists:', !!process.env.NEXT_PUBLIC_MEGALLM_API_KEY);
console.log('MEGALLM_API_KEY exists:', !!process.env.MEGALLM_API_KEY);
console.log('API Key value:', process.env.NEXT_PUBLIC_MEGALLM_API_KEY || process.env.MEGALLM_API_KEY ? 'SET' : 'NOT SET');

// Test basic fetch to Mega LLM API
async function testAPI() {
  const apiKey = process.env.NEXT_PUBLIC_MEGALLM_API_KEY || process.env.MEGALLM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ MEGALLM_API_KEY not found in environment variables');
    return false;
  }

  try {
    console.log('🌐 Testing API connection to https://api.megallm.com/v1/chat/completions');
    
    const response = await fetch('https://api.megallm.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v3.1',
        messages: [
          {
            role: 'user',
            content: 'Test message - respond with "API working" if successful'
          }
        ],
        max_tokens: 50
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ API Response:', result);
    return true;

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    return false;
  }
}

testAPI();
