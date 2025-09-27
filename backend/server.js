const express = require("express");
const http = require("http");
const {Server} = require("socket.io")
const cors = require("cors");
const { timeStamp } = require("console");
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173", 
  "https://live-polling-system-black.vercel.app"
];

app.use(cors({
  origin: allowedOrigins, 
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

const fs = require("fs");
const path = require("path");

const studentsFile = path.join(__dirname, "students.json");
const pollsFile = path.join(__dirname, "polls.json");

let CurrentQuestion = null;
let answers = {};
let pollHistory = loadPolls();

function loadStudents() {
    if (fs.existsSync(studentsFile)) {
      return new Set(JSON.parse(fs.readFileSync(studentsFile, "utf-8")));
    }
    return new Set();
  }

  function loadPolls() {
    if (fs.existsSync(pollsFile)) {
      const content = fs.readFileSync(pollsFile, "utf-8").trim();
      if (!content) return []; 
      try {
        return JSON.parse(content);
      } catch (err) {
        console.error("Error parsing polls.json:", err);
        return [];
      }
    }
    return [];
  }
  
   function savePolls() {
        fs.writeFileSync(pollsFile, JSON.stringify(pollHistory, null, 2));
   }
 
  function saveStudents() {
    fs.writeFileSync(studentsFile, JSON.stringify(Array.from(students), null, 2));
  }
  
  let students = loadStudents();

io.on("connection", (socket) => {
    socket.on("student-join", (name) => {
        if(!name) {
            socket.emit("Name is required to join");
            return;
        }
        socket.name = name;
        students.add(name);
        saveStudents();

        io.emit("student-list", Array.from(students));
    });

    socket.on("submit-answer", (answer) => {
        if (!CurrentQuestion) {
          socket.emit("answer-confirmed", { isCorrect: false, message: "No active question." });
          return;
        }
      
        if (answers[socket.name]) {
          socket.emit("answer-confirmed", { isCorrect: false, message: "You already submitted." });
          return;
        }
      
        const index = CurrentQuestion.options.indexOf(answer);
      
        if (index === -1) {
          socket.emit("answer-confirmed", { isCorrect: false, message: "Invalid option." });
          return;
        }
      
        const isCorrect = CurrentQuestion.correctAnswers[index] === true;
      
        answers[socket.name] = { answer, isCorrect,submittedAt: new Date().toISOString() };

        let lastPoll = pollHistory[pollHistory.length - 1];
        if (lastPoll && lastPoll.question === CurrentQuestion.question) {
          lastPoll.answers = answers;
          lastPoll.results = calculateResults().results;
          savePolls();
        }
      
        socket.emit("answer-confirmed", { answer, isCorrect });
        io.emit("poll-results", calculateResults());
      
        if (Object.keys(answers).length === students.size) {
          io.emit("poll-results", calculateResults());
          resetPoll();
        }
      });      
      
    socket.on("get-question", () => {
        if (CurrentQuestion) {
          socket.emit("new-question", CurrentQuestion);
        } else {
          socket.emit("no-question");
        }
      });

      socket.on("disconnect", () => {
        if (socket.name) {
          students.delete(socket.name);
          saveStudents();
          io.emit("student-list", Array.from(students));
          console.log(`${socket.name} disconnected`);
        }
      });
    
    // Creating Teacher's Poll
    socket.on("create-question", ({question, options, correctAnswers, timeLimit}) => {
        if(CurrentQuestion && Object.keys(answers).length < students.size) {
            socket.emit("error", "wait until all students has answer the current question before creating a new one");
            return;
        }
        CurrentQuestion = {
            question,
            options,
            correctAnswers,
            timeLimit: timeLimit || 60,
        };
        answers = {};

        pollHistory.push({
            question,
            options,
            correctAnswers,
            results: options.reduce((acc, opt) => {
                acc[opt] = 0;
                return acc;
            }, {}),            answers: {},
            timeStamp: new Date().toISOString(),
        });
        savePolls();
        
        io.emit("new-question", CurrentQuestion);

        setTimeout(() => {
            if(CurrentQuestion){
                io.emit("poll-results", calculateResults());
                resetPoll();
            } 
        }, (timeLimit || 60) * 1000);
    });
    socket.on("get-results", () => {
        socket.emit("poll-results", calculateResults());
    });
});

app.post("/teacher/create", (req, res) => {
    const {question, options, correctAnswers, timeLimit} = req.body;
    if (CurrentQuestion && Object.keys(answers).length < students.size) {
        return res.status(400).json({ error: "Wait until all students answer before creating a new question." });
      }
      CurrentQuestion = {
        question,
        options,
        correctAnswers,
        timeLimit: timeLimit || 60,
      };
      answers = {};

      pollHistory.push({
        question,
        options,
        correctAnswers,
        results: options.reduce((acc, opt) => {
            acc[opt] = 0;
            return acc;
        }, {}),
        answers: {},
        timeStamp: new Date().toISOString(),
    });
    savePolls();
      io.emit("new-question", CurrentQuestion);

      setTimeout(() => {
        if (CurrentQuestion) {
          io.emit("poll-results", calculateResults());
          resetPoll();
        }
      }, (timeLimit || 60) * 1000);
    
      res.json({ message: "Question created", question: CurrentQuestion });
});

app.get("/teacher/results", (req, res) => {
    res.json(calculateResults());
});

app.get("/teacher/students", (req, res) => {
    res.json(Array.from(students));
  });  

app.post("/teacher/remove", (req, res) => {
    const { name } = req.body;
    if (students.has(name)) {
      students.delete(name);
      saveStudents();
      io.emit("student-list", Array.from(students));
      res.json({ message: `${name} removed.` });
    } else {
      res.status(404).json({ error: "Student not found." });
    }
  });

app.get("/teacher/history", (req, res) => {
    res.json(pollHistory);
  });

//calculating results
function calculateResults() {
    if(!CurrentQuestion) {
        return {question: null, results: {}};
    }

    const results = {};
    CurrentQuestion.options.forEach((opt) => {
        results[opt] = 0;
    });
    Object.values(answers).forEach(({answer}) => {
        if(results[answer] !== undefined){
            results[answer] += 1;
        }
    });

    return {
        question: CurrentQuestion.question,
        options: CurrentQuestion.options,
        results,
        totalStudents: students.size,
        correctAnswers: CurrentQuestion.correctAnswers,
        answered: Object.keys(answers).length,
    };
}

function resetPoll() {
    if (CurrentQuestion) {
        let lastPoll = pollHistory[pollHistory.length - 1];
        if (lastPoll && lastPoll.question === CurrentQuestion.question) {
          lastPoll.results = calculateResults().results;
          lastPoll.answers = answers;
          lastPoll.timeStamp = new Date().toISOString();
          savePolls();
        }
      }
      CurrentQuestion = null;
      answers = {};
}
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});