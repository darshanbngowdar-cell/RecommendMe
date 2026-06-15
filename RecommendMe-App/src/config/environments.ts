/**
 * Environment Configuration
 * 
 * This file provides environment-specific configuration for local and cloud deployment.
 * Update this file to switch between environments or add new deployment URLs.
 */

export type Environment = 'development' | 'production';

interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  apiTimeout: number;
  debugApi: boolean;
  description: string;
}

// ============================================================================
// ENVIRONMENT CONFIGURATIONS
// ============================================================================

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    apiUrl: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000/v1',
    apiTimeout: 30000,
    debugApi: true,
    description: 'Local development (backend on localhost:8000)',
  },
  production: {
    name: 'production',
    apiUrl: import.meta.env.VITE_PRODUCTION_API_URL || 'https://recommendme-api-production.up.railway.app/v1',
    apiTimeout: 30000,
    debugApi: false,
    description: 'Cloud deployment (Railway/Vercel/etc)',
  },
};

// ============================================================================
// SMART ENVIRONMENT RESOLVER
// ============================================================================

/**
 * Detect current environment based on:
 * 1. Explicitly set VITE_ENVIRONMENT
 * 2. Vite build mode (MODE)
 * 3. Hostname (localhost = dev, anything else = production)
 */
export function getCurrentEnvironment(): Environment {
  const isLocalHost = (): boolean => {
    if (typeof window === 'undefined') {
      return import.meta.env.DEV;
    }
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  };

  // Priority 1: Explicitly set via VITE_ENVIRONMENT
  const explicitEnv = import.meta.env.VITE_ENVIRONMENT as Environment | undefined;
  if (explicitEnv && ENVIRONMENTS[explicitEnv]) {
    // Guardrail: if deployed on a public host, never force localhost API mode.
    if (explicitEnv === 'development' && !isLocalHost()) {
      return 'production';
    }
    return explicitEnv;
  }

  // Priority 2: Vite build mode
  if (import.meta.env.MODE === 'production') {
    return 'production';
  }

  // Priority 3: Hostname detection
  if (isLocalHost()) {
    return 'development';
  }
  return 'production';
}

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  return ENVIRONMENTS[env];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * Get API base URL with fallback to local if production fails
 */
export function getApiUrl(): string {
  const config = getEnvironmentConfig();
  return config.apiUrl;
}

/**
 * Log current environment info (useful for debugging)
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironmentConfig();
  console.log(
    `[Environment] ${config.name.toUpperCase()} - ${config.description}`,
    {
      apiUrl: config.apiUrl,
      timeout: `${config.apiTimeout}ms`,
      debug: config.debugApi,
    }
  );
}
