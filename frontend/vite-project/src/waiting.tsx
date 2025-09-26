import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "./assets/Vector.svg";
import reload from "./assets/Ellipse 1022.svg";
import "./waiting.css";
import message from "./assets/Vector-message.svg";

const socket = io(import.meta.env.VITE_BACKEND_URL);

function WaitingPage() {
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [students, setStudents] = useState<string[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("new-question", (question) => {
      console.log("Received question:", question);
      navigate("/question-page", { state: { question } });
    });

    const timer = setTimeout(() => {
      navigate("/question-page");
    }, 10000); 

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
      socket.off("new-question");
      socket.off("student-list");
      socket.off("chat-message");
      clearTimeout(timer);
    };
  }, [navigate]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = { sender: "Student", text: newMessage };
    socket.emit("chat-message", msg);
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
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
    <div className="student-container">
      <div className="intervue-poll3" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <img src={logo} className="intervue-logo2" alt="Intervue Logo" />
        <h1 className="intervue-text2">Intervue Poll</h1>
      </div>
      <img src={reload} className="reload-logo spin" alt="Loading..." />
      <h1 className="waiting-text">Wait for the teacher to ask questions...</h1>
      <button className="chat-btn" onClick={() => setPopupOpen(!popupOpen)}>
        <img src={message} className="message-logo" alt="Loading..." />
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

export default WaitingPage;
