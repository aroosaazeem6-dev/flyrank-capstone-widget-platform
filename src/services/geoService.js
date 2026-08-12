const PROVIDER_A_URL = "https://ipwho.is";
const PROVIDER_B_URL = "https://reallyfreegeoip.org/json";

function isPrivateOrLocalIp(ip) {
  if (!ip) {
    return true;
  }

  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  );
}

// Provider A
async function getFromProviderA(ip) {
  const response = await fetch(`${PROVIDER_A_URL}/${ip}`);

  if (!response.ok) {
    throw new Error(`Provider A returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Provider A lookup failed");
  }

  return {
    country: data.country || null,
    city: data.city || null,
    provider: "Provider A"
  };
}

// Provider B
async function getFromProviderB(ip) {
  const response = await fetch(`${PROVIDER_B_URL}/${ip}`);

  if (!response.ok) {
    throw new Error(`Provider B returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.country_name && !data.city) {
    throw new Error("Provider B returned no location data");
  }

  return {
    country: data.country_name || null,
    city: data.city || null,
    provider: "Provider B"
  };
}

// Provider A → Provider B fallback
async function getGeoLocation(ip) {
  if (isPrivateOrLocalIp(ip)) {
    console.log("Local/private IP detected. Geo lookup skipped.");
    return null;
  }

  // -----------------------------
  // Try Provider A
  // -----------------------------
  try {
    const result = await getFromProviderA(ip);

    console.log("Geo enrichment successful using Provider A.");

    return result;
  } catch (error) {
    console.error("Provider A failed:", error.message);
  }

  // -----------------------------
  // Try Provider B
  // -----------------------------
  try {
    const result = await getFromProviderB(ip);

    console.log("Geo enrichment successful using Provider B fallback.");

    return result;
  } catch (error) {
    console.error("Provider B failed:", error.message);
  }

  // -----------------------------
  // Both providers failed
  // -----------------------------
  console.error(
    "Both geo providers failed. Continuing without geo data."
  );

  return null;
}

module.exports = {
  getGeoLocation,
  getFromProviderA,
  getFromProviderB
};