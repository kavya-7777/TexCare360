-- ==========================================================
--  TexCare360 – Smart Management for Textile Industries
--  Database Setup Script
-- ==========================================================

-- DATABASE CREATION
CREATE DATABASE IF NOT EXISTS texcare DEFAULT CHARACTER SET utf8mb4;
USE texcare;

-- ==========================================================
-- TABLES
-- ==========================================================

-- MACHINES TABLE
CREATE TABLE IF NOT EXISTS machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('Healthy','Unhealthy') NOT NULL DEFAULT 'Healthy',
  required_skill VARCHAR(100) DEFAULT 'Mechanical',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TECHNICIANS TABLE
CREATE TABLE IF NOT EXISTS technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  skill VARCHAR(100) NOT NULL,
  status ENUM('Available','Busy') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category ENUM('Spare Parts','Raw Materials','Maintenance Supplies','Consumables') NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  supplier VARCHAR(120),
  lead_time INT,
  expiry DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAINTENANCE LOGS TABLE
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machine_id INT NOT NULL,
  tech_id INT NOT NULL,
  skill VARCHAR(100),
  date_time DATETIME NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  parts_used VARCHAR(255),
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (tech_id) REFERENCES technicians(id)
);

-- STOCK HISTORY TABLE
CREATE TABLE IF NOT EXISTS stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action ENUM('Added','Deleted','Used','Restocked') NOT NULL,
  item VARCHAR(120) NOT NULL,
  qty_change INT NOT NULL,
  user VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Technician','Manager') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- SAMPLE DATA INSERTION
-- ==========================================================

-- MACHINES
INSERT INTO machines (name, status, required_skill) VALUES
('Loom Machine 1', 'Healthy', 'Mechanical'),
('Loom Machine 2', 'Unhealthy', 'Electrical'),
('Dyeing Unit', 'Healthy', 'Mechanical'),
('Cutting Machine', 'Healthy', 'Mechanical'),
('Loom Machine 57', 'Unhealthy','Designer'),
('Loom Machine 180', 'Unhealthy','Electrical'),
('Machine 40', 'Unhealthy','Mechanical');

-- TECHNICIANS
INSERT INTO technicians (name, skill, status) VALUES
('Arjun Kumar', 'Electrical', 'Available'),
('Meena Sharma', 'Mechanical', 'Busy'),
('Ravi Verma', 'Electronics', 'Available'),
('Priya Singh', 'Mechanical', 'Available'),
('Asmitha', 'Electrical', 'Available'),
('Sri Dharsan', 'Electronics', 'Available');

-- INVENTORY
INSERT INTO inventory (name, category, quantity, supplier, lead_time, expiry) VALUES
('Spindle', 'Spare Parts', 20, 'TexSpare Suppliers', 7, '2026-01-01'),
('Belt', 'Spare Parts', 15, 'Machinery Hub', 10, '2025-12-15'),
('Cotton Rolls', 'Raw Materials', 200, 'Cotton Mills Ltd', 5, '2025-12-15'),
('Lubricant Oil', 'Maintenance Supplies', 30, 'Industrial Oils Co.', 3, '2025-11-30'),
('Needles', 'Consumables', 100, 'SewFast Traders', 2, '2025-12-15');

-- MAINTENANCE LOGS
INSERT INTO maintenance_logs (machine_id, tech_id, skill, date_time, completed, parts_used) VALUES
(1, 1, 'Electrical', '2025-08-30 10:30:00', 1, 'Spindle'),
(2, 2, 'Mechanical', '2025-08-28 15:00:00', 0, 'Belt'),
(3, 3, 'Electronics', '2025-08-29 09:15:00', 1, 'Sensor'),
(4, 4, 'Mechanical', '2025-08-30 11:45:00', 1, 'Needles');

-- STOCK HISTORY
INSERT INTO stock_history (action, item, qty_change, user) VALUES
('Added', 'Spindle', 20, 'Admin'),
('Added', 'Belt', 15, 'Admin'),
('Used', 'Spindle', -2, 'Technician: Arjun Kumar'),
('Used', 'Belt', -1, 'Technician: Meena Sharma'),
('Deleted', 'Lubricant Oil', -5, 'Admin');
