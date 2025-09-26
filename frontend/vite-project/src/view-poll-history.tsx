import { useState, useEffect, useRef } from "react";
import "./view-poll-history.css";
import eyeIcon from "./assets/Vector-eye.png";
import message from "./assets/Vector-message.svg"; 
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

type Option = "Mars" | "Venus" | "Jupiter" | "Saturn";

const socket = io("http://localhost:5001");

function ViewHistoryPollPage() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [students, setStudents] = useState<string[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const questionData = {
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Saturn"] as Option[], 
  };

  const pollResults: {
    answered: number;
    totalStudents: number;
    results: Record<Option, number>;
  } = {
    answered: 20,
    totalStudents: 20,
    results: {
      Mars: 15,
      Venus: 1,
      Jupiter: 1,
      Saturn: 3,
    },
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
      document.removeEventListener("mousedown", handleClickOutside);
      socket.off("answer-confirmed");
      socket.off("student-list");
      socket.off("chat-message");
    };
  }, [popupOpen]);

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
    <>
      <h1 className="view-text">View <span className="view-text2">Poll History</span></h1>
      <div className="question-container">
        <h1>Question 1</h1>

        <div className="question-box">
          <div className="question2-box">
            <h2 className="question-text2">
              Which planet is known as the Red Planet?"
            </h2>
          </div>
          <div className="results-list">
            {questionData.options.map((opt, index) => {
              const votes = pollResults.results[opt] || 0;
              const percentage =
                pollResults.answered > 0
                  ? Math.round((votes / pollResults.answered) * 100)
                  : 0;

              return (
                <div key={index} className="option-bar">
                  <div
                    className="fill-section"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="option-number">{index + 1}</span>
                    <span className="option-text">{opt}</span>
                  </div>
                  <span className="percentage">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <div className="question-container">
        <h1>Question 2</h1>

        <div className="question-box">
          <div className="question2-box">
            <h2 className="question-text2">
              Which planet is known as the Red Planet?"
            </h2>
          </div>
          <div className="results-list">
            {questionData.options.map((opt, index) => {
              const votes = pollResults.results[opt] || 0;
              const percentage =
                pollResults.answered > 0
                  ? Math.round((votes / pollResults.answered) * 100)
                  : 0;

              return (
                <div key={index} className="option-bar">
                  <div
                    className="fill-section"
                    style={{ width: `${percentage}%` }}>
                    <span className="option-number">{index + 1}</span>
                    <span className="option-text">{opt}</span>
                  </div>
                  <span className="percentage">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>

      <button className="chat-btn" onClick={() => setPopupOpen(!popupOpen)}>
        <img src={message} className="message-logo" alt="Chat" />
      </button>

      {popupOpen && (
        <div className="chat-popup" ref={popupRef}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}>
              Chat
            </button>
            <button
              className={`tab ${activeTab === "participants" ? "active" : ""}`}
              onClick={() => setActiveTab("participants")}>
              Participants
            </button>
          </div>

          {activeTab === "chat" && (
            <div className="chat-tab">
              <div className="chat-messages">
                <div className="chat-message other-message">
                  <span className="sender">User 1</span>
                  <div className="message-bubble">
                    Hey There, how can I help?
                  </div>
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
                  <span
                    className="kick-link"
                    onClick={() => handleKickOut(s)}>
                    Kick out
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ViewHistoryPollPage;
