package com.secureauth.utils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

/**
 * Utilitaire pour les opérations réseau
 */
@Slf4j
public class NetworkUtils {

    /**
     * Obtient l'adresse IP du client
     * Priorité: VPN > IP réelle du client > IP réseau locale
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "Unknown";
        }
        
        String ipAddress = null;
        
        // 1. D'abord essayer les headers de proxy/VPN (priorité haute)
        // Ces headers contiennent l'IP vue par le proxy/VPN
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP", 
            "CF-Connecting-IP",      // Cloudflare
            "True-Client-IP",        // Akamai
            "X-Client-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_CLIENT_IP",
            "HTTP_X_REAL_IP"
        };
        
        for (String header : headerNames) {
            ipAddress = request.getHeader(header);
            if (ipAddress != null && !ipAddress.isEmpty() && !"unknown".equalsIgnoreCase(ipAddress)) {
                // X-Forwarded-For peut contenir plusieurs IPs, prendre la première (client original)
                if (ipAddress.contains(",")) {
                    ipAddress = ipAddress.split(",")[0].trim();
                }
                log.debug("IP found in header {}: {}", header, ipAddress);
                
                // Si c'est une IP publique (VPN), la retourner directement
                if (isPublicIp(ipAddress)) {
                    log.info("Public/VPN IP detected: {}", ipAddress);
                    return ipAddress;
                }
                break;
            }
        }
        
        // 2. Si pas trouvé dans les headers, utiliser getRemoteAddr
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        
        // 3. Si c'est localhost, chercher l'IP réseau locale
        if (isLocalhost(ipAddress)) {
            // Chercher d'abord une interface VPN active
            String vpnIp = getVpnIpAddress();
            if (vpnIp != null) {
                log.info("VPN IP detected: {}", vpnIp);
                return vpnIp;
            }
            
            // Sinon retourner l'IP réseau locale
            String localNetworkIp = getLocalNetworkIpAddress();
            if (localNetworkIp != null) {
                return localNetworkIp;
            }
        }
        
        return ipAddress;
    }
    
    /**
     * Vérifie si l'IP est une adresse publique (non privée, non localhost)
     */
    private static boolean isPublicIp(String ip) {
        if (ip == null || ip.isEmpty()) return false;
        
        // Exclure localhost
        if (isLocalhost(ip)) return false;
        
        // Exclure les plages privées
        if (ip.startsWith("10.") || 
            ip.startsWith("192.168.") || 
            ip.startsWith("172.16.") || ip.startsWith("172.17.") || 
            ip.startsWith("172.18.") || ip.startsWith("172.19.") ||
            ip.startsWith("172.2") || ip.startsWith("172.30.") || ip.startsWith("172.31.") ||
            ip.startsWith("169.254.")) {  // APIPA
            return false;
        }
        
        // Exclure IPv6 localhost
        if (ip.contains(":")) return false;
        
        return true;
    }
    
    /**
     * Cherche une interface VPN active et retourne son IP
     */
    public static String getVpnIpAddress() {
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            
            while (networkInterfaces.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaces.nextElement();
                
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }
                
                String name = networkInterface.getName().toLowerCase();
                String displayName = networkInterface.getDisplayName().toLowerCase();
                String combined = name + " " + displayName;
                
                // Détecter les interfaces VPN courantes
                boolean isVpn = combined.contains("vpn") || 
                               combined.contains("tun") || 
                               combined.contains("tap") ||
                               combined.contains("ppp") ||
                               combined.contains("nordvpn") ||
                               combined.contains("expressvpn") ||
                               combined.contains("proton") ||
                               combined.contains("wireguard") ||
                               combined.contains("wg") ||
                               combined.contains("openvpn") ||
                               combined.contains("cisco") ||
                               combined.contains("anyconnect") ||
                               combined.contains("fortinet") ||
                               combined.contains("forticlient") ||
                               combined.contains("globalprotect") ||
                               combined.contains("pulse") ||
                               combined.contains("juniper");
                
                if (isVpn) {
                    Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        InetAddress addr = addresses.nextElement();
                        if (!addr.isLoopbackAddress() && addr.getHostAddress().indexOf(':') == -1) {
                            String ip = addr.getHostAddress();
                            log.info("VPN interface found: {} with IP: {}", displayName, ip);
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error detecting VPN interface", e);
        }
        
        return null;
    }
    
    /**
     * Vérifie si l'IP est localhost
     */
    private static boolean isLocalhost(String ip) {
        return "127.0.0.1".equals(ip) 
            || "0:0:0:0:0:0:0:1".equals(ip) 
            || "::1".equals(ip)
            || "localhost".equalsIgnoreCase(ip);
    }
    
    /**
     * Obtient l'adresse IP réseau locale (IPv4) de la machine
     * Évite les interfaces virtuelles (VirtualBox, VMware, Docker, etc.)
     */
    public static String getLocalNetworkIpAddress() {
        try {
            String bestIp = null;
            int bestScore = -1;
            
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            
            while (networkInterfaces.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaces.nextElement();
                
                // Ignorer les interfaces désactivées et loopback
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }
                
                String name = networkInterface.getName().toLowerCase();
                String displayName = networkInterface.getDisplayName().toLowerCase();
                
                // Ignorer explicitement les interfaces virtuelles
                if (isVirtualInterface(name, displayName)) {
                    continue;
                }
                
                // Calculer un score de priorité pour cette interface
                int score = getInterfacePriority(name, displayName);
                
                Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    
                    // Prendre uniquement les adresses IPv4 non-loopback
                    if (!addr.isLoopbackAddress() && addr.getHostAddress().indexOf(':') == -1) {
                        String ip = addr.getHostAddress();
                        
                        // Vérifier que c'est une IP privée valide (pas 169.254.x.x = APIPA)
                        if (isValidPrivateIp(ip) && score > bestScore) {
                            bestIp = ip;
                            bestScore = score;
                            log.debug("Found candidate IP: {} on interface: {} (score: {})", 
                                    ip, networkInterface.getDisplayName(), score);
                        }
                    }
                }
            }
            
            if (bestIp != null) {
                log.info("Selected local network IP: {}", bestIp);
                return bestIp;
            }
            
        } catch (Exception e) {
            log.error("Error getting local network IP address", e);
        }
        
        return null;
    }
    
    /**
     * Vérifie si c'est une interface virtuelle à ignorer
     */
    private static boolean isVirtualInterface(String name, String displayName) {
        String combined = (name + " " + displayName).toLowerCase();
        
        // Liste des mots-clés d'interfaces virtuelles
        String[] virtualKeywords = {
            "virtualbox", "vbox", "vmware", "vmnet", "docker", "veth",
            "hyper-v", "hyperv", "virtual", "vnic", "virbr", "bridge",
            "loopback", "pseudo", "teredo", "isatap", "6to4",
            "bluetooth", "tunnel", "tap", "tun", "vpn"
        };
        
        for (String keyword : virtualKeywords) {
            if (combined.contains(keyword)) {
                return true;
            }
        }
        
        // VirtualBox utilise souvent des noms comme "VirtualBox Host-Only"
        if (combined.contains("host-only") || combined.contains("hostonly")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Calcule la priorité d'une interface (plus haut = meilleur)
     */
    private static int getInterfacePriority(String name, String displayName) {
        String combined = (name + " " + displayName).toLowerCase();
        
        // Ethernet filaire = priorité maximale
        if (combined.contains("ethernet") || name.startsWith("eth") || name.startsWith("enp")) {
            return 100;
        }
        
        // WiFi = haute priorité
        if (combined.contains("wi-fi") || combined.contains("wifi") || 
            combined.contains("wlan") || combined.contains("wireless") ||
            name.startsWith("wlp")) {
            return 90;
        }
        
        // Interface réseau générique
        if (name.startsWith("en") || combined.contains("local area connection")) {
            return 50;
        }
        
        // Autre interface
        return 10;
    }
    
    /**
     * Vérifie que l'IP est une adresse privée valide
     */
    private static boolean isValidPrivateIp(String ip) {
        // Exclure APIPA (169.254.x.x)
        if (ip.startsWith("169.254.")) {
            return false;
        }
        
        // Accepter les plages privées standard
        return ip.startsWith("192.168.") || 
               ip.startsWith("10.") || 
               (ip.startsWith("172.") && isInRange172(ip));
    }
    
    /**
     * Vérifie si l'IP est dans la plage 172.16.0.0 - 172.31.255.255
     */
    private static boolean isInRange172(String ip) {
        try {
            String[] parts = ip.split("\\.");
            int secondOctet = Integer.parseInt(parts[1]);
            return secondOctet >= 16 && secondOctet <= 31;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Parse le User-Agent et retourne une description lisible de l'appareil/navigateur
     */
    public static String parseUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Navigateur inconnu";
        }
        
        String browser = detectBrowser(userAgent);
        String os = detectOS(userAgent);
        String device = detectDevice(userAgent);
        
        StringBuilder result = new StringBuilder();
        result.append(browser);
        
        if (os != null && !os.isEmpty()) {
            result.append(" sur ").append(os);
        }
        
        if (device != null && !device.isEmpty() && !device.equals("PC")) {
            result.append(" (").append(device).append(")");
        }
        
        return result.toString();
    }
    
    private static String detectBrowser(String userAgent) {
        String ua = userAgent.toLowerCase();
        
        // Ordre important : certains navigateurs incluent d'autres noms dans leur UA
        if (ua.contains("edg/") || ua.contains("edge/")) {
            return "Microsoft Edge";
        } else if (ua.contains("opr/") || ua.contains("opera")) {
            return "Opera";
        } else if (ua.contains("brave")) {
            return "Brave";
        } else if (ua.contains("vivaldi")) {
            return "Vivaldi";
        } else if (ua.contains("chrome") && !ua.contains("chromium")) {
            return "Google Chrome";
        } else if (ua.contains("chromium")) {
            return "Chromium";
        } else if (ua.contains("firefox") || ua.contains("fxios")) {
            return "Mozilla Firefox";
        } else if (ua.contains("safari") && !ua.contains("chrome")) {
            return "Safari";
        } else if (ua.contains("msie") || ua.contains("trident")) {
            return "Internet Explorer";
        } else if (ua.contains("postman")) {
            return "Postman";
        } else if (ua.contains("curl")) {
            return "cURL";
        } else if (ua.contains("axios") || ua.contains("node")) {
            return "Application Node.js";
        }
        
        return "Navigateur";
    }
    
    private static String detectOS(String userAgent) {
        String ua = userAgent.toLowerCase();
        
        if (ua.contains("windows nt 10") || ua.contains("windows nt 11")) {
            return "Windows 10/11";
        } else if (ua.contains("windows nt 6.3")) {
            return "Windows 8.1";
        } else if (ua.contains("windows nt 6.2")) {
            return "Windows 8";
        } else if (ua.contains("windows nt 6.1")) {
            return "Windows 7";
        } else if (ua.contains("windows")) {
            return "Windows";
        } else if (ua.contains("mac os x") || ua.contains("macos")) {
            return "macOS";
        } else if (ua.contains("iphone")) {
            return "iOS (iPhone)";
        } else if (ua.contains("ipad")) {
            return "iOS (iPad)";
        } else if (ua.contains("android")) {
            // Ne pas retourner Android si c'est un émulateur Chrome DevTools
            if (ua.contains("chrome") && !ua.contains("mobile safari")) {
                return "Windows"; // Chrome DevTools mobile view
            }
            return "Android";
        } else if (ua.contains("linux")) {
            return "Linux";
        } else if (ua.contains("ubuntu")) {
            return "Ubuntu";
        } else if (ua.contains("fedora")) {
            return "Fedora";
        } else if (ua.contains("cros")) {
            return "Chrome OS";
        }
        
        return "";
    }
    
    private static String detectDevice(String userAgent) {
        String ua = userAgent.toLowerCase();
        
        // Vérifier si c'est vraiment un mobile ou juste Chrome DevTools
        boolean isMobileUA = ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") || ua.contains("ipad");
        boolean isDesktopBrowser = ua.contains("windows nt") || ua.contains("macintosh") || ua.contains("mac os x");
        
        // Si le UA contient Windows NT, c'est définitivement un PC
        if (isDesktopBrowser) {
            return "PC";
        }
        
        if (ua.contains("ipad")) {
            return "Tablette";
        } else if (ua.contains("tablet") || ua.contains("kindle")) {
            return "Tablette";
        } else if (ua.contains("iphone") || (ua.contains("android") && ua.contains("mobile"))) {
            return "Mobile";
        } else if (isMobileUA) {
            return "Mobile";
        }
        
        return "PC";
    }
}
