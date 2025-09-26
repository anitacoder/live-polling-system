import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import logo from "./assets/Vector.svg";
import TeacherPage from "./teacher";
import StudentPage from "./student";
import WaitingPage from "./waiting";
import QuestionPage from "./question-page";
import ViewPollPage from "./view-poll";
import ViewHistoryPollPage from "./view-poll-history";
import "./index.css"

function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <div className="intervue-poll">
        <img src={logo} className="intervue-logo" alt="Intervue Logo" />
        <h1 className="intervue-text">Intervue Poll</h1>
      </div>

      <div className="welcome">
        <h1 className="welcome-text">Welcome to the <span className="polling-text">Live Polling System</span></h1>
        <p className="welcome-para">Please select the role that best describes you to begin using the live polling <br />system</p>
      </div>

      <div className="select-role">
        <div className={`role-card student ${selectedRole === "student" ? "active" : ""}`} onClick={() => setSelectedRole("student")}>
          <h1 className="title student-title">I'm a Student</h1>
          <p className="para student-text">Lorem Ipsum is simply dummy text of the <br />printing and typesetting industry.</p>
        </div>
        <div className={`role-card teacher ${selectedRole === "teacher" ? "active" : ""}`} onClick={() => setSelectedRole("teacher")}>
          <h1 className="title student-title2">I'm a Teacher</h1>
          <p className="para"> Submit answers and view live poll <br />result in real-time.</p>
        </div>
      </div>

      <a href="#" className={`continue ${!selectedRole ? "disabled" : ""}`} onClick={(e) => {
          if (!selectedRole) {
            e.preventDefault();
            alert("Please select a role before continuing.");
          } else if (selectedRole === "teacher") {
            e.preventDefault();
            navigate("/teacher",);
          }else if(selectedRole === "student") {
            e.preventDefault();
            navigate("/student")
          }
        }}>Continue</a>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/student" element={<StudentPage/>}></Route>
        <Route path="/waiting" element={<WaitingPage/>}></Route>
        <Route path="/question-page" element={<QuestionPage/>}></Route>
        <Route path="/view-poll" element={<ViewPollPage/>}></Route>
        <Route path="/view-poll-history" element={<ViewHistoryPollPage/>}></Route>
      </Routes>
    </Router>
  );
}
