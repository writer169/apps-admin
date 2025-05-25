export interface AppConfig {
  [appId: string]: string
}

export interface AppInfo {
  id: string
  name: string
  url: string
}

export function getAppsConfig(): AppConfig {
  const configJson = process.env.APP_CONFIG_JSON
  if (!configJson) {
    throw new Error('APP_CONFIG_JSON environment variable is not set')
  }
  
  try {
    return JSON.parse(configJson) as AppConfig
  } catch (error) {
    throw new Error('Invalid APP_CONFIG_JSON format')
  }
}

export function getAppsInfo(): AppInfo[] {
  const config = getAppsConfig()
  
  return Object.entries(config).map(([id, url]) => ({
    id,
    name: formatAppName(id),
    url
  }))
}

function formatAppName(appId: string): string {
  return appId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}