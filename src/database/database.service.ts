import { neon } from '@neondatabase/serverless';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
    private readonly sql;

    constructor(private configService: ConfigService) {
        const databaseUrl = this.configService.get('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
        }
        this.sql = neon(databaseUrl);
    }

    async initializeDatabase() {
        // Create users table if it doesn't exist
        await this.sql`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE TABLE IF NOT EXISTS users (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                birthdate DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
    }

    async createUser(email: string, hashedPassword: string, name: string, birthdate: string) {
        const result = await this.sql`
            INSERT INTO users (email, password, name, birthdate)
            VALUES (${email}, ${hashedPassword}, ${name}, ${birthdate})
            RETURNING id, email, name, birthdate, created_at
        `;
        return result[0];
    }

    async findUserByEmail(email: string) {
        const result = await this.sql`
            SELECT id, email, password, name, created_at
            FROM users
            WHERE email = ${email}
        `;
        return result[0] || null;
    }

    async findUserById(id: string) {
        const result = await this.sql`
            SELECT id, email, name, birthdate, created_at
            FROM users
            WHERE id = ${id}
        `;
        return result[0] || null;
    }

    async getAllUsers() {
        const result = await this.sql`
            SELECT id, email, name, birthdate, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `;
        return result;
    }

    async updateUser(id: string, data: { name?: string; email?: string; birthdate?: string }) {
        const fields: string[] = [];
        const values: string[] = [];
        
        if (data.name) {
            fields.push('name = $' + (values.length + 1));
            values.push(data.name);
        }
        
        if (data.email) {
            fields.push('email = $' + (values.length + 1));
            values.push(data.email);
        }

        if (data.birthdate) {
            fields.push('birthdate = $' + (values.length + 1));
            values.push(data.birthdate);
        }
        
        if (fields.length === 0) return null;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        
        const query = `
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE id = $${values.length + 1}
            RETURNING id, email, name, birthdate, created_at, updated_at
        `;
        
        const result = await this.sql.unsafe(query, ...values, id);
        return result[0] || null;
    }
} 