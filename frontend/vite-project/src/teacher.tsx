import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import logo from "./assets/Vector.svg";
import { useNavigate } from "react-router-dom";
import "./teacher.css";

const socket = io(import.meta.env.VITE_API_URL || "https://live-polling-system-64hq.onrender.com");

function TeacherPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([false, false]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [students, setStudents] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:5001/teacher/students")
    .then((res) => res.json())
    .then((data) => setStudents(data))
    .catch((err) => console.error("Failed to load students:", err));

    socket.on("student-list", (studentNames: string[]) => {
        setStudents(studentNames);
    });
    return () => {
        socket.off("student-list")
    };
}, []);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCorrectChange = (index: number, value: boolean) => {
    const updated = [...correctAnswers];
    updated[index] = value;
    setCorrectAnswers(updated);
  };

  const addOption = () => {
    setOptions([...options, ""]);
    setCorrectAnswers([...correctAnswers, false]);
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      alert("Please fill in question and all options.");
      return;
    }

    socket.emit("create-question", {
      question,
      options,
      correctAnswers,
      timeLimit,
    });

    setQuestion("");
    setOptions(["", ""]);
    setCorrectAnswers([false, false]);

  };
  const navigate = useNavigate();

  return (
    <>
      <div className="intervue-poll2" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
        <img src={logo} className="intervue-logo2" alt="Intervue Logo" />
        <h1 className="intervue-text2">Intervue Poll</h1>
      </div>

      <div className="header">
        <h1 className="heading">Let's <span className="bold">Get Started</span></h1>
        <p className="subtext">You'll have the ability to create and manage polls, ask questions, and monitor<br />your students' responses in real-time.</p>
      </div>

      <div className="section-2">
        <h1 className="question-text">Enter your question</h1>
        <select className="time-select" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
            <option value={60}>60 seconds</option>
        </select>
    </div>
      <textarea className="question-input" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={100}/>
      <div className="section-3">
        <h1 className="edit-text">Edit Options</h1>
        <h1 className="correct-text">Is it Correct?</h1>
      </div>
    
      {options.map((opt, index) => (
        <div className="option-row" key={index}>
          <h1 className="option-number">{index + 1}</h1>
          <textarea className="option-input" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)}maxLength={100}/>          
            <div className="radio-group">
            <label>
              <input type="radio"checked={correctAnswers[index] === true} onChange={() => handleCorrectChange(index, true)}/>Yes</label>
            <label>
              <input type="radio" checked={correctAnswers[index] === false} onChange={() => handleCorrectChange(index, false)}/>No</label>
          </div>
        </div>
      ))}

      <button className="add-option-btn" onClick={addOption}> + Add More option</button>
      <div className="bottom"></div>
      <div className="submit-container">
        <button className="submit-btn" onClick={handleSubmit}> Ask Question </button>
      </div>
    </>
  );
}

export default TeacherPage;