export async function GET(req, res) {
    if (req.method === 'GET') {
      console.log(req.query);
      return new Response(null,{status: 200})
    } else {
      return new Response('Method not allowed',{status: 405});
    }
  }
  