/**
 * Extracts a normalized list of IP addresses from userIp (from req.ip or req.ips).
 * Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses.
 *
 * @param {string|string[]|null|undefined} userIp - The user ip.
 * @returns {string[]} A list of valid and normalized IPs.
 */
export function extractIpList(userIp) {
  /** @type {string[]} */
  let rawIps = [];

  if (Array.isArray(userIp) && userIp.length > 0) {
    rawIps = userIp;
  } else if (typeof userIp === 'string') {
    rawIps = [userIp];
  }

  /** @param {string} ip */
  const isValidIp = (ip) => {
    const ipv4 = /^(25[0-5]|2\d\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2\d\d|1\d\d|[1-9]?\d)){3}$/;
    const ipv6 = /^(([a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|::1|::)$/;
    return ipv4.test(ip) || ipv6.test(ip);
  };

  const cleanIps = rawIps
    .flatMap((ip) => ip.split(','))
    .map((ip) => ip.trim().replace(/^\[|\]$/g, '')) // Remove brackets [::1]
    .map((ip) => (ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip)) // Normalize IPv4-mapped IPv6
    .filter(Boolean) // Remove empty strings
    .filter(isValidIp);

  // Remove duplicates
  return [...new Set(cleanIps)];
}
