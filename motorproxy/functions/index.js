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