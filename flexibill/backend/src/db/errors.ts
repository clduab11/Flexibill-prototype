import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { EntityType } from '../entities';

export class DatabaseError extends Error {
  public readonly cause?: Error;
  public readonly code?: string;

  constructor(message: string, options?: { cause?: Error; code?: string }) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = options?.cause;
    this.code = options?.code;
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string = 'Database connection error', options?: { cause?: Error; code?: string }) {
    super(message, options);
    this.name = 'ConnectionError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string = 'Transaction failed', options?: { cause?: Error; code?: string }) {
    super(message, options);
    this.name = 'TransactionError';
  }
}

export class MigrationError extends DatabaseError {
  constructor(message: string = 'Migration failed', options?: { cause?: Error; code?: string }) {
    super(message, options);
    this.name = 'MigrationError';
  }
}

export class EntityError extends DatabaseError {
  public readonly entity?: string;

  constructor(message: string, options?: { cause?: Error; code?: string; entity?: string }) {
    super(message, options);
    this.name = 'EntityError';
    this.entity = options?.entity;
  }
}

export class EntityNotFound extends EntityError {
  constructor(entity: string, id?: string | number) {
    super(
      `${entity}${id ? ` with ID ${id}` : ''} not found`,
      { entity, code: 'ENTITY_NOT_FOUND' }
    );
    this.name = 'EntityNotFound';
  }
}

export class EntityValidationError extends EntityError {
  public readonly errors: Record<string, string[]>;

  constructor(entity: string, errors: Record<string, string[]>) {
    super(
      `Validation failed for ${entity}`,
      { entity, code: 'VALIDATION_ERROR' }
    );
    this.name = 'EntityValidationError';
    this.errors = errors;
  }
}

export class UniqueConstraintError extends EntityError {
  public readonly fields: string[];

  constructor(entity: string, fields: string[]) {
    super(
      `Unique constraint violation for ${entity} on fields: ${fields.join(', ')}`,
      { entity, code: 'UNIQUE_CONSTRAINT' }
    );
    this.name = 'UniqueConstraintError';
    this.fields = fields;
  }
}

export class ForeignKeyError extends EntityError {
  public readonly field: string;
  public readonly referencedEntity: string;

  constructor(entity: string, field: string, referencedEntity: string) {
    super(
      `Foreign key constraint violation for ${entity}.${field} referencing ${referencedEntity}`,
      { entity, code: 'FOREIGN_KEY_CONSTRAINT' }
    );
    this.name = 'ForeignKeyError';
    this.field = field;
    this.referencedEntity = referencedEntity;
  }
}

export function handleDatabaseError(error: Error): never {
  if (error instanceof EntityNotFoundError) {
    const match = error.message.match(/Could not find any entity of type "(\w+)"/);
    const entity = match ? match[1] : 'Unknown';
    throw new EntityNotFound(entity);
  }

  if (error instanceof QueryFailedError) {
    // PostgreSQL error codes
    switch (error.driverError?.code) {
      case '23505': // unique_violation
        const match = error.driverError.detail?.match(/Key \((.*?)\)=/);
        const fields = match ? [match[1]] : ['unknown'];
        throw new UniqueConstraintError(error.driverError.table || 'Unknown', fields);
      
      case '23503': // foreign_key_violation
        const fkMatch = error.driverError.detail?.match(/Key \((.*?)\)=\(.*?\) is not present in table "(\w+)"/);
        if (fkMatch) {
          throw new ForeignKeyError(
            error.driverError.table || 'Unknown',
            fkMatch[1],
            fkMatch[2]
          );
        }
        break;
      
      case '23502': // not_null_violation
        throw new EntityValidationError(
          error.driverError.table || 'Unknown',
          { [error.driverError.column || 'unknown']: ['This field cannot be null'] }
        );
      
      case '42P01': // undefined_table
        throw new DatabaseError('Table not found', { code: 'TABLE_NOT_FOUND', cause: error });
      
      case '28P01': // invalid_password
        throw new ConnectionError('Invalid database credentials', { code: 'INVALID_CREDENTIALS', cause: error });
    }
  }

  // Generic database error
  throw new DatabaseError('An unexpected database error occurred', { cause: error });
}

export function isEntityError(error: Error): error is EntityError {
  return error instanceof EntityError;
}

export function isDatabaseError(error: Error): error is DatabaseError {
  return error instanceof DatabaseError;
}