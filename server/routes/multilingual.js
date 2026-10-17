const express = require('express');
const router = express.Router();
const db = require('../db');

const MULTILINGUAL_EXPLANATIONS = {
  Recursion: {
    english: "Recursion is a programming technique where a function calls itself directly or indirectly to solve smaller instances of the same problem until reaching a terminating base condition.",
    hinglish: "Recursion ek aisi programming technique hai jahan function khud ko bar-bar call karta hai taaki bade problem ko chote subproblems me tod sake, jab tak ki base case na mil jaye.",
    hindi: "पुनरावृत्ति (Recursion) एक प्रोग्रामिंग तकनीक है जहाँ एक फ़ंक्शन समान समस्या के छोटे उदाहरणों को हल करने के लिए स्वयं को कॉल करता है जब तक कि आधार स्थिति (Base Case) प्राप्त न हो जाए।"
  },
  "Base Case": {
    english: "A base case is the stopping condition in a recursive function that directly returns a value without making any further recursive calls, preventing infinite recursion.",
    hinglish: "Base case recursive function ka emergency brake hota hai jo seedhe answer return karta hai bina kisi nayi call ke, jisse stack overflow nahi hota.",
    hindi: "आधार स्थिति (Base Case) पुनरावर्ती फ़ंक्शन में वह रोक स्थिति है जो बिना किसी अन्य कॉल के सीधे मान लौटाती है और अनंत लूप को रोकती है।"
  },
  "Call Stack": {
    english: "The call stack is a Last-In, First-Out (LIFO) runtime data structure that tracks active function calls, pushing a new frame upon invocation and popping it upon return.",
    hinglish: "Call stack computer memory me ek LIFO (Last-In First-Out) tray jaisa structure hai. Jab function call hota hai toh frame upar push hota hai, aur return hone par pop ho jata hai.",
    hindi: "कॉल स्टैक एक LIFO (अंतिम-इन, प्रथम-आउट) मेमोरी संरचना है जो सक्रिय फ़ंक्शन कॉलों को ट्रैक करती है और उनके रिटर्न पते को संग्रहीत करती है।"
  }
};

// GET /api/multilingual/translate?concept=Recursion&lang=hinglish
router.get('/translate', (req, res) => {
  try {
    const concept = req.query.concept || 'Recursion';
    const lang = (req.query.lang || 'english').toLowerCase();

    const entry = MULTILINGUAL_EXPLANATIONS[concept] || MULTILINGUAL_EXPLANATIONS["Recursion"];
    const text = entry[lang] || entry["english"];

    res.json({
      concept,
      language: lang,
      text,
      availableLanguages: ["english", "hinglish", "hindi"]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
