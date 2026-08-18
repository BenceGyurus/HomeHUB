export interface HomelabIcon {
  name: string;
  slug: string;
  category: 'media' | 'network' | 'system' | 'smarthome' | 'security' | 'storage' | 'download' | 'tools' | 'dev';
  keywords: string[];
  url: string;
}

const DASHBOARD_ICONS_BASE = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg';
const SELFHOSTED_ICONS_BASE = 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg';
const SIMPLE_ICONS_BASE = 'https://cdn.simpleicons.org';

export const HOMELAB_ICONS: HomelabIcon[] = [
  // --- MEDIA ---
  { name: 'Plex', slug: 'plex', category: 'media', keywords: ['plex', 'media', 'movie', 'stream'], url: `${DASHBOARD_ICONS_BASE}/plex.svg` },
  { name: 'Jellyfin', slug: 'jellyfin', category: 'media', keywords: ['jellyfin', 'media', 'stream', 'video'], url: `${DASHBOARD_ICONS_BASE}/jellyfin.svg` },
  { name: 'Emby', slug: 'emby', category: 'media', keywords: ['emby', 'media', 'stream'], url: `${DASHBOARD_ICONS_BASE}/emby.svg` },
  { name: 'Sonarr', slug: 'sonarr', category: 'media', keywords: ['sonarr', 'tv', 'series', 'arr'], url: `${DASHBOARD_ICONS_BASE}/sonarr.svg` },
  { name: 'Radarr', slug: 'radarr', category: 'media', keywords: ['radarr', 'movies', 'film', 'arr'], url: `${DASHBOARD_ICONS_BASE}/radarr.svg` },
  { name: 'Lidarr', slug: 'lidarr', category: 'media', keywords: ['lidarr', 'music', 'audio', 'arr'], url: `${DASHBOARD_ICONS_BASE}/lidarr.svg` },
  { name: 'Readarr', slug: 'readarr', category: 'media', keywords: ['readarr', 'books', 'ebook', 'arr'], url: `${DASHBOARD_ICONS_BASE}/readarr.svg` },
  { name: 'Bazarr', slug: 'bazarr', category: 'media', keywords: ['bazarr', 'subtitles', 'felirat', 'arr'], url: `${DASHBOARD_ICONS_BASE}/bazarr.svg` },
  { name: 'Prowlarr', slug: 'prowlarr', category: 'media', keywords: ['prowlarr', 'indexer', 'torrent', 'arr'], url: `${DASHBOARD_ICONS_BASE}/prowlarr.svg` },
  { name: 'Overseerr', slug: 'overseerr', category: 'media', keywords: ['overseerr', 'request', 'plex'], url: `${DASHBOARD_ICONS_BASE}/overseerr.svg` },
  { name: 'Jellyseerr', slug: 'jellyseerr', category: 'media', keywords: ['jellyseerr', 'request', 'jellyfin'], url: `${DASHBOARD_ICONS_BASE}/jellyseerr.svg` },
  { name: 'Audiobookshelf', slug: 'audiobookshelf', category: 'media', keywords: ['audiobookshelf', 'audiobook', 'podcast'], url: `${DASHBOARD_ICONS_BASE}/audiobookshelf.svg` },
  { name: 'Navidrome', slug: 'navidrome', category: 'media', keywords: ['navidrome', 'music', 'subsonic', 'audio'], url: `${DASHBOARD_ICONS_BASE}/navidrome.svg` },
  { name: 'Photoprism', slug: 'photoprism', category: 'media', keywords: ['photoprism', 'photos', 'gallery', 'kepek'], url: `${DASHBOARD_ICONS_BASE}/photoprism.svg` },
  { name: 'Immich', slug: 'immich', category: 'media', keywords: ['immich', 'photos', 'backup', 'gallery'], url: `${DASHBOARD_ICONS_BASE}/immich.svg` },
  { name: 'Tautulli', slug: 'tautulli', category: 'media', keywords: ['tautulli', 'plex', 'stats', 'monitoring'], url: `${DASHBOARD_ICONS_BASE}/tautulli.svg` },
  { name: 'Kavita', slug: 'kavita', category: 'media', keywords: ['kavita', 'manga', 'comics', 'ebook'], url: `${DASHBOARD_ICONS_BASE}/kavita.svg` },
  { name: 'Calibre Web', slug: 'calibre-web', category: 'media', keywords: ['calibre', 'ebook', 'konyv'], url: `${DASHBOARD_ICONS_BASE}/calibre-web.svg` },
  { name: 'TubeArchivist', slug: 'tubearchivist', category: 'media', keywords: ['youtube', 'video', 'tubearchivist', 'archive'], url: `${DASHBOARD_ICONS_BASE}/tubearchivist.svg` },

  // --- NETWORK & DNS ---
  { name: 'Pi-hole', slug: 'pi-hole', category: 'network', keywords: ['pihole', 'pi-hole', 'dns', 'adblock'], url: `${DASHBOARD_ICONS_BASE}/pi-hole.svg` },
  { name: 'AdGuard Home', slug: 'adguard-home', category: 'network', keywords: ['adguard', 'dns', 'adblock', 'privacy'], url: `${DASHBOARD_ICONS_BASE}/adguard-home.svg` },
  { name: 'WireGuard', slug: 'wireguard', category: 'network', keywords: ['wireguard', 'vpn', 'tunnel'], url: `${DASHBOARD_ICONS_BASE}/wireguard.svg` },
  { name: 'Tailscale', slug: 'tailscale', category: 'network', keywords: ['tailscale', 'vpn', 'mesh', 'network'], url: `${DASHBOARD_ICONS_BASE}/tailscale.svg` },
  { name: 'Nginx Proxy Manager', slug: 'nginx-proxy-manager', category: 'network', keywords: ['nginx', 'npm', 'proxy', 'ssl', 'reverse-proxy'], url: `${DASHBOARD_ICONS_BASE}/nginx-proxy-manager.svg` },
  { name: 'Traefik', slug: 'traefik', category: 'network', keywords: ['traefik', 'reverse-proxy', 'proxy', 'docker'], url: `${DASHBOARD_ICONS_BASE}/traefik.svg` },
  { name: 'Caddy', slug: 'caddy', category: 'network', keywords: ['caddy', 'webserver', 'proxy'], url: `${DASHBOARD_ICONS_BASE}/caddy.svg` },
  { name: 'Cloudflare', slug: 'cloudflare', category: 'network', keywords: ['cloudflare', 'dns', 'tunnel', 'cdn'], url: `${DASHBOARD_ICONS_BASE}/cloudflare.svg` },
  { name: 'pfSense', slug: 'pfsense', category: 'network', keywords: ['pfsense', 'firewall', 'router'], url: `${DASHBOARD_ICONS_BASE}/pfsense.svg` },
  { name: 'OPNsense', slug: 'opnsense', category: 'network', keywords: ['opnsense', 'firewall', 'router'], url: `${DASHBOARD_ICONS_BASE}/opnsense.svg` },
  { name: 'UniFi', slug: 'unifi', category: 'network', keywords: ['unifi', 'ubiquiti', 'wifi', 'controller'], url: `${DASHBOARD_ICONS_BASE}/unifi.svg` },
  { name: 'MikroTik', slug: 'mikrotik', category: 'network', keywords: ['mikrotik', 'router', 'switch', 'winbox'], url: `${DASHBOARD_ICONS_BASE}/mikrotik.svg` },
  { name: 'OpenWRT', slug: 'openwrt', category: 'network', keywords: ['openwrt', 'router', 'firmware'], url: `${DASHBOARD_ICONS_BASE}/openwrt.svg` },

  // --- SYSTEM & VIRTUALIZATION ---
  { name: 'Proxmox VE', slug: 'proxmox', category: 'system', keywords: ['proxmox', 'pve', 'vm', 'lxc', 'hypervisor'], url: `${DASHBOARD_ICONS_BASE}/proxmox.svg` },
  { name: 'Proxmox Backup Server', slug: 'proxmox-backup-server', category: 'system', keywords: ['pbs', 'backup', 'proxmox'], url: `${DASHBOARD_ICONS_BASE}/proxmox-backup-server.svg` },
  { name: 'Portainer', slug: 'portainer', category: 'system', keywords: ['portainer', 'docker', 'container'], url: `${DASHBOARD_ICONS_BASE}/portainer.svg` },
  { name: 'Docker', slug: 'docker', category: 'system', keywords: ['docker', 'container', 'daemon'], url: `${DASHBOARD_ICONS_BASE}/docker.svg` },
  { name: 'Kubernetes', slug: 'kubernetes', category: 'system', keywords: ['k8s', 'kubernetes', 'cluster'], url: `${DASHBOARD_ICONS_BASE}/kubernetes.svg` },
  { name: 'TrueNAS CORE', slug: 'truenas', category: 'system', keywords: ['truenas', 'freenas', 'nas', 'storage', 'zfs'], url: `${DASHBOARD_ICONS_BASE}/truenas.svg` },
  { name: 'TrueNAS SCALE', slug: 'truenas-scale', category: 'system', keywords: ['truenas', 'scale', 'nas', 'zfs', 'storage'], url: `${DASHBOARD_ICONS_BASE}/truenas-scale.svg` },
  { name: 'Unraid', slug: 'unraid', category: 'system', keywords: ['unraid', 'nas', 'array', 'docker'], url: `${DASHBOARD_ICONS_BASE}/unraid.svg` },
  { name: 'CasaOS', slug: 'casaos', category: 'system', keywords: ['casaos', 'home-cloud', 'docker'], url: `${DASHBOARD_ICONS_BASE}/casaos.svg` },
  { name: 'Cosmos Cloud', slug: 'cosmos-cloud', category: 'system', keywords: ['cosmos', 'server', 'docker'], url: `${DASHBOARD_ICONS_BASE}/cosmos-cloud.svg` },
  { name: 'Synology DSM', slug: 'synology', category: 'system', keywords: ['synology', 'dsm', 'nas'], url: `${DASHBOARD_ICONS_BASE}/synology.svg` },
  { name: 'OpenMediaVault', slug: 'openmediavault', category: 'system', keywords: ['omv', 'openmediavault', 'nas'], url: `${DASHBOARD_ICONS_BASE}/openmediavault.svg` },
  { name: 'VMware ESXi', slug: 'vmware', category: 'system', keywords: ['vmware', 'esxi', 'vsphere', 'vm'], url: `${DASHBOARD_ICONS_BASE}/vmware.svg` },

  // --- MONITORING & ANALYTICS ---
  { name: 'Grafana', slug: 'grafana', category: 'system', keywords: ['grafana', 'metrics', 'dashboard', 'monitor'], url: `${DASHBOARD_ICONS_BASE}/grafana.svg` },
  { name: 'Prometheus', slug: 'prometheus', category: 'system', keywords: ['prometheus', 'metrics', 'alerting'], url: `${DASHBOARD_ICONS_BASE}/prometheus.svg` },
  { name: 'Uptime Kuma', slug: 'uptime-kuma', category: 'system', keywords: ['uptime-kuma', 'uptime', 'kuma', 'status', 'ping'], url: `${DASHBOARD_ICONS_BASE}/uptime-kuma.svg` },
  { name: 'Netdata', slug: 'netdata', category: 'system', keywords: ['netdata', 'monitoring', 'performance', 'cpu'], url: `${DASHBOARD_ICONS_BASE}/netdata.svg` },
  { name: 'Glances', slug: 'glances', category: 'system', keywords: ['glances', 'system-monitor', 'cpu'], url: `${DASHBOARD_ICONS_BASE}/glances.svg` },
  { name: 'Zabbix', slug: 'zabbix', category: 'system', keywords: ['zabbix', 'monitoring', 'enterprise'], url: `${DASHBOARD_ICONS_BASE}/zabbix.svg` },
  { name: 'Dozzle', slug: 'dozzle', category: 'system', keywords: ['dozzle', 'logs', 'docker'], url: `${DASHBOARD_ICONS_BASE}/dozzle.svg` },
  { name: 'Beszel', slug: 'beszel', category: 'system', keywords: ['beszel', 'lightweight', 'monitoring'], url: `${SELFHOSTED_ICONS_BASE}/beszel.svg` },

  // --- SMART HOME & AUTOMATION ---
  { name: 'Home Assistant', slug: 'home-assistant', category: 'smarthome', keywords: ['homeassistant', 'hass', 'smart-home', 'okosotthon', 'zigbee'], url: `${DASHBOARD_ICONS_BASE}/home-assistant.svg` },
  { name: 'Node-RED', slug: 'node-red', category: 'smarthome', keywords: ['node-red', 'nodered', 'flow', 'automation'], url: `${DASHBOARD_ICONS_BASE}/node-red.svg` },
  { name: 'Zigbee2MQTT', slug: 'zigbee2mqtt', category: 'smarthome', keywords: ['zigbee', 'z2m', 'zigbee2mqtt', 'sensor'], url: `${DASHBOARD_ICONS_BASE}/zigbee2mqtt.svg` },
  { name: 'ESPHome', slug: 'esphome', category: 'smarthome', keywords: ['esphome', 'esp8266', 'esp32', 'firmware'], url: `${DASHBOARD_ICONS_BASE}/esphome.svg` },
  { name: 'Mosquitto MQTT', slug: 'mosquitto', category: 'smarthome', keywords: ['mqtt', 'mosquitto', 'broker'], url: `${DASHBOARD_ICONS_BASE}/mosquitto.svg` },
  { name: 'Frigate NVR', slug: 'frigate', category: 'smarthome', keywords: ['frigate', 'nvr', 'camera', 'ai', 'kamera'], url: `${DASHBOARD_ICONS_BASE}/frigate.svg` },
  { name: 'Scrypted', slug: 'scrypted', category: 'smarthome', keywords: ['scrypted', 'homekit', 'camera'], url: `${DASHBOARD_ICONS_BASE}/scrypted.svg` },
  { name: 'Homebridge', slug: 'homebridge', category: 'smarthome', keywords: ['homebridge', 'apple', 'homekit'], url: `${DASHBOARD_ICONS_BASE}/homebridge.svg` },
  { name: 'n8n', slug: 'n8n', category: 'smarthome', keywords: ['n8n', 'workflow', 'automation', 'webhook'], url: `${DASHBOARD_ICONS_BASE}/n8n.svg` },

  // --- CLOUD & STORAGE ---
  { name: 'Nextcloud', slug: 'nextcloud', category: 'storage', keywords: ['nextcloud', 'cloud', 'files', 'drive', 'tárhely'], url: `${DASHBOARD_ICONS_BASE}/nextcloud.svg` },
  { name: 'ownCloud', slug: 'owncloud', category: 'storage', keywords: ['owncloud', 'cloud', 'files'], url: `${DASHBOARD_ICONS_BASE}/owncloud.svg` },
  { name: 'Filebrowser', slug: 'filebrowser', category: 'storage', keywords: ['filebrowser', 'file-manager', 'fajl'], url: `${DASHBOARD_ICONS_BASE}/filebrowser.svg` },
  { name: 'Syncthing', slug: 'syncthing', category: 'storage', keywords: ['syncthing', 'sync', 'backup', 'p2p'], url: `${DASHBOARD_ICONS_BASE}/syncthing.svg` },
  { name: 'MinIO', slug: 'minio', category: 'storage', keywords: ['minio', 's3', 'object-storage'], url: `${DASHBOARD_ICONS_BASE}/minio.svg` },
  { name: 'Seafile', slug: 'seafile', category: 'storage', keywords: ['seafile', 'cloud', 'storage'], url: `${DASHBOARD_ICONS_BASE}/seafile.svg` },

  // --- SECURITY & AUTH ---
  { name: 'Authentik', slug: 'authentik', category: 'security', keywords: ['authentik', 'sso', 'identity', 'oidc', 'saml', 'auth'], url: `${DASHBOARD_ICONS_BASE}/authentik.svg` },
  { name: 'Vaultwarden', slug: 'vaultwarden', category: 'security', keywords: ['vaultwarden', 'bitwarden', 'password', 'jelszokezelo'], url: `${DASHBOARD_ICONS_BASE}/vaultwarden.svg` },
  { name: 'Bitwarden', slug: 'bitwarden', category: 'security', keywords: ['bitwarden', 'passwords', 'vault'], url: `${DASHBOARD_ICONS_BASE}/bitwarden.svg` },
  { name: 'Authelia', slug: 'authelia', category: 'security', keywords: ['authelia', '2fa', 'mfa', 'auth'], url: `${DASHBOARD_ICONS_BASE}/authelia.svg` },
  { name: 'Keycloak', slug: 'keycloak', category: 'security', keywords: ['keycloak', 'iam', 'sso', 'oidc'], url: `${DASHBOARD_ICONS_BASE}/keycloak.svg` },
  { name: 'CrowdSec', slug: 'crowdsec', category: 'security', keywords: ['crowdsec', 'security', 'ips', 'fail2ban'], url: `${DASHBOARD_ICONS_BASE}/crowdsec.svg` },
  { name: 'Apache Guacamole', slug: 'guacamole', category: 'security', keywords: ['guacamole', 'rdp', 'vnc', 'ssh', 'remote-desktop'], url: `${DASHBOARD_ICONS_BASE}/guacamole.svg` },

  // --- DOWNLOADERS & TORRENTS ---
  { name: 'qBittorrent', slug: 'qbittorrent', category: 'download', keywords: ['qbittorrent', 'torrent', 'download', 'letoltes'], url: `${DASHBOARD_ICONS_BASE}/qbittorrent.svg` },
  { name: 'Transmission', slug: 'transmission', category: 'download', keywords: ['transmission', 'torrent', 'download'], url: `${DASHBOARD_ICONS_BASE}/transmission.svg` },
  { name: 'Deluge', slug: 'deluge', category: 'download', keywords: ['deluge', 'torrent', 'download'], url: `${DASHBOARD_ICONS_BASE}/deluge.svg` },
  { name: 'SABnzbd', slug: 'sabnzbd', category: 'download', keywords: ['sabnzbd', 'usenet', 'nzb', 'download'], url: `${DASHBOARD_ICONS_BASE}/sabnzbd.svg` },
  { name: 'NZBGet', slug: 'nzbget', category: 'download', keywords: ['nzbget', 'usenet', 'nzb'], url: `${DASHBOARD_ICONS_BASE}/nzbget.svg` },
  { name: 'Aria2', slug: 'aria2', category: 'download', keywords: ['aria2', 'downloader', 'ariang'], url: `${DASHBOARD_ICONS_BASE}/aria2.svg` },
  { name: 'JDownloader', slug: 'jdownloader', category: 'download', keywords: ['jdownloader', 'downloader', 'direct-download'], url: `${DASHBOARD_ICONS_BASE}/jdownloader.svg` },

  // --- TOOLS & PRODUCTIVITY ---
  { name: 'Paperless-ngx', slug: 'paperless-ngx', category: 'tools', keywords: ['paperless', 'paperless-ngx', 'dms', 'document', 'ocr'], url: `${DASHBOARD_ICONS_BASE}/paperless-ngx.svg` },
  { name: 'BookStack', slug: 'bookstack', category: 'tools', keywords: ['bookstack', 'wiki', 'documentation', 'notes'], url: `${DASHBOARD_ICONS_BASE}/bookstack.svg` },
  { name: 'Vikunja', slug: 'vikunja', category: 'tools', keywords: ['vikunja', 'todo', 'tasks', 'feladatok'], url: `${DASHBOARD_ICONS_BASE}/vikunja.svg` },
  { name: 'Mealie', slug: 'mealie', category: 'tools', keywords: ['mealie', 'recipes', 'recept', 'cooking'], url: `${DASHBOARD_ICONS_BASE}/mealie.svg` },
  { name: 'Stirling-PDF', slug: 'stirling-pdf', category: 'tools', keywords: ['stirling', 'pdf', 'converter', 'tools'], url: `${DASHBOARD_ICONS_BASE}/stirling-pdf.svg` },
  { name: 'IT-Tools', slug: 'it-tools', category: 'tools', keywords: ['it-tools', 'developer-tools', 'converter', 'generator'], url: `${DASHBOARD_ICONS_BASE}/it-tools.svg` },
  { name: 'Trilium Notes', slug: 'trilium', category: 'tools', keywords: ['trilium', 'notes', 'knowledge-base'], url: `${DASHBOARD_ICONS_BASE}/trilium.svg` },
  { name: 'Wallabag', slug: 'wallabag', category: 'tools', keywords: ['wallabag', 'read-it-later', 'pocket'], url: `${DASHBOARD_ICONS_BASE}/wallabag.svg` },
  { name: 'FreshRSS', slug: 'freshrss', category: 'tools', keywords: ['freshrss', 'rss', 'news', 'feed'], url: `${DASHBOARD_ICONS_BASE}/freshrss.svg` },
  { name: 'ChangeDetection.io', slug: 'changedetection-io', category: 'tools', keywords: ['changedetection', 'monitor', 'web-change'], url: `${DASHBOARD_ICONS_BASE}/changedetection-io.svg` },

  // --- DEVELOPER & DATABASE ---
  { name: 'Gitea', slug: 'gitea', category: 'dev', keywords: ['gitea', 'git', 'github', 'repository'], url: `${DASHBOARD_ICONS_BASE}/gitea.svg` },
  { name: 'Forgejo', slug: 'forgejo', category: 'dev', keywords: ['forgejo', 'git', 'gitea'], url: `${DASHBOARD_ICONS_BASE}/forgejo.svg` },
  { name: 'GitLab', slug: 'gitlab', category: 'dev', keywords: ['gitlab', 'git', 'ci-cd', 'devops'], url: `${DASHBOARD_ICONS_BASE}/gitlab.svg` },
  { name: 'VS Code Server', slug: 'code-server', category: 'dev', keywords: ['vscode', 'code-server', 'editor', 'ide'], url: `${DASHBOARD_ICONS_BASE}/code-server.svg` },
  { name: 'PostgreSQL', slug: 'postgresql', category: 'dev', keywords: ['postgres', 'postgresql', 'database', 'sql'], url: `${DASHBOARD_ICONS_BASE}/postgresql.svg` },
  { name: 'MySQL', slug: 'mysql', category: 'dev', keywords: ['mysql', 'mariadb', 'database', 'sql'], url: `${DASHBOARD_ICONS_BASE}/mysql.svg` },
  { name: 'Redis', slug: 'redis', category: 'dev', keywords: ['redis', 'cache', 'key-value'], url: `${DASHBOARD_ICONS_BASE}/redis.svg` },
  { name: 'phpMyAdmin', slug: 'phpmyadmin', category: 'dev', keywords: ['phpmyadmin', 'mysql', 'admin'], url: `${DASHBOARD_ICONS_BASE}/phpmyadmin.svg` },
];

/**
 * Intelligent icon matcher: Finds matching homelab icon based on app name or keywords
 */
export function findMatchingIcon(appName: string): HomelabIcon | null {
  if (!appName) return null;
  const clean = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Exact match
  const exact = HOMELAB_ICONS.find(icon => 
    icon.slug.replace(/[^a-z0-9]/g, '') === clean || 
    icon.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
  );
  if (exact) return exact;

  // Keyword match
  const match = HOMELAB_ICONS.find(icon => {
    return icon.keywords.some(k => clean.includes(k.replace(/[^a-z0-9]/g, '')));
  });

  return match || null;
}
