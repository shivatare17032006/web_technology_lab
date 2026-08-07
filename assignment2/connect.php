<?php
$servername = "127.0.0.1:3307";
$username = "root";
$password = "";

// 1. Create connection to MySQL
$conn = new mysqli($servername, $username, $password);

$db_connected = false;
$db_created = false;
$tables_created = false;
$db_error = "";

// Check connection
if ($conn->connect_error) {
    $db_error = $conn->connect_error;
} else {
    $db_connected = true;
    
    // 2. Create database if not exists
    $sql = "CREATE DATABASE IF NOT EXISTS wt_assignment2";
    if ($conn->query($sql) === TRUE) {
        $db_created = true;
        // Select the database
        $conn->select_db("wt_assignment2");
        
        // 3. Create students table
        $students_table = "CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            roll_no VARCHAR(50) NOT NULL UNIQUE,
            class VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // 4. Create marks table
        $marks_table = "CREATE TABLE IF NOT EXISTS marks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            marks_obtained INT NOT NULL,
            max_marks INT DEFAULT 100,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )";
        
        if ($conn->query($students_table) === TRUE && $conn->query($marks_table) === TRUE) {
            $tables_created = true;
        } else {
            $db_error = "Table creation failed: " . $conn->error;
        }
    } else {
        $db_error = "Database creation failed: " . $conn->error;
    }
}

// Fetch existing students for demonstration
$students = [];
if ($db_connected && $tables_created) {
    $result = $conn->query("SELECT * FROM students ORDER BY created_at DESC");
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Fetch marks for each student
            $student_id = $row['id'];
            $marks_result = $conn->query("SELECT * FROM marks WHERE student_id = $student_id");
            $marks = [];
            while ($mark_row = $marks_result->fetch_assoc()) {
                $marks[] = $mark_row;
            }
            $row['marks'] = $marks;
            $students[] = $row;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MySQL Connection Status | XAMPP & PHP</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-gold: #d97706;
            --accent-gold-hover: #b45309;
            --success: #10b981;
            --danger: #ef4444;
            --border-color: #334155;
            --card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            line-height: 1.6;
        }

        .container {
            width: 100%;
            max-width: 800px;
            background-color: var(--bg-secondary);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            box-shadow: var(--card-shadow);
            padding: 2.5rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-gold), var(--success));
        }

        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            font-size: 1.1rem;
            font-weight: 300;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .status-card {
            background-color: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .status-card:hover {
            transform: translateY(-2px);
            border-color: var(--accent-gold);
        }

        .status-title {
            font-size: 0.9rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            font-weight: 600;
            font-size: 1.1rem;
        }

        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
            display: inline-block;
        }

        .dot.success {
            background-color: var(--success);
            box-shadow: 0 0 10px var(--success);
        }

        .dot.danger {
            background-color: var(--danger);
            box-shadow: 0 0 10px var(--danger);
        }

        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }

        .error-box {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            font-family: monospace;
            text-align: left;
            overflow-x: auto;
        }

        .db-data {
            margin-top: 2rem;
            text-align: left;
        }

        .db-data h2 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
            color: var(--accent-gold);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.5rem;
            font-size: 0.95rem;
        }

        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background-color: rgba(15, 23, 42, 0.4);
            color: var(--text-primary);
            font-weight: 600;
        }

        tr:hover td {
            background-color: rgba(255, 255, 255, 0.02);
        }

        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .badge {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 0.1rem 0.4rem;
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        .footer {
            margin-top: 2.5rem;
            color: var(--text-secondary);
            font-size: 0.85rem;
            font-weight: 300;
        }

        .footer a {
            color: var(--accent-gold);
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .footer a:hover {
            color: var(--accent-gold-hover);
            text-decoration: underline;
        }
    </style>
</head>
<body>

    <div class="container">
        <h1>MySQL Database Connectivity</h1>
        <p class="subtitle">Assignment 2: XAMPP, PHP, Node.js & React Integration</p>

        <?php if (!empty($db_error)): ?>
            <div class="error-box">
                <strong>Error:</strong> <?php echo htmlspecialchars($db_error); ?>
            </div>
        <?php endif; ?>

        <div class="status-grid">
            <div class="status-card">
                <span class="status-title">MySQL Server</span>
                <span class="status-indicator">
                    <span class="dot <?php echo $db_connected ? 'success' : 'danger'; ?>"></span>
                    <span class="<?php echo $db_connected ? 'text-success' : 'text-danger'; ?>">
                        <?php echo $db_connected ? 'Connected' : 'Disconnected'; ?>
                    </span>
                </span>
            </div>

            <div class="status-card">
                <span class="status-title">Database Status</span>
                <span class="status-indicator">
                    <span class="dot <?php echo $db_created ? 'success' : 'danger'; ?>"></span>
                    <span class="<?php echo $db_created ? 'text-success' : 'text-danger'; ?>">
                        <?php echo $db_created ? 'wt_assignment2 Created' : 'Not Found'; ?>
                    </span>
                </span>
            </div>

            <div class="status-card">
                <span class="status-title">Tables Setup</span>
                <span class="status-indicator">
                    <span class="dot <?php echo $tables_created ? 'success' : 'danger'; ?>"></span>
                    <span class="<?php echo $tables_created ? 'text-success' : 'text-danger'; ?>">
                        <?php echo $tables_created ? 'Ready' : 'Not Configured'; ?>
                    </span>
                </span>
            </div>
        </div>

        <?php if ($db_connected && $tables_created): ?>
            <div class="db-data">
                <h2>Saved Students & Marksheets (PHP Live View)</h2>
                <?php if (count($students) > 0): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Class & Email</th>
                                <th>Subjects & Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($students as $student): ?>
                                <tr>
                                    <td><strong><?php echo htmlspecialchars($student['roll_no']); ?></strong></td>
                                    <td><?php echo htmlspecialchars($student['name']); ?></td>
                                    <td>
                                        <div><?php echo htmlspecialchars($student['class']); ?></div>
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);"><?php echo htmlspecialchars($student['email']); ?></div>
                                    </td>
                                    <td>
                                        <div class="badge-list">
                                            <?php foreach ($student['marks'] as $mark): ?>
                                                <span class="badge">
                                                    <?php echo htmlspecialchars($mark['subject_name']); ?>: 
                                                    <strong><?php echo htmlspecialchars($mark['marks_obtained']); ?></strong>/<?php echo htmlspecialchars($mark['max_marks']); ?>
                                                </span>
                                            <?php endforeach; ?>
                                            <?php if (empty($student['marks'])): ?>
                                                <span style="color: var(--text-secondary); font-style: italic; font-size: 0.85rem;">No marks added</span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p style="color: var(--text-secondary); font-style: italic; text-align: center; margin: 1.5rem 0;">
                        No student records found. Add them using the Vite React frontend.
                    </p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div class="footer">
            Database initialized automatically. Open your <span style="color: var(--accent-gold);">Vite React Application</span> to add student records and view generated results.
        </div>
    </div>

</body>
</html>
