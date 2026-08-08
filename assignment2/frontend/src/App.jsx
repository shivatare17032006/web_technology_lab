import React, { useState } from 'react';
import './App.css';

function App() {
  // Student info state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [studentClass, setStudentClass] = useState('');

  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubMarks, setNewSubMarks] = useState('');
  const [newSubMax, setNewSubMax] = useState('100');

  // App statuses
  const [generatedResult, setGeneratedResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Input validations & error checkers
  const validateEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // Add subject to list
  const handleAddSubject = (e) => {
    e.preventDefault();
    const subErrors = {};

    if (!newSubName.trim()) {
      subErrors.subjectName = 'Subject name is required';
    }
    
    const marksVal = parseInt(newSubMarks, 10);
    const maxVal = parseInt(newSubMax, 10);

    if (isNaN(marksVal) || newSubMarks === '') {
      subErrors.marks = 'Marks obtained must be a number';
    } else if (marksVal < 0) {
      subErrors.marks = 'Marks cannot be negative';
    } else if (marksVal > maxVal) {
      subErrors.marks = `Marks cannot exceed Maximum Marks (${maxVal})`;
    }

    if (isNaN(maxVal) || newSubMax === '') {
      subErrors.maxMarks = 'Max marks must be a number';
    } else if (maxVal <= 0) {
      subErrors.maxMarks = 'Max marks must be greater than 0';
    }

    if (Object.keys(subErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...subErrors }));
      return;
    }

    // Clear sub errors
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.subjectName;
      delete copy.marks;
      delete copy.maxMarks;
      return copy;
    });

    // Add subject
    setSubjects([
      ...subjects,
      {
        subject_name: newSubName.trim(),
        marks_obtained: marksVal,
        max_marks: maxVal,
      },
    ]);

    // Reset inputs
    setNewSubName('');
    setNewSubMarks('');
    setNewSubMax('100');
  };

  // Delete subject
  const handleDeleteSubject = (indexToDelete) => {
    setSubjects(subjects.filter((_, idx) => idx !== indexToDelete));
  };

  // Generate Grade for a single subject
  const calculateSubjectGrade = (obtained, max) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  };

  // Submit student details & marks to Node.js Backend
  const handleGenerateResult = async (e) => {
    e.preventDefault();
    const formErrors = {};

    // Validate details
    if (!name.trim()) formErrors.name = 'Student name is required';
    if (!rollNo.trim()) formErrors.rollNo = 'Roll number is required';
    if (!studentClass.trim()) formErrors.studentClass = 'Class is required';
    
    if (!email.trim()) {
      formErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      formErrors.email = 'Please enter a valid email address';
    }

    if (subjects.length === 0) {
      formErrors.subjects = 'Please add at least one subject with marks';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    setApiMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          roll_no: rollNo.trim(),
          class: studentClass.trim(),
          subjects: subjects,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      setGeneratedResult(data.student);
      setMessageType('success');
      setApiMessage(data.message || 'Result generated and stored in database successfully!');
    } catch (err) {
      setMessageType('error');
      setApiMessage(err.message || 'Could not connect to Node.js server. Make sure it is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setName('');
    setEmail('');
    setRollNo('');
    setStudentClass('');
    setSubjects([]);
    setNewSubName('');
    setNewSubMarks('');
    setNewSubMax('100');
    setGeneratedResult(null);
    setErrors({});
    setApiMessage(null);
  };

  // Print Marksheet
  const handlePrint = () => {
    window.print();
  };

  // Calculations for overall result
  const getOverallStats = (subs) => {
    if (!subs || subs.length === 0) return { totalObtained: 0, totalMax: 0, pct: 0, grade: 'F', pass: false };

    let totalObtained = 0;
    let totalMax = 0;
    let anyFailed = false;

    subs.forEach(s => {
      totalObtained += s.marks_obtained;
      totalMax += s.max_marks;
      // Fail condition: if subject marks are below 40%
      const subjectPct = (s.marks_obtained / s.max_marks) * 100;
      if (subjectPct < 40) {
        anyFailed = true;
      }
    });

    const pct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    
    let grade = 'F';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 60) grade = 'C';
    else if (pct >= 50) grade = 'D';
    else if (pct >= 40) grade = 'E';

    // To pass, overall must be >= 40% AND no individual subject failed
    const pass = pct >= 40 && !anyFailed;

    return { totalObtained, totalMax, pct, grade, pass };
  };

  const overallStats = generatedResult ? getOverallStats(generatedResult.subjects) : null;

  return (
    <div className="app-container">
      <header>
        <h1>Student Marksheet & Result Portal</h1>
        <p>Enter academic data to store records in MySQL and generate official transcripts.</p>
      </header>

      <div className="main-layout">
        
        {/* Form Entry Card (Left Side) */}
        <div className="card">
          <h2 className="card-title">
            📝 Student & Subject Registry
          </h2>

          <form onSubmit={handleGenerateResult}>
            
            {/* Student details */}
            <div className="form-group-grid">
              <div className="form-group">
                <label htmlFor="studentName">Student Full Name</label>
                <input
                  id="studentName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="rollNumber">Roll / Enrollment No.</label>
                <input
                  id="rollNumber"
                  type="text"
                  placeholder="e.g. CS2026048"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                />
                {errors.rollNo && <span className="error-text">{errors.rollNo}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="studentEmail">Email Address</label>
                <input
                  id="studentEmail"
                  type="email"
                  placeholder="e.g. john.doe@uni.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="studentClass">Class / Department</label>
                <select
                  id="studentClass"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                >
                  <option value="">Select Class...</option>
                  <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                  <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                  <option value="B.Sc Data Science">B.Sc Data Science</option>
                  <option value="MCA Computer Applications">MCA Computer Applications</option>
                  <option value="M.Tech Software Engineering">M.Tech Software Engineering</option>
                </select>
                {errors.studentClass && <span className="error-text">{errors.studentClass}</span>}
              </div>
            </div>

            {/* Subject details management */}
            <div className="subject-manager">
              <h3>Dynamic Marks Entry</h3>
              
              <div className="subject-inputs">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Web Technology"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                  />
                  {errors.subjectName && <span className="error-text">{errors.subjectName}</span>}
                </div>

                <div className="form-group">
                  <label>Marks Obtained</label>
                  <input
                    type="number"
                    placeholder="85"
                    min="0"
                    value={newSubMarks}
                    onChange={(e) => setNewSubMarks(e.target.value)}
                  />
                  {errors.marks && <span className="error-text">{errors.marks}</span>}
                </div>

                <div className="form-group">
                  <label>Max Marks</label>
                  <input
                    type="number"
                    placeholder="100"
                    min="1"
                    value={newSubMax}
                    onChange={(e) => setNewSubMax(e.target.value)}
                  />
                  {errors.maxMarks && <span className="error-text">{errors.maxMarks}</span>}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddSubject}
                  style={{height: '42px'}}
                >
                  Add Subject
                </button>
              </div>

              {/* Added Subjects list */}
              <div className="subject-table-container">
                <table className="subject-table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Marks Obtained</th>
                      <th>Max Marks</th>
                      <th>Subject Grade</th>
                      <th className="actions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub, idx) => (
                      <tr key={idx}>
                        <td><strong>{sub.subject_name}</strong></td>
                        <td>{sub.marks_obtained}</td>
                        <td>{sub.max_marks}</td>
                        <td>
                          <span style={{
                            fontWeight:'bold', 
                            color: calculateSubjectGrade(sub.marks_obtained, sub.max_marks) === 'F' ? 'var(--error)' : 'var(--accent-gold)'
                          }}>
                            {calculateSubjectGrade(sub.marks_obtained, sub.max_marks)}
                          </span>
                        </td>
                        <td className="actions">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeleteSubject(idx)}
                            title="Remove Subject"
                            style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-state">No subjects added yet. Input marks above.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {errors.subjects && <div className="error-text" style={{marginTop:'0.5rem'}}>{errors.subjects}</div>}
            </div>

            <div className="generate-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing Database...' : 'Generate Result'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview / Official Layout Container (Right Side) */}
        <div className="preview-container">
          
          {apiMessage && (
            <div className={`alert-card ${messageType}`}>
              <span>{messageType === 'success' ? '✅ ' : '❌ '}{apiMessage}</span>
            </div>
          )}

          {generatedResult ? (
            <>
              {/* Premium Report Card Sheet */}
              <div className="report-card-wrapper">
                <div className="watermark">OFFICIAL TRANSCRIPT</div>
                
                {/* Header */}
                <div className="report-card-header">
                  <div className="institution-logo" style={{fontSize: '2rem'}}>
                    🏫
                  </div>
                  <div className="institution-name">Apex Institute of Technology</div>
                  <div className="institution-sub">Affiliated State University - Verification Division</div>
                  <div className="document-title">Statement of Marks</div>
                </div>

                {/* Student Details Grid */}
                <div className="student-bio-grid">
                  <div className="bio-item">
                    <span className="bio-label">Student Name:</span>
                    <span className="bio-val"><strong>{generatedResult.name}</strong></span>
                  </div>
                  <div className="bio-item">
                    <span className="bio-label">Roll Number:</span>
                    <span className="bio-val"><strong>{generatedResult.roll_no}</strong></span>
                  </div>
                  <div className="bio-item">
                    <span className="bio-label">Email:</span>
                    <span className="bio-val">{generatedResult.email}</span>
                  </div>
                  <div className="bio-item">
                    <span className="bio-label">Class/Dept:</span>
                    <span className="bio-val">{generatedResult.class}</span>
                  </div>
                </div>

                {/* Scorecard Table */}
                <table className="marksheet-table">
                  <thead>
                    <tr>
                      <th>Subject Title</th>
                      <th>Max Marks</th>
                      <th>Marks Obtained</th>
                      <th>Subject Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedResult.subjects.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="subject-col">{sub.subject_name}</td>
                        <td>{sub.max_marks}</td>
                        <td>{sub.marks_obtained}</td>
                        <td style={{
                          fontWeight: 'bold',
                          color: calculateSubjectGrade(sub.marks_obtained, sub.max_marks) === 'F' ? '#b91c1c' : '#b45309'
                        }}>
                          {calculateSubjectGrade(sub.marks_obtained, sub.max_marks)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bottom stats summary */}
                {overallStats && (
                  <div className="marksheet-summary-grid">
                    <div className="stats-card-list">
                      <div className="stat-item">
                        <span className="stat-label">Total Marks</span>
                        <span className="stat-val">{overallStats.totalObtained} / {overallStats.totalMax}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Percentage</span>
                        <span className="stat-val">{overallStats.pct}%</span>
                      </div>
                      <div className="stat-item gold">
                        <span className="stat-label">Aggregate Grade</span>
                        <span className="stat-val">{overallStats.grade}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Issue Date</span>
                        <span className="stat-val" style={{fontSize: '0.95rem', marginTop: '4px'}}>
                          {new Date().toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                    </div>

                    <div className="result-badge-container">
                      <span className="result-title">Final Result</span>
                      <span className={`result-badge ${overallStats.pass ? 'pass' : 'fail'}`}>
                        {overallStats.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Signature and Verification QR representation */}
                <div className="auth-section">
                  <div className="qr-code-placeholder">
                    <div className="qr-box" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', fontSize: '0.6rem', textAlign: 'center', fontWeight: 'bold'}}>
                      [QR CODE]
                    </div>
                    <div className="qr-desc">
                      Scan to verify transcript authenticity online.
                    </div>
                  </div>

                  <div className="signature-block">
                    <div className="signature-pic">A. Shivatare</div>
                    <div className="signature-line">Controller of Exams</div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="report-actions">
                <button className="btn btn-secondary" onClick={handleReset}>
                  🔄 Register New Student
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                  🖨️ Print Report Card
                </button>
              </div>
            </>
          ) : (
            /* Placeholder state before result is generated */
            <div className="card" style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'400px', textAlign:'center'}}>
              <svg style={{width:'80px', height:'80px', fill:'var(--border-color)', marginBottom:'1.5rem'}} viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <h3 style={{fontSize:'1.3rem', color:'var(--text-main)', marginBottom:'0.5rem'}}>Report Card Preview</h3>
              <p style={{color:'var(--text-muted)', maxWidth:'320px', fontSize:'0.95rem'}}>
                Fill out the registry details on the left, add subjects and marks, and click <strong>Generate Result</strong> to view and print the official marksheet.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default App;
