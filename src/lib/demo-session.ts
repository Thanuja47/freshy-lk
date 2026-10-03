import crypto from "node:crypto";

/**
 * Performs a timing-safe comparison of two strings.
 */
export function timingSafeCompare(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Perform dummy timing-safe comparison against self to avoid early exit timing leaks
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Retrieves the secret key for HMAC signature creation/verification.
 */
function getHmacSecret(): string {
  return process.env.DEMO_HMAC_SECRET || process.env.DEMO_ADMIN_PASSCODE || "default-dev-hmac-secret-key-32-chars";
}

/**
 * Creates a signed token for demo admin sessions with a short expiry (default 2 hours).
 */
export function signDemoSession(passcode: string): string {
  const secret = getHmacSecret();
  const timestamp = Date.now().toString();
  const data = `demo-admin:${timestamp}:${passcode.substring(0, 4)}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${hmac}`;
}

/**
 * Verifies a signed demo admin session token with a short max age (2 hours).
 */
export function verifyDemoSession(cookieVal: string | undefined, passcode: string | undefined): boolean {
  if (!cookieVal || !passcode) return false;
  const parts = cookieVal.split(".");
  if (parts.length !== 2) return false;
  
  const [data, sig] = parts;
  const secret = getHmacSecret();
  const expectedHmac = crypto.createHmac("sha256", secret).update(data).digest("hex");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedHmac);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  // Short max age expiry: 2 hours (7,200,000 milliseconds)
  const partsData = data.split(":");
  if (partsData.length < 2) return false;
  
  const timestamp = parseInt(partsData[1], 10);
  if (isNaN(timestamp) || Date.now() - timestamp > 2 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}
