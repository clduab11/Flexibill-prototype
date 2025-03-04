import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { NamingStrategyInterface } from 'typeorm';

const isDevelopment = process.env.NODE_ENV === 'development';

// Debug logging with timestamps
function debugLog(...args: any[]) {
  const timestamp = new Date().toISOString();
  if (isDevelopment || process.env.DEBUG_LOGS === 'true') {
    console.log(`[${timestamp}] DATABASE CONFIG:`, ...args);
  }
}
debugLog('Initializing database configuration');

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'flexibill',
  entities: [
    join(__dirname, '..', 'entities', '*.entity.{ts,js}')
  ],
  // Log resolved entity paths
  entitySkipConstructor: false,
  entityPrefix: '', // Can be used to prefix all tables
  // Added entity loading debug
  logging: isDevelopment ? ['query', 'error', 'schema'] : ['error'],
  migrations: [
    join(__dirname, '..', 'migrations', '*.{ts,js}')
  ],
  subscribers: [
    join(__dirname, '..', 'subscribers', '*.subscriber.{ts,js}')
  ],
  // Development options
  synchronize: isDevelopment,
  logging: isDevelopment ? ['query', 'error'] : ['error'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // Log slow queries
  // Production options
  ssl: !isDevelopment ? (() => {
    const sslConfig = {
      rejectUnauthorized: false
    };
    debugLog('Applying SSL configuration:', sslConfig);
    return sslConfig;
  })() : false,
  cache: !isDevelopment ? {
    type: 'redis',
    options: <any>{
      host: (() => {
        const redisHost = process.env.REDIS_HOST || 'redis';
        debugLog('Redis host:', redisHost);
        return redisHost;
      })(),
      ...(process.env.REDIS_PASSWORD ? {
        password: (() => {
          debugLog('Using Redis password');
          return process.env.REDIS_PASSWORD;
        })()
      } : {}),
      tls: !isDevelopment ? {} : undefined,
      connectTimeout: 5000
    } as any,
    duration: 60000
  } : false,
  // Common options
  extra: {
    max: 20, // Connection pool size
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 60000
  },
  migrationsRun: true, // Auto-run migrations
  migrationsTableName: 'migrations',
  namingStrategy: new class CustomNamingStrategy implements NamingStrategyInterface {
    // Log naming conversions
    tableName(className: string, customName: string): string {
      const tableName = customName || className.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      debugLog(`Converting entity name: ${className} => ${tableName}`);
      return tableName;
    }
    
    // Convert camelCase to snake_case for database columns
    columnName(propertyName: string, customName: string): string {
      debugLog(`Converting column name: ${propertyName}`);
      return customName || propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
    }

    // Required interface implementations
    closureJunctionTableName(originalName: string): string { return originalName; }
    relationName(propertyName: string): string { return propertyName; }
    primaryKeyName(entityName: string, _columns: string[]): string { return `PK_${entityName}`; }
    uniqueConstraintName(entityName: string, columns: string[]): string { return `UQ_${entityName}_${columns.join('_')}`; }
    relationConstraintName(tableName: string, columnNames: string[]): string { return `REL_${tableName}_${columnNames.join('_')}`; }
    defaultConstraintName(tableName: string, columnName: string): string { return `DF_${tableName}_${columnName}`; }
    foreignKeyName(tableName: string, columnNames: string[]): string { return `FK_${tableName}_${columnNames.join('_')}`; }
    indexName(tableName: string, columns: string[]): string { return `IDX_${tableName}_${columns.join('_')}`; }
    checkConstraintName(expression: string): string { return `CHK_${expression}`; }
    exclusionConstraintName(expression: string): string { return `EXCL_${expression}`; }
    joinColumnName(relationName: string, referencedColumnName: string): string { return `${relationName}_${referencedColumnName}`; }
    joinTableName(firstTableName: string, secondTableName: string): string { return `${firstTableName}_${secondTableName}`; }
    joinTableColumnName(tableName: string, columnName: string, secondTableName: string): string { return `${tableName}_${columnName}_${secondTableName}`; }
    joinTableInverseColumnName(tableName: string, columnName: string, secondTableName: string): string { return `${tableName}_${columnName}_${secondTableName}_inverse`; }
    classTableInheritanceParentColumnName(parentTable: string, parentColumn: string): string { return `${parentTable}_${parentColumn}`; }
    eagerJoinRelationAlias(alias: string, propertyPath: string): string { return `${alias}__${propertyPath}`; }
    
    // New TypeORM 0.3.x requirements
    joinTableColumnDuplicationPrefix(columnName: string, index: number): string {
      return `${columnName}_${index}`;
    }
    
    prefixTableName(prefix: string, tableName: string): string {
      return `${prefix}${tableName}`;
    }
    
    nestedSetColumnNames = { left: 'nsleft', right: 'nsright', depth: 'nsdepth' };
    materializedPathColumnName = 'mpath';
    
    // Default implementations for tree types
    treeParentColumnName = 'parentId';
    treeLevelColumnName = 'level';
  }()
};

// Environment validation
if (!isDevelopment) {
  debugLog('Validating production environment variables');
  const requiredVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    debugLog('Missing required environment variables:', missingVars);
    throw new Error(`Missing required DB config: ${missingVars.join(', ')}`);
  }

  if (!process.env.REDIS_HOST) {
    debugLog('WARNING: No REDIS_HOST configured - cache disabled');
    // Create new config object to bypass readonly
    const newConfig = {...config, cache: false};
    Object.assign(config, newConfig);
  }
}

export default config;