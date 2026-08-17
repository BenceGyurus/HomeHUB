type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'HTTP' | 'AUTH' | 'AUTHENTIK' | 'DB';

const formatTime = () => {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
};

export const logger = {
  info: (tag: string, message: string, ...args: any[]) => {
    console.log(`[${formatTime()}] [INFO] [${tag}] ${message}`, ...args);
  },
  warn: (tag: string, message: string, ...args: any[]) => {
    console.warn(`[${formatTime()}] [WARN] [${tag}] ${message}`, ...args);
  },
  error: (tag: string, message: string, ...args: any[]) => {
    console.error(`[${formatTime()}] [ERROR] [${tag}] ${message}`, ...args);
  },
  http: (message: string, ...args: any[]) => {
    console.log(`[${formatTime()}] [HTTP] ${message}`, ...args);
  },
  auth: (message: string, ...args: any[]) => {
    console.log(`[${formatTime()}] [AUTH] ${message}`, ...args);
  },
  authentik: (message: string, ...args: any[]) => {
    console.log(`[${formatTime()}] [AUTHENTIK] ${message}`, ...args);
  },
  db: (message: string, ...args: any[]) => {
    console.log(`[${formatTime()}] [DB] ${message}`, ...args);
  },
};
