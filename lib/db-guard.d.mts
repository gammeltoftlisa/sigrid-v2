export declare const PRODUCTION_DB_ENDPOINT: string
export declare const isProductionDatabase: (url: string) => boolean
export declare function assertDatabaseAllowed(url: string): void
export declare function databaseUrl(options?: { unpooled?: boolean }): string
