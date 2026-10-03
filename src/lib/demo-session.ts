import crypto from "node:crypto";

/**
 * Creates a signed token for demo admin sessions.
 */
export function signDemoSession(passcode: string): string {
  const timestamp = Date.now().toString();
  const data = `demo-admin:${timestamp}`;
  const hmac = crypto.createHmac("sha256", passcode).update(data).digest("hex");
  return `${data}.${hmac}`;
}

/**
 * Verifies a signed demo admin session token.
 */
export function verifyDemoSession(cookieVal: string | undefined, passcode: string | undefined): boolean {
  if (!cookieVal || !passcode) return false;
  const parts = cookieVal.split(".");
  if (parts.length !== 2) return false;
  
  const [data, sig] = parts;
  const expectedHmac = crypto.createHmac("sha256", passcode).update(data).digest("hex");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedHmac);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  const timestampStr = data.replace("demo-admin:", "");
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > 24 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}
