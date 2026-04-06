# Database API for DRL Management System

This folder contains the SQL schema and TypeScript connection code for the DRL Management System.

## Contents

- `schema.sql`: SQL script to create the database and tables.
- `db_connection.ts`: TypeScript code to connect to the MySQL database using `mysql2`.

## Setup Instructions

1.  **Database Setup**:
    -   Import `schema.sql` into your MySQL server.
    -   Update the database configuration in `db_connection.ts` or use environment variables.

2.  **Dependencies**:
    -   Install `mysql2` in your project:
        ```bash
        npm install mysql2
        ```

3.  **Environment Variables**:
    -   Create a `.env` file in your project root and add the following:
        ```env
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=yourpassword
        DB_NAME=drl_management
        ```

4.  **Usage**:
    -   Import the `query` function from `db_connection.ts` to execute SQL queries.
    -   Example:
        ```typescript
        import { query } from './database_api/db_connection';

        const students = await query('SELECT * FROM students');
        console.log(students);
        ```

## Data Mapping

The database schema is mapped to the frontend types as follows:

-   `users` -> `User`
-   `students` -> `Student`
-   `classes` -> `ClassGroup`
-   `grading_periods` -> `GradingPeriod`
-   `drl_scores` -> `DRLScore`
-   `proofs` -> `DRLDetails.proofs`
