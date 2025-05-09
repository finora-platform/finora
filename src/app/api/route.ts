function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(req) {
  if (req.method === 'GET') {
    console.log(req.url);
    return new Response(null, { status: 200, headers: corsHeaders() });
  } else {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }
}
