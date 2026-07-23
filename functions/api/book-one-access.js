const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'private, no-store'
};

export async function onRequest(context) {
  if (context.request.method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      productId: 'phios-book-one',
      purchaseState: 'not_purchased',
      accessGranted: false,
      accessConfigured: false,
      reason: 'production-commerce-not-configured'
    }), {
      status: 200,
      headers: responseHeaders
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'method_not_allowed'
  }), {
    status: 405,
    headers: {
      ...responseHeaders,
      allow: 'GET'
    }
  });
}
