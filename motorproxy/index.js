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
// CYBERPUNK FEATURES MOCK ENDPOINTS
// ============================================================

// Mock Part Vector Illustrations (X-Ray Mode)
app.get('/api/motor-proxy/api/source/:source/vehicle/:vehicleId/part-vectors', (req, res) => {
  const { GroupID } = req.query;
  console.log(`[MOCK] Serving Part Vector for GroupID: ${GroupID}`);

  // Generate a cool looking SVG schematic
  const svgContent = `
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g stroke="#00FFFF" stroke-width="2" fill="none" filter="url(#glow)">
        <!-- Engine Block Outline -->
        <path d="M200,150 L600,150 L650,250 L650,450 L150,450 L150,250 Z" />
        <circle cx="300" cy="300" r="40" />
        <circle cx="500" cy="300" r="40" />
        <circle cx="300" cy="400" r="40" />
        <circle cx="500" cy="400" r="40" />
        
        <!-- Connecting Lines -->
        <line x1="300" y1="300" x2="500" y2="300" stroke-dasharray="5,5" />
        <line x1="300" y1="400" x2="500" y2="400" stroke-dasharray="5,5" />
        <line x1="300" y1="300" x2="300" y2="400" />
        <line x1="500" y1="300" x2="500" y2="400" />
        
        <!-- Detail callouts -->
        <line x1="650" y1="250" x2="750" y2="200" stroke="#FF00FF" />
        <text x="760" y="200" fill="#FF00FF" font-family="monospace" font-size="14">CYLINDER HEAD</text>
        
        <line x1="150" y1="450" x2="50" y2="500" stroke="#FF00FF" />
        <text x="10" y="515" fill="#FF00FF" font-family="monospace" font-size="14">CRANKCASE</text>
      </g>
    </svg>
  `;

  res.json({
    groupId: GroupID,
    svgContent: svgContent,
    parts: [
      { id: 1, name: 'Cylinder Head', number: 'CH-2025-X' },
      { id: 2, name: 'Crankcase', number: 'CC-9000-Z' }
    ]
  });
});

// Mock Maintenance Timeline (Predictive Core)
app.get('/api/motor-proxy/api/source/:source/vehicle/:vehicleId/maintenance-timeline/miles/:mileage', (req, res) => {
  const mileage = parseInt(req.params.mileage) || 0;
  console.log(`[MOCK] Serving Maintenance Timeline for mileage: ${mileage}`);

  const predictions = [];

  if (mileage > 30000) {
    predictions.push({ FrequencyDescription: 'Brake Fluid Flush', Probability: 'High' });
  }
  if (mileage > 50000) {
    predictions.push({ FrequencyDescription: 'Transmission Fluid Change', Probability: 'Medium' });
  }
  if (mileage > 75000) {
    predictions.push({ FrequencyDescription: 'Timing Belt Inspection', Probability: 'Critical' });
  }
  if (mileage > 100000) {
    predictions.push({ FrequencyDescription: 'Spark Plug Replacement', Probability: 'High' });
    predictions.push({ FrequencyDescription: 'Coolant Flush', Probability: 'High' });
  }

  // Always return something for demo
  if (predictions.length === 0) {
    predictions.push({ FrequencyDescription: 'Oil Change & Filter', Probability: 'Routine' });
    predictions.push({ FrequencyDescription: 'Tire Rotation', Probability: 'Routine' });
  }

  res.json(predictions);
});

// Mock Related Wiring (Linked Intelligence)
app.get('/api/motor-proxy/api/source/:source/vehicle/:vehicleId/wiring/related-to/dtc/:dtcId', (req, res) => {
  const { dtcId } = req.params;
  console.log(`[MOCK] Serving Related Wiring for DTC: ${dtcId}`);

  res.json({
    dtcId: parseInt(dtcId),
    title: 'Engine Control System Wiring Diagram',
    url: 'https://via.placeholder.com/800x600.png?text=Wiring+Diagram+for+DTC', // Placeholder for now
    thumbnail: 'https://via.placeholder.com/200x150.png?text=Wiring+Thumb',
    confidence: 0.95
  });
});

// Motor API proxy endpoint
app.all('/api/motor-proxy/*', async (req, res) => {
  try {
    console.log(`[PROXY] ${req.method} ${req.url}`);

    // Ensure we're authenticated
    const credentials = await ensureAuthenticated();

    // Extract the target URL (remove /api/motor-proxy prefix)
    const targetPath = req.url.replace('/api/motor-proxy', '');
    const targetUrl = `https://sites.motor.com/m1${targetPath}`;

    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Check if this is an image/binary request based on path
    const isImageRequest = targetPath.includes('/graphic/') ||
      targetPath.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i);

    // Prepare headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'Accept': isImageRequest ? 'image/*, */*' : 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cookie': credentials._cookieString,
      'X-Requested-With': 'XMLHttpRequest'
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
});

// AI-powered article formatting enhancement endpoint
const { genkit } = require('genkit');
const { googleAI, gemini15Flash } = require('@genkit-ai/googleai');

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

app.post('/api/enhance-article', async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('[ENHANCE] Processing article enhancement...');

    const prompt = `You are an expert technical documentation formatter. Enhance this automotive repair manual HTML to be more readable WHILE PRESERVING ALL ORIGINAL CONTENT:

ENHANCEMENT TASKS:
1. Add <h3> section headings for logical topic breaks
2. Convert embedded lists ("items: A, B, C") to proper <ul>/<li> HTML
3. Wrap critical info in <strong>: torque specs, warnings, cautions
4. Add paragraph breaks where text is too dense
5. Preserve ALL <img>, <table>, and existing structure tags

CRITICAL RULES:
- Keep 100% of original content - don't paraphrase
- Preserve ALL HTML attributes exactly
- Don't change existing headings or lists
- Return ONLY valid HTML, no markdown or explanations

Original HTML:
${html}

Enhanced HTML:`;

    const result = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    res.json({ enhancedHtml: result.text });
  } catch (error) {
    console.error('[ENHANCE] Error:', error);
    res.status(500).json({ error: 'Enhancement failed', message: error.message });
  }
});

// Export the Express app as a Firebase Function
exports.motorproxy = onRequest({
  timeoutSeconds: 60,
  memory: '512MiB'
}, app);