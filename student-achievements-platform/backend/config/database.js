const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database.db');
let db = null;
let SQL = null;

async function initializeDatabase() {
  try {
    SQL = await initSqlJs();
    
    // Try to load existing database
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('✅ Database loaded from existing file');
    } else {
      db = new SQL.Database();
      console.log('✅ Creating new database');
    }
    
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        registrationNumber TEXT,
        department TEXT,
        year INTEGER,
        phone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create achievements table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        level TEXT NOT NULL,
        position TEXT DEFAULT 'participant',
        organizer TEXT NOT NULL,
        date DATE NOT NULL,
        proofFile TEXT,
        status TEXT DEFAULT 'pending',
        approvedBy INTEGER,
        approvedAt DATETIME,
        remarks TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default accounts
    await createDefaultUsers();
    
    // Save database
    saveDatabase();
    console.log('✅ SQLite (sql.js) connected');
    console.log('✅ Database tables initialized');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

async function createDefaultUsers() {
  try {
    // ========== EDIT THESE CREDENTIALS ==========
    const STUDENT_USERNAME = '2400033326';
    const STUDENT_PASSWORD = 'Blackbuck@2006';
    const STUDENT_EMAIL = 'johnshreyannicky19@gmail.com';
    const STUDENT_NAME = 'Kavati John Shreyan';
    const STUDENT_ENROLLMENT = 'KLU-2024-326';
    
    const ADMIN_USERNAME = 'Adminjohn';
    const ADMIN_PASSWORD = 'Admin@john';
    const ADMIN_EMAIL = 'adminjohn@kluniversity.in';
    const ADMIN_NAME = 'User Admin John';
    const ADMIN_ENROLLMENT = 'ADM-2024-3326';
    // ==========================================
    
    // Check if student exists
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([STUDENT_USERNAME]);
    const hasStudent = stmt.step();
    stmt.free();
    
    if (!hasStudent) {
      const hashedPassword = await bcrypt.hash(STUDENT_PASSWORD, 10);
      db.run(`
        INSERT INTO users (username, email, password, fullName, role, registrationNumber)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [STUDENT_USERNAME, STUDENT_EMAIL, hashedPassword, STUDENT_NAME, 'student', STUDENT_ENROLLMENT]);
      
      console.log('\n🎓 DEFAULT STUDENT ACCOUNT CREATED:');
      console.log('   ✓ Username: ' + STUDENT_USERNAME);
      console.log('   ✓ Password: ' + STUDENT_PASSWORD);
      console.log('   ✓ Email: ' + STUDENT_EMAIL);
      console.log('   ✓ Role: Student\n');
    }
    
    // Check if admin exists
    const stmt2 = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt2.bind([ADMIN_USERNAME]);
    const hasAdmin = stmt2.step();
    stmt2.free();
    
    if (!hasAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      db.run(`
        INSERT INTO users (username, email, password, fullName, role, registrationNumber)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [ADMIN_USERNAME, ADMIN_EMAIL, hashedPassword, ADMIN_NAME, 'admin', ADMIN_ENROLLMENT]);
      
      console.log('👨‍💼 DEFAULT ADMIN ACCOUNT CREATED:');
      console.log('   ✓ Username: ' + ADMIN_USERNAME);
      console.log('   ✓ Password: ' + ADMIN_PASSWORD);
      console.log('   ✓ Email: ' + ADMIN_EMAIL);
      console.log('   ✓ Role: Admin\n');
    }
    
  } catch (error) {
    console.error('Error creating default users:', error);
  }
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function runAsync(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { success: true };
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  }
}

function getAsync(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  }
}

function allAsync(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  }
}

module.exports = {
  initializeDatabase,
  runAsync,
  getAsync,
  allAsync,
  saveDatabase
};
