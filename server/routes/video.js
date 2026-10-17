const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/video/lesson
router.get('/lesson', (req, res) => {
  try {
    const videoLesson = {
      id: "vid-rec-01",
      title: "Mastering Recursion & The Call Stack",
      durationSeconds: 120,
      totalSlides: 4,
      downloadUrl: "/api/video/download",
      slides: [
        {
          slideNumber: 1,
          title: "What is Recursion?",
          bulletPoints: [
            "A function that calls itself on smaller subproblems",
            "Must make continuous progress toward a base condition",
            "Page 2 source reference"
          ],
          audioScript: "Welcome to your AI video breakdown. Recursion is a programming technique where a function calls itself to solve smaller subproblems of the same problem.",
          diagramType: "tree",
          duration: 30
        },
        {
          slideNumber: 2,
          title: "The Base Case Emergency Brake",
          bulletPoints: [
            "Terminates recursive chain reaction",
            "Returns a direct concrete value",
            "Placed before recursive calls to avoid stack overflow"
          ],
          audioScript: "The base case acts as the emergency brake. It terminates the chain reaction and returns a direct answer without pushing any more frames.",
          diagramType: "brake",
          duration: 30
        },
        {
          slideNumber: 3,
          title: "Call Stack LIFO Execution",
          bulletPoints: [
            "Each invocation pushes a private stack frame",
            "Holds arguments, local variables, return pointers",
            "Unwinds backwards from base case"
          ],
          audioScript: "The call stack operates on Last-In First-Out order. Each active call pushes an activation record that pauses until deeper frames complete.",
          diagramType: "stack",
          duration: 30
        },
        {
          slideNumber: 4,
          title: "Interactive Checkpoint",
          bulletPoints: [
            "Trace factorial(3) = 6",
            "3 * factorial(2) -> 2 * factorial(1) -> 1",
            "Stack unrolls multiplying backwards"
          ],
          audioScript: "Now let us verify: what returns when factorial of 1 is reached? It returns 1, allowing the caller frames to compute the final result 6.",
          diagramType: "checkpoint",
          isInteractive: true,
          duration: 30
        }
      ]
    };

    res.json(videoLesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
