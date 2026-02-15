export async function GET() {
  return new Response('API test working', {
    headers: { 'Content-Type': 'text/plain' }
  });
}
