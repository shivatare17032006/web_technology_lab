require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool Connection
let pool;

async function initDB() {
  try {
    // Connect to MySQL server (without selecting DB first to ensure we can create it)
    const initConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Create database if not exists
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'wt_assignment2'}\``);
    await initConnection.end();

    // Reconnect with database selected
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wt_assignment2',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create Students Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        roll_no VARCHAR(50) NOT NULL UNIQUE,
        class VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Marks Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_name VARCHAR(100) NOT NULL,
        marks_obtained INT NOT NULL,
        max_marks INT DEFAULT 100,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    console.log('MySQL Database and Tables initialized successfully');
  } catch (error) {
    console.error('Failed to connect to MySQL database:', error.message);
    process.exit(1);
  }
}

// Initialize database
initDB();

// API Endpoints

// 1. Save or Update Result (Upsert)
app.post('/api/results', async (req, res) => {
  const { name, email, roll_no, class: className, subjects } = req.body;

  // Basic Validation
  if (!name || !email || !roll_no || !className || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: 'Please provide student details and at least one subject with marks' });
  }

  // Get a connection from pool for transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if student already exists by roll number
    const [existingStudents] = await connection.query(
      'SELECT id FROM students WHERE roll_no = ?',
      [roll_no]
    );

    let studentId;

    if (existingStudents.length > 0) {
      // Update existing student
      studentId = existingStudents[0].id;
      await connection.query(
        'UPDATE students SET name = ?, email = ?, class = ? WHERE id = ?',
        [name, email, className, studentId]
      );
      
      // Delete old marks
      await connection.query('DELETE FROM marks WHERE student_id = ?', [studentId]);
    } else {
      // Insert new student
      const [insertResult] = await connection.query(
        'INSERT INTO students (name, email, roll_no, class) VALUES (?, ?, ?, ?)',
        [name, email, roll_no, className]
      );
      studentId = insertResult.insertId;
    }

    // Insert new marks
    const markInsertQueries = subjects.map(sub => {
      const marksObtained = parseInt(sub.marks_obtained, 10) || 0;
      const maxMarks = parseInt(sub.max_marks, 10) || 100;
      return connection.query(
        'INSERT INTO marks (student_id, subject_name, marks_obtained, max_marks) VALUES (?, ?, ?, ?)',
        [studentId, sub.subject_name, marksObtained, maxMarks]
      );
    });

    await Promise.all(markInsertQueries);

    // Commit Transaction
    await connection.commit();

    // Fetch the updated student details with marks to return
    const [studentRows] = await connection.query(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );
    const [marksRows] = await connection.query(
      'SELECT subject_name, marks_obtained, max_marks FROM marks WHERE student_id = ?',
      [studentId]
    );

    res.status(existingStudents.length > 0 ? 200 : 210).json({
      message: existingStudents.length > 0 ? 'Result updated successfully' : 'Result created successfully',
      student: {
        ...studentRows[0],
        subjects: marksRows
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error during database operation:', error);
    res.status(500).json({ error: 'Database transaction failed: ' + error.message });
  } finally {
    connection.release();
  }
});

// 2. Get All Results
app.get('/api/results', async (req, res) => {
  try {
    const [students] = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
    
    // Fetch marks for each student
    const studentsWithMarks = await Promise.all(students.map(async (student) => {
      const [marks] = await pool.query(
        'SELECT subject_name, marks_obtained, max_marks FROM marks WHERE student_id = ?',
        [student.id]
      );
      return {
        ...student,
        subjects: marks
      };
    }));

    res.json(studentsWithMarks);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to retrieve results: ' + error.message });
  }
});

// 3. Get Single Result by Roll Number
app.get('/api/results/:roll_no', async (req, res) => {
  const { roll_no } = req.params;
  try {
    const [students] = await pool.query('SELECT * FROM students WHERE roll_no = ?', [roll_no]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: `Student with roll number ${roll_no} not found` });
    }

    const student = students[0];
    const [marks] = await pool.query(
      'SELECT subject_name, marks_obtained, max_marks FROM marks WHERE student_id = ?',
      [student.id]
    );

    res.json({
      ...student,
      subjects: marks
    });
  } catch (error) {
    console.error('Error fetching student result:', error);
    res.status(500).json({ error: 'Failed to retrieve student result: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
