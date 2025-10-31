// Cloudflare Worker to add CORS headers to R2 public URL requests
// Deploy this worker and route pub-xxxxx.r2.dev through it

export default {
  async fetch(request, env) {
    // Get the original R2 URL from the request
    const url = new URL(request.url);
    
    // Forward the request to R2
    const response = await fetch(request);
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response);
    
    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');
    newResponse.headers.set('Access-Control-Max-Age', '3600');
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: newResponse.headers
      });
    }
    
    return newResponse;
  }
};


