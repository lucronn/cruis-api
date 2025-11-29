const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const playwrightAWSLambda = require('playwright-aws-lambda');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Server-side session - ONE session for ALL clients
let serverSession = {
  credentials: null,
  createdAt: null,
  expiresAt: null,
  sessionId: null,
  isAuthenticating: false
};

const LIBRARY_CARD = '1001600244772';

// PLAYWRIGHT AUTHENTICATION (converted from original Puppeteer logic)
async function performAuthentication() {
  if (serverSession.isAuthenticating) {
    console.log('Authentication already in progress, waiting...');
    while (serverSession.isAuthenticating) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return serverSession.credentials;
  }

  serverSession.isAuthenticating = true;

  try {
    // Check if we have valid credentials
    if (serverSession.credentials && serverSession.expiresAt && new Date() < serverSession.expiresAt) {
      console.log(`[AUTH] Using existing session: ${serverSession.sessionId}`);
      serverSession.isAuthenticating = false;
      return serverSession.credentials;
    }

    console.log('[AUTH] Session expired or missing, authenticating...');

    let browser;
    try {
      const cardNumber = LIBRARY_CARD;
      const correlationId = uuidv4();
      console.log(`\n[AUTH] Starting authentication for card: ${cardNumber} (correlation=${correlationId})`);

      let page;

      console.log('[AUTH] Using playwright-aws-lambda for Firebase...');
      browser = await playwrightAWSLambda.launchChromium();
      page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
      });

      console.log('[AUTH] Navigating to EBSCO login...');

      await page.goto('https://search.ebscohost.com/login.aspx?authtype=ip,cpid&custid=s5672256&groupid=main&profile=autorepso', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('[AUTH] Waiting for card number input...');

      const inputSelector = 'input[data-auto="prompt-input"], input#prompt-input';
      await page.waitForSelector(inputSelector, { timeout: 15000 });
      await page.fill(inputSelector, cardNumber);

      console.log('[AUTH] Submitting card number...');

      await page.click('button[data-auto="login-submit-btn"]');

      console.log('[AUTH] Waiting for redirect to Motor...');

      let motorCookies = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts && !motorCookies) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const currentUrl = page.url();
        console.log(`[AUTH] Attempt ${attempts}: ${currentUrl.substring(0, 60)}...`);

        if (currentUrl.includes('motor.com')) {
          console.log('[AUTH] ✓ Reached Motor domain!');

          const allCookies = await page.context().cookies();
          const motorDomainCookies = allCookies.filter(c => c.domain.includes('motor.com'));

          console.log(`[AUTH] Captured ${motorDomainCookies.length} Motor cookies`);

          const authCookie = motorDomainCookies.find(c => c.name === 'AuthUserInfo');

          if (authCookie) {
            try {
              const decoded = Buffer.from(authCookie.value, 'base64').toString('utf-8');
              const credentials = JSON.parse(decoded);

              console.log('[AUTH] ✓ Extracted credentials:');
              console.log(`  PublicKey: ${credentials.PublicKey}`);
              console.log(`  ApiTokenKey: ${credentials.ApiTokenKey}`);
              console.log(`  Expiration: ${credentials.ApiTokenExpiration}`);

              const cookieString = motorDomainCookies
                .map(c => `${c.name}=${c.value}`)
                .join('; ');

              motorCookies = {
                ...credentials,
                _cookieString: cookieString,
                _cookies: motorDomainCookies
              };

            } catch (e) {
              console.error('[AUTH] Failed to decode AuthUserInfo:', e.message);
            }
          }
        }
      }

      await browser.close();

      if (motorCookies) {
        serverSession.credentials = motorCookies;
        serverSession.createdAt = new Date();
        serverSession.expiresAt = new Date(motorCookies.ApiTokenExpiration || Date.now() + 24 * 60 * 60 * 1000);
        serverSession.sessionId = uuidv4(); // Generate a session ID for the server-side session
        console.log(`[AUTH] ✓ Server-side session established: ${serverSession.sessionId}`);
        serverSession.isAuthenticating = false;
        return serverSession.credentials;
      } else {
        console.error('[AUTH] Authentication timeout: Failed to reach Motor domain or extract credentials');
        serverSession.isAuthenticating = false;
        return null;
      }

    } catch (error) {
      console.error('[AUTH] Error during authentication:', error.message);
      if (browser) {
        await browser.close();
      }
      serverSession.isAuthenticating = false;
      return null;
    }
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error.message);
    serverSession.isAuthenticating = false;
    return null;
  }
}

// Ensure authentication before making API calls
async function ensureAuthenticated() {
  const credentials = await performAuthentication();
  if (!credentials) {
    throw new Error('Authentication failed');
  }
  return credentials;
}

// Health check endpoint
app.get('/health', (req, res) => {
  const isAuthenticated = serverSession.credentials &&
    serverSession.expiresAt &&
    new Date() < serverSession.expiresAt;

  res.json({
    status: 'ok',
    authenticated: isAuthenticated,
    sessionId: serverSession.sessionId,
    expiresAt: serverSession.expiresAt,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// DIRECT API.MOTOR.COM ACCESS (Token Authentication)
// ============================================================

// Expose current token credentials (for debugging)
app.get('/api/motor-proxy/credentials', async (req, res) => {
  try {
    const credentials = await ensureAuthenticated();
    
    // Return sanitized credentials (no full cookie string)
    res.json({
      publicKey: credentials.PublicKey,
      apiTokenKey: credentials.ApiTokenKey,
      apiTokenValue: credentials.ApiTokenValue,
      expiration: credentials.ApiTokenExpiration,
      userName: credentials.UserName,
      subscriptions: credentials.Subscriptions,
      // For Token auth header
      tokenAuthHeader: `Token ${credentials.PublicKey}:${credentials.ApiTokenValue}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Not authenticated', message: error.message });
  }
});

// Direct proxy to api.motor.com using Token authentication
// Usage: /api/motor-proxy/direct/v1/HelloWorld
app.all('/api/motor-proxy/direct/*', async (req, res) => {
  try {
    console.log(`[DIRECT-API] ${req.method} ${req.url}`);
    
    const credentials = await ensureAuthenticated();
    
    // Extract path after /direct/
    const apiPath = req.url.replace('/api/motor-proxy/direct', '');
    const targetUrl = `https://api.motor.com${apiPath}`;
    
    console.log(`[DIRECT-API] Token auth to: ${targetUrl}`);
    console.log(`[DIRECT-API] PublicKey: ${credentials.PublicKey}`);
    console.log(`[DIRECT-API] TokenKey: ${credentials.ApiTokenKey}`);
    
    // Generate timestamp (Unix epoch)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Use Token authentication with timestamp
    const authHeader = `Token ${credentials.PublicKey}:${credentials.ApiTokenValue}`;
    
    const headers = {
      'Authorization': authHeader,
      'X-Date': timestamp,
      'Date': new Date().toUTCString(),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    console.log(`[DIRECT-API] Timestamp: ${timestamp}`);
    console.log(`[DIRECT-API] Auth: ${authHeader}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[DIRECT-API] Response: ${response.status}`);
    console.log(`[DIRECT-API] Body: ${JSON.stringify(response.data).substring(0, 200)}`);
    
    // Forward response
    res.status(response.status);
    
    // Copy headers
    if (response.headers['content-type']) {
      res.set('Content-Type', response.headers['content-type']);
    }
    res.set('Access-Control-Allow-Origin', '*');
    
    res.send(response.data);
    
  } catch (error) {
    console.error('[DIRECT-API] Error:', error.message);
    res.status(500).json({ error: 'Direct API call failed', message: error.message });
  }
});

// HMAC-SHA256 signing for Shared auth scheme
// This generates signatures for api.motor.com if we had the private key
// Since private key is server-side only, this is for reference/testing
const crypto = require('crypto');

function generateHmacSignature(privateKey, publicKey, method, timestamp, uriPath) {
  const signatureData = `${publicKey}\n${method}\n${timestamp}\n${uriPath}`;
  const hmac = crypto.createHmac('sha256', privateKey);
  hmac.update(signatureData);
  return hmac.digest('base64');
}

// Endpoint to test HMAC signature generation (requires private key)
app.post('/api/motor-proxy/sign', async (req, res) => {
  try {
    const { privateKey, method, uriPath } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'privateKey required in body' });
    }
    
    const credentials = await ensureAuthenticated();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const signature = generateHmacSignature(
      privateKey,
      credentials.PublicKey,
      method || 'GET',
      timestamp,
      uriPath || '/v1/HelloWorld'
    );
    
    res.json({
      publicKey: credentials.PublicKey,
      timestamp: timestamp,
      signature: signature,
      authHeader: `Shared ${credentials.PublicKey}:${signature}`,
      signatureData: `${credentials.PublicKey}\n${method || 'GET'}\n${timestamp}\n${uriPath || '/v1/HelloWorld'}`
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Signing failed', message: error.message });
  }
});

// Fetch connector URL (the pre-signed URL with HMAC signature)
app.get('/api/motor-proxy/connector-url', async (req, res) => {
  try {
    const credentials = await ensureAuthenticated();
    
    // Get the vehicles page to look for connector URL
    const targetUrl = 'https://sites.motor.com/m1/vehicles';
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Cookie': credentials._cookieString,
        'Referer': 'https://sites.motor.com/m1'
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[CONNECTOR] Fetched page: ${response.status}`);
    
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Extract signature parameters
    const connectorMatch = html.match(/connector\?[^"'<>\s]+/gi);
    const sigMatch = html.match(/Sig=([A-Za-z0-9+/=]+)/gi);
    
    res.json({
      status: response.status,
      publicKey: credentials.PublicKey,
      apiTokenValue: credentials.ApiTokenValue,
      expiration: credentials.ApiTokenExpiration,
      connectorUrls: connectorMatch || [],
      signatures: sigMatch || [],
      htmlLength: html.length
    });
    
  } catch (error) {
    console.error('[CONNECTOR] Error:', error.message);
    res.status(500).json({ error: 'Failed', message: error.message });
  }
});

// ============================================================
// NEW SWAGGER API ENDPOINTS
// ============================================================

// VIN Search - GET /api/motor-proxy/api/vin/{vin}
// Returns vehicle info from VIN (correct path: /api/vin/{vin}/vehicle)
app.get('/api/motor-proxy/api/vin/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    console.log(`[VIN] Searching for VIN: ${vin}`);
    
    const credentials = await ensureAuthenticated();
    
    // CORRECT Motor API path for VIN search
    const targetUrl = `https://sites.motor.com/m1/api/vin/${vin}/vehicle`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://sites.motor.com/m1/vehicles'
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[VIN] Response: ${response.status}`);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('[VIN] Error:', error.message);
    res.status(500).json({ error: 'VIN search failed', message: error.message });
  }
});

// VIN Decode - GET /api/motor-proxy/api/vin-decode/{vin}
// Alias for VIN search - both use the same endpoint
app.get('/api/motor-proxy/api/vin-decode/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    console.log(`[VIN-DECODE] Decoding VIN: ${vin}`);
    
    const credentials = await ensureAuthenticated();
    
    // Use the correct Motor API path
    const targetUrl = `https://sites.motor.com/m1/api/vin/${vin}/vehicle`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://sites.motor.com/m1/vehicles'
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[VIN-DECODE] Response: ${response.status}`);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('[VIN-DECODE] Error:', error.message);
    res.status(500).json({ error: 'VIN decode failed', message: error.message });
  }
});

// ============================================================
// FILTERED ARTICLE ENDPOINTS (DTCs, TSBs, etc.)
// These filter the /articles/v2 response by bucket type
// ============================================================

// Helper function to fetch and filter articles by bucket
async function fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, bucketName) {
  const params = new URLSearchParams({ searchTerm: '' });
  if (motorVehicleId) {
    params.append('motorVehicleId', motorVehicleId);
  }
  
  const targetUrl = `https://sites.motor.com/m1/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/articles/v2?${params}`;
  
  const response = await axios({
    method: 'GET',
    url: targetUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Cookie': credentials._cookieString,
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://sites.motor.com/m1/vehicles'
    },
    timeout: 30000,
    validateStatus: () => true
  });
  
  if (response.status !== 200 || !response.data.body) {
    return { articles: [], filterTabs: [], total: 0 };
  }
  
  const body = response.data.body;
  const allArticles = body.articleDetails || [];
  
  // Filter by bucket name (case-insensitive partial match)
  const filtered = allArticles.filter(a => 
    a.bucket && a.bucket.toLowerCase().includes(bucketName.toLowerCase())
  );
  
  // Get the count from filterTabs
  const tab = (body.filterTabs || []).find(t => 
    t.name.toLowerCase().includes(bucketName.toLowerCase())
  );
  
  return {
    articles: filtered,
    filterTabs: body.filterTabs || [],
    total: tab ? tab.articlesCount : filtered.length
  };
}

// DTCs - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/dtcs
// Returns Diagnostic Trouble Codes filtered from articles/v2
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/dtcs', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId, includeOther } = req.query;
    console.log(`[DTC] Getting DTCs for ${contentSource}/${vehicleId} (motorVehicleId: ${motorVehicleId || 'none'})`);
    
    const credentials = await ensureAuthenticated();
    
    // Fetch all articles
    const params = new URLSearchParams({ searchTerm: '' });
    if (motorVehicleId) {
      params.append('motorVehicleId', motorVehicleId);
    }
    
    const targetUrl = `https://sites.motor.com/m1/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/articles/v2?${params}`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://sites.motor.com/m1/vehicles'
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    if (response.status !== 200 || !response.data.body) {
      return res.status(response.status).json(response.data);
    }
    
    const body = response.data.body;
    const allArticles = body.articleDetails || [];
    
    // Filter for DTCs - bucket = "Diagnostic Trouble Codes" or "Other Diagnostics"
    const dtcArticles = allArticles.filter(a => 
      a.bucket === 'Diagnostic Trouble Codes' || 
      (includeOther === 'true' && a.bucket === 'Other Diagnostics')
    );
    
    // Get count from filterTabs
    const dtcTab = (body.filterTabs || []).find(t => t.name === 'Diagnostic Codes');
    
    console.log(`[DTC] Found ${dtcArticles.length} DTCs`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: dtcTab ? dtcTab.articlesCount : dtcArticles.length,
        dtcs: dtcArticles.map(a => ({
          id: a.id,
          code: a.code || (a.title || '').match(/^[A-Z]?\d+[-\d]*/)?.[0] || '',
          description: a.description || a.title || '',
          subtitle: a.subtitle || '',
          bucket: a.bucket || ''
        }))
      }
    });
    
  } catch (error) {
    console.error('[DTC] Error:', error.message);
    res.status(500).json({ error: 'DTCs fetch failed', message: error.message });
  }
});

// TSBs - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/tsbs
// Returns Technical Service Bulletins filtered from articles/v2
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/tsbs', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[TSB] Getting TSBs for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    // Use exact bucket name: "Technical Service Bulletins"
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Technical Service Bulletins');
    
    console.log(`[TSB] Found ${result.articles.length} TSBs`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: result.total,
        tsbs: result.articles.map(a => ({
          id: a.id,
          bulletinNumber: a.bulletinNumber || '',
          title: a.title,
          subtitle: a.subtitle || '',
          releaseDate: a.releaseDate || ''
        }))
      }
    });
    
  } catch (error) {
    console.error('[TSB] Error:', error.message);
    res.status(500).json({ error: 'TSBs fetch failed', message: error.message });
  }
});

// Procedures - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/procedures
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/procedures', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[PROCEDURES] Getting procedures for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Procedure');
    
    console.log(`[PROCEDURES] Found ${result.articles.length} procedures`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: result.total,
        procedures: result.articles
      }
    });
    
  } catch (error) {
    console.error('[PROCEDURES] Error:', error.message);
    res.status(500).json({ error: 'Procedures fetch failed', message: error.message });
  }
});

// Diagrams - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/diagrams
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/diagrams', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[DIAGRAMS] Getting diagrams for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Diagram');
    
    console.log(`[DIAGRAMS] Found ${result.articles.length} diagrams`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: result.total,
        diagrams: result.articles
      }
    });
    
  } catch (error) {
    console.error('[DIAGRAMS] Error:', error.message);
    res.status(500).json({ error: 'Diagrams fetch failed', message: error.message });
  }
});

// Specs - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/specs
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/specs', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[SPECS] Getting specs for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Spec');
    
    console.log(`[SPECS] Found ${result.articles.length} specs`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: result.total,
        specs: result.articles
      }
    });
    
  } catch (error) {
    console.error('[SPECS] Error:', error.message);
    res.status(500).json({ error: 'Specs fetch failed', message: error.message });
  }
});

// Article Categories Summary - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/categories
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/categories', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[CATEGORIES] Getting article categories for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    const params = new URLSearchParams({ searchTerm: '' });
    if (motorVehicleId) {
      params.append('motorVehicleId', motorVehicleId);
    }
    
    const targetUrl = `https://sites.motor.com/m1/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/articles/v2?${params}`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://sites.motor.com/m1/vehicles'
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      return res.status(response.status).json(response.data);
    }
    
    const filterTabs = response.data.body?.filterTabs || [];
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        categories: filterTabs.map(t => ({
          name: t.name,
          count: t.articlesCount,
          buckets: t.buckets
        }))
      }
    });
    
  } catch (error) {
    console.error('[CATEGORIES] Error:', error.message);
    res.status(500).json({ error: 'Categories fetch failed', message: error.message });
  }
});

// OLD DTCs endpoint (kept for backwards compatibility, redirects to new implementation)
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/dtcs-old', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const decodedVehicleId = decodeURIComponent(vehicleId);
    console.log(`[DTC-OLD] Getting DTCs for ${contentSource}/${decodedVehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    // Motor API path for DTCs (this path returns HTML, not JSON)
    const targetUrl = `https://sites.motor.com/m1/api/source/${contentSource}/vehicle/${vehicleId}/diagnostic-trouble-codes`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://sites.motor.com/m1/source/${contentSource}/vehicle/${vehicleId}`
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[DTC] Response: ${response.status}`);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('[DTC] Error:', error.message);
    res.status(500).json({ error: 'DTC retrieval failed', message: error.message });
  }
});

// DTC Detail - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/dtc/{articleId}
// DTCs are articles - redirect to article endpoint
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/dtc/:articleId', async (req, res) => {
  const { contentSource, vehicleId, articleId } = req.params;
  res.redirect(`/api/motor-proxy/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/article/${articleId}`);
});

// NOTE: TSBs endpoint is defined above using the fetchArticlesByBucket helper
// The /tsbs route filters articles from /articles/v2 where bucket = "Service Bulletin"

// TSB/DTC Detail - These use the standard article endpoint since DTCs/TSBs are articles
// GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/tsb/{articleId}
// Redirects to the standard article endpoint
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/tsb/:articleId', async (req, res) => {
  // TSBs are articles - redirect to article endpoint
  const { contentSource, vehicleId, articleId } = req.params;
  res.redirect(`/api/motor-proxy/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/article/${articleId}`);
});

// Wiring Diagrams - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/wiring
// Filters diagrams from articles/v2 - wiring diagrams are in the "Diagrams" category
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/wiring', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[WIRING] Getting wiring diagrams for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    // Wiring diagrams are part of the "Diagrams" category in articles
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Diagram');
    
    // Further filter for wiring-specific diagrams if possible
    const wiringDiagrams = result.articles.filter(a => 
      a.title?.toLowerCase().includes('wiring') || 
      a.bucket?.toLowerCase().includes('wiring')
    );
    
    console.log(`[WIRING] Found ${wiringDiagrams.length} wiring diagrams out of ${result.articles.length} total diagrams`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: wiringDiagrams.length,
        allDiagramsTotal: result.total,
        wiringDiagrams: wiringDiagrams
      }
    });
    
  } catch (error) {
    console.error('[WIRING] Error:', error.message);
    res.status(500).json({ error: 'Wiring diagrams retrieval failed', message: error.message });
  }
});

// Component Locations - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/components
// Filters component location diagrams from articles/v2
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/components', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[COMPONENTS] Getting component locations for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    // Component locations are part of the "Diagrams" category
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Diagram');
    
    // Filter for component location diagrams
    const componentDiagrams = result.articles.filter(a => 
      a.title?.toLowerCase().includes('component') || 
      a.title?.toLowerCase().includes('location') ||
      a.bucket?.toLowerCase().includes('component')
    );
    
    console.log(`[COMPONENTS] Found ${componentDiagrams.length} component diagrams out of ${result.articles.length} total diagrams`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        total: componentDiagrams.length,
        allDiagramsTotal: result.total,
        componentLocations: componentDiagrams
      }
    });
    
  } catch (error) {
    console.error('[COMPONENTS] Error:', error.message);
    res.status(500).json({ error: 'Component locations retrieval failed', message: error.message });
  }
});

// Estimated Work Times / Labor - GET /api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/labor-times
// Note: Labor times are typically associated with specific procedures, not a separate endpoint
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/labor-times', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    const { motorVehicleId } = req.query;
    console.log(`[LABOR] Getting labor times for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    // Labor times are associated with procedures - get procedures
    const result = await fetchArticlesByBucket(credentials, contentSource, vehicleId, motorVehicleId, 'Procedure');
    
    console.log(`[LABOR] Found ${result.articles.length} procedures (labor times are per-article)`);
    
    res.json({
      header: { status: 'OK', statusCode: 200, date: new Date().toUTCString() },
      body: {
        note: 'Labor times are associated with individual procedures. Use /labor/{articleId} to get labor time for a specific article.',
        total: result.total,
        procedures: result.articles.slice(0, 50) // Return first 50 as sample
      }
    });
    
  } catch (error) {
    console.error('[LABOR] Error:', error.message);
    res.status(500).json({ error: 'Labor times retrieval failed', message: error.message });
  }
});

// OLD Estimated Work Times endpoint (for backwards compatibility - tries direct path)
app.get('/api/motor-proxy/api/source/:contentSource/vehicle/:vehicleId/labor-times-direct', async (req, res) => {
  try {
    const { contentSource, vehicleId } = req.params;
    console.log(`[LABOR-DIRECT] Getting labor times for ${contentSource}/${vehicleId}`);
    
    const credentials = await ensureAuthenticated();
    
    const targetUrl = `https://sites.motor.com/m1/api/source/${contentSource}/vehicle/${vehicleId}/estimated-work-times`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': credentials._cookieString,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://sites.motor.com/m1/source/${contentSource}/vehicle/${vehicleId}`
      },
      timeout: 30000,
      validateStatus: () => true
    });
    
    console.log(`[LABOR] Response: ${response.status}`);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('[LABOR] Error:', error.message);
    res.status(500).json({ error: 'Labor times retrieval failed', message: error.message });
  }
});

// ============================================================
// END NEW ENDPOINTS
// ============================================================

// AI-powered article formatting enhancement endpoint
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// Initialize Firestore
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Google AI with config
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyCxPXrr9Atn2AcVTIP-GRSBnAVkuUA_E2o';
  return new GoogleGenerativeAI(apiKey);
};

app.post('/api/motor-proxy/api/enhance-article', async (req, res) => {
  try {
    const { html, contentSource, vehicleId, articleId } = req.body;

    console.log('[ENHANCE] Received request:', {
      contentSource,
      vehicleId,
      articleId,
      htmlLength: html ? html.length : 0
    });

    if (!html || !contentSource || !vehicleId || !articleId) {
      const missing = [];
      if (!html) missing.push('html');
      if (!contentSource) missing.push('contentSource');
      if (!vehicleId) missing.push('vehicleId');
      if (!articleId) missing.push('articleId');
      console.error('[ENHANCE] Missing fields:', missing.join(', '));
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    console.log(`[ENHANCE] Request for ${contentSource}/${vehicleId}/${articleId}`);

    // Create cache key
    const cacheKey = `${contentSource}_${vehicleId}_${articleId}`;

    // Check Firestore cache first
    const cacheRef = db.collection('enhanced_articles').doc(cacheKey);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      console.log('[ENHANCE] Cache hit!');
      const cached = cacheDoc.data();
      return res.json({ enhancedHtml: cached.enhancedHtml, cached: true });
    }

    console.log('[ENHANCE] Cache miss, generating with AI...');

    const genAI = getGenAI();
    // Use Gemini 2.0 Flash as requested
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a technical automotive documentation expert. Rewrite this repair procedure in your own words to avoid plagiarism while maintaining 100% technical accuracy.

CRITICAL REQUIREMENTS:
1. **REWRITE ALL TEXT**: Paraphrase all procedural steps and descriptions. Do NOT copy the original text word-for-word.
2. **PRESERVE TECHNICAL DATA**: Keep all torque specs, part numbers, measurements, and safety warnings EXACTLY as they appear.
3. **FORMAT IMAGES AS THUMBNAILS**:
   - Wrap every <img> tag in a figure container: <figure class="thumbnail"><img src="..." class="img-fluid"><figcaption>Figure X</figcaption></figure>
   - Place these thumbnails intelligently within the text where they are referenced.
4. **IMPROVE FORMATTING**:
   - Use <ul> and <ol> for lists.
   - Use <h3> for section headers.
   - Use <strong> for emphasis on key parts or tools.
5. **TABLES**: Keep all table structures intact but ensure they are responsive.
6. **OUTPUT**: Return ONLY valid HTML. No markdown blocks, no explanations.

Original HTML:
${html}

Rewritten HTML:`;

    const result = await model.generateContent(prompt);
    const enhancedHtml = result.response.text();

    // Save to Firestore cache
    await cacheRef.set({
      originalId: articleId,
      contentSource,
      vehicleId,
      enhancedHtml,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      modelVersion: 'gemini-1.5-flash'
    });

    console.log('[ENHANCE] Cached for future requests');

    res.json({ enhancedHtml, cached: false });
  } catch (error) {
    console.error('[ENHANCE] Error:', error);
    res.status(500).json({
      error: 'Enhancement failed',
      message: error.message
    });
  }
});

// Handle API requests from Firebase Hosting rewrite (/api/**)
app.all('/api/*', async (req, res) => {
  // If this is already the /api/motor-proxy route, handle it as before
  if (req.url.startsWith('/api/motor-proxy')) {
    req.url = req.url.replace('/api/motor-proxy', '');
  }

  // Call the motor proxy handler
  return handleMotorProxyRequest(req, res);
});

// Motor API proxy endpoint handler
async function handleMotorProxyRequest(req, res) {
  try {
    console.log(`[PROXY] ${req.method} ${req.url}`);

    // Ensure we're authenticated
    const credentials = await ensureAuthenticated();

    // Extract the target URL (remove /api/motor-proxy prefix)
    let targetPath = req.url.replace('/api/motor-proxy', '');

    // Handle asset requests specifically
    if (targetPath.startsWith('/api/asset/')) {
      // Motor API asset path structure: /m1/api/asset/{guid}
      // Our path: /api/asset/{guid} -> target: /api/asset/{guid}
      // The base URL is https://sites.motor.com/m1
      // So full URL becomes: https://sites.motor.com/m1/api/asset/{guid}
      // This matches what we need.
    }

    const targetUrl = `https://sites.motor.com/m1${targetPath}`;

    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Check if this is an image/binary request based on path
    const isImageRequest = targetPath.includes('/graphic/') ||
      targetPath.includes('/asset/') ||
      targetPath.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i);

    // Prepare headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'Accept': isImageRequest ? 'image/*, */*' : 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cookie': credentials._cookieString,
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://sites.motor.com/m1/vehicles',
      'Origin': 'https://sites.motor.com'
    };

    // Copy relevant headers from the original request
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Make the request to Motor API
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      timeout: 30000,
      responseType: isImageRequest ? 'arraybuffer' : 'json', // Handle binary data for images
      validateStatus: () => true // Don't throw on HTTP error status codes
    });

    console.log(`[PROXY] Response: ${response.status} ${response.statusText} (${isImageRequest ? 'binary' : 'json'})`);

    // Forward the response with proper CORS headers
    res.status(response.status);

    // Copy safe headers from response
    const safeHeaders = ['content-type', 'content-encoding', 'content-length', 'cache-control', 'etag', 'last-modified'];
    safeHeaders.forEach(header => {
      if (response.headers[header]) {
        res.set(header, response.headers[header]);
      }
    });

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Send binary data as buffer for images, otherwise as JSON
    if (isImageRequest) {
      res.send(Buffer.from(response.data));
    } else {
      res.send(response.data);
    }

  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
}

// Export the Express app as a Firebase Function
exports.motorproxy = onRequest({
  timeoutSeconds: 60,
  memory: '512MiB'
}, app);