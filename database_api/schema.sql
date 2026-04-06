-- SQL Schema for DRL Management System
-- Based on the current frontend data structures

CREATE DATABASE IF NOT EXISTS drl_management;
USE drl_management;

-- Table for Users (Authentication)
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL, -- Should be hashed
    role ENUM('admin', 'monitor', 'student', 'bch', 'doankhoa') NOT NULL,
    name VARCHAR(100),
    mssv VARCHAR(20),
    department VARCHAR(100),
    classId VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Students
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY, -- MSSV
    lastName VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    dob DATE,
    classId VARCHAR(50),
    email VARCHAR(100),
    major VARCHAR(100),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for Classes
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Grading Periods (Semesters)
CREATE TABLE IF NOT EXISTS grading_periods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    startDate DATE,
    endDate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for DRL Scores
CREATE TABLE IF NOT EXISTS drl_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(20) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    selfScore INT DEFAULT 0,
    classScore INT DEFAULT 0,
    bchScore INT DEFAULT 0,
    finalScore INT DEFAULT 0,
    details JSON, -- Stores the DRLDetails object as JSON
    status ENUM('draft', 'submitted', 'class_approved', 'bch_approved', 'finalized') DEFAULT 'draft',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (semester) REFERENCES grading_periods(id),
    UNIQUE KEY unique_student_semester (studentId, semester)
);

-- Table for Proofs (Evidence images)
CREATE TABLE IF NOT EXISTS proofs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(20) NOT NULL,
    critId VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    semester VARCHAR(50),
    sectionLabel VARCHAR(10),
    sectionId VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id)
);

-- Initial Admin User (Default password: admin123 - SHOULD BE CHANGED)
INSERT IGNORE INTO users (username, password, role, name) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'admin', 'System Administrator');
