/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mysql from 'mysql2/promise';

/**
 * Database connection configuration
 * These values should be stored in environment variables for security
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drl_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool for better performance
const pool = mysql.createPool(dbConfig);

/**
 * Executes a SQL query and returns the results
 * @param sql The SQL query string
 * @param params Optional parameters for the query
 * @returns The query results
 */
export async function query(sql: string, params?: any[]) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * import { query } from './db_connection';
 * 
 * const students = await query('SELECT * FROM students WHERE classId = ?', ['K65A1']);
 * console.log(students);
 */

/**
 * Closes the connection pool
 */
export async function closePool() {
  await pool.end();
}

export default pool;
