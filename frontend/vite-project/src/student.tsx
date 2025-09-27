import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "./assets/Vector.svg";
import "./student.css"

const socket = io("https://live-polling-system-89wk.onrender.com");

function StudentPage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    socket.emit("student-join", name);
    localStorage.setItem("studentName", name);

    navigate("/waiting");
  };

  return (
    <div className="student-container">
        <div className="intervue-poll3" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
        <img src={logo} className="intervue-logo2" alt="Intervue Logo" />
        <h1 className="intervue-text2">Intervue Poll</h1>
      </div>
      <h1 className="heading2">Let's <span className="bold2">Get Started</span></h1>
      <p className="subtext2"> If you're a student, you'll be able to <span className="submit-answer">submit your answers</span>, participate in live <br/>polls, and see how your responses compare with yourclassmates.</p>
      <label className="enter-your-name">Enter your Name</label>
      <input type="text"className="name-input" value={name} onChange={(e) => setName(e.target.value)}/>
      <button className="continue-btn" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
}

export default StudentPage;
