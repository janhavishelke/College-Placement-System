const express = require('express');
const router = express.Router();
const db = require('../db');

const PYQ_DATA = [
  {
    id: 1,
    question: "Define recursion and explain the necessity of a base case with an example.",
    concept: "Recursion & Base Case",
    years: [2024, 2023, 2021, 2019, 2017],
    frequency: 5,
    marks: "10 Marks",
    docId: 1,
    pageNo: 2,
    answer: "Recursion is a technique where a function calls itself to solve smaller subproblems of the same problem. A base case is essential as the terminal condition that directly returns a value without further recursive calls, preventing infinite loops and stack overflow."
  },
  {
    id: 2,
    question: "Explain the architecture of the Call Stack and what causes a Stack Overflow error.",
    concept: "Call Stack & Stack Overflow",
    years: [2024, 2022, 2020, 2018],
    frequency: 4,
    marks: "10 Marks",
    docId: 1,
    pageNo: 4,
    answer: "The call stack is a LIFO (Last-In, First-Out) data structure that tracks active function calls. Each call allocates a stack frame containing arguments, local variables, and return address. When recursive calls exceed the bounded stack depth without hitting a base case, a stack overflow error is thrown."
  },
  {
    id: 3,
    question: "Trace the step-by-step execution and stack unwinding of recursive factorial(3).",
    concept: "Recursion Execution Trace",
    years: [2023, 2022, 2021, 2019],
    frequency: 4,
    marks: "8 Marks",
    docId: 1,
    pageNo: 7,
    answer: "Step 1: factorial(3) pushes frame and calls factorial(2). Step 2: factorial(2) pushes frame and calls factorial(1). Step 3: factorial(1) hits base case returning 1. Unwinding: factorial(2) computes 2*1=2; factorial(3) computes 3*2=6 and returns 6."
  },
  {
    id: 4,
    question: "Differentiate between iteration and recursion in terms of memory overhead and time complexity.",
    concept: "Iteration vs Recursion",
    years: [2023, 2020, 2018],
    frequency: 3,
    marks: "6 Marks",
    docId: 1,
    pageNo: 9,
    answer: "Iteration maintains state in loop variables utilizing O(1) auxiliary stack space. Recursion allocates a new stack frame per invocation resulting in O(n) call stack space complexity, but provides cleaner mathematical formulations for inductive structures."
  },
  {
    id: 5,
    question: "What is an activation record or stack frame? What parameters are stored in it?",
    concept: "Stack Frames",
    years: [2022, 2019, 2017],
    frequency: 3,
    marks: "5 Marks",
    docId: 1,
    pageNo: 5,
    answer: "An activation record (stack frame) is allocated on the call stack per function invocation, storing incoming parameters, local variables, return address back to caller, and frame pointers."
  }
];

// GET /api/pyq
router.get('/', (req, res) => {
  try {
    res.json({
      totalQuestions: PYQ_DATA.length,
      examSubject: "CS201 Data Structures & Algorithms",
      questions: PYQ_DATA
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
