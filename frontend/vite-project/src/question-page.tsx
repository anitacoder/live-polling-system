import { useEffect, useState, useRef } from "react";
import message from "./assets/Vector-message.svg";
import "./question.css";
import timer from "./assets/Vector-timer.svg";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";


const socket = io("http://localhost:5001");

function QuestionPage() {
  const [questionData, setQuestionData] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:5001/teacher/history");
        const history = await res.json();

        if (history.length > 0) {
          setQuestionData(history[history.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  useEffect(() => {
    socket.on("answer-confirmed", (data) => {
      setSubmitted(true);
      setIsCorrect(data.isCorrect);
    });

    socket.on("student-list", (studentNames: string[]) => {
      setStudents(studentNames);
    });

    socket.on("chat-message", (msg: { sender: string; text: string }) => {
      setMessages((prev) => [...prev, msg]);
    });

    fetch("http://localhost:5001/teacher/students")
      .then((res) => res.json())
      .then((data) => setStudents(data));

    return () => {
      socket.off("answer-confirmed");
      socket.off("student-list");
      socket.off("chat-message");
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const navigate = useNavigate();

  const handleSubmit = () => {
    if (selected === null) {
      alert("Please select an option!");
      return;
    }
    setSubmitted(true);
    const chosenAnswer = questionData.options[selected];
    socket.emit("submit-answer", chosenAnswer);
    navigate("/view-poll");
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    }
    if (popupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupOpen]);

  if (!questionData) {
    return (
      <div className="question-container">
        <h2>Loading question...</h2>
      </div>
    );
  }

  const handleKickOut = async (name: string) => {
    try {
      const res = await fetch("http://localhost:5001/teacher/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
  
      if (res.ok) {
        setStudents((prev) => prev.filter((student) => student !== name));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove student");
      }
    } catch (err) {
      console.error("Error kicking out student:", err);
    }
  };



  return (
    <div className="question-container">
      <div className="question-header">
        <h2 className="question-number">Question 1</h2>
        <div className="timer">
          <img src={timer} />
          <span className="time-left">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="question-box">
        <div className="question-heading">
          <h3 className="question-text">{questionData.question}</h3>
        </div>
        <div className="options-list">
          {questionData.options.map((opt: string, index: number) => (
            <div className={`option ${selected === index ? "selected" : ""}`} key={index} onClick={() => setSelected(index)}>
              <span className="option-number">{index + 1}</span>
              <span className="option-text">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>Submit</button>

      <button className="chat-btn" onClick={() => setPopupOpen(!popupOpen)}>
        <img src={message} className="message-logo" alt="Chat" />
      </button>

      {popupOpen && (
        <div className="chat-popup" ref={popupRef}>
          <div className="tabs">
            <button className={`tab ${activeTab === "chat" ? "active" : ""}`}onClick={() => setActiveTab("chat")}>Chat</button>
            <button className={`tab ${activeTab === "participants" ? "active" : ""}`}onClick={() => setActiveTab("participants")}>Participants</button>
          </div>

          {activeTab === "chat" && (
        <div className="chat-tab">
            <div className="chat-messages">
            <div className="chat-message other-message">
                <span className="sender">User 1</span>
                <div className="message-bubble">Hey There, how can I help?</div>
            </div>

            <div className="chat-message my-message">
                <span className="sender">User 2</span>
                <div className="message-bubble">Nothing bro..just chill!!</div>
            </div>
            </div>
        </div>
        )}

        {activeTab === "participants" && (
        <div className="participants-list">
            <div className="participants-header">
            <span className="col-name">Name</span>
            <span className="col-action">Action</span>
            </div>
            {students.map((s, i) => (
            <div className="participant-row" key={i}>
                <span className="participant-name">{s}</span>
                <span className="kick-link" onClick={() => handleKickOut(s)}>Kick out</span>
            </div>
            ))}
        </div>
        )}
        </div>
      )}
    </div>
  );
}

export default QuestionPage;
