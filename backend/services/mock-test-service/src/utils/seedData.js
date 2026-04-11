/**
 * Seed script for creating sample test templates and questions
 * Creates 3 sample tests with different difficulties
 * Each test has 120 questions across 4 sections
 * 
 * Usage: node src/utils/seedData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import { logger } from './logger.js';

dotenv.config();

const MONGODB_URI = process.env.MOCKTEST_MONGODB_URI || 'mongodb://localhost:27017/hamza_mocktest';

// Sample test templates
const testTemplates = [
  {
    title: 'FAST Entry Test Practice #1',
    description: 'Complete practice test covering all sections with easy to medium difficulty questions. Perfect for beginners starting their preparation.',
    difficulty: 'easy',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  },
  {
    title: 'FAST Entry Test Practice #2',
    description: 'Intermediate level practice test with balanced difficulty. Ideal for students who have completed basic preparation.',
    difficulty: 'medium',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  },
  {
    title: 'FAST Entry Test Practice #3',
    description: 'Advanced practice test with challenging questions. Recommended for final preparation before the actual exam.',
    difficulty: 'hard',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  }
];

// Sample questions generator
function generateQuestions(testId, difficulty) {
  const questions = [];
  
  // Advance Math (50 questions)
  const mathQuestions = getMathQuestions(difficulty);
  for (let i = 0; i < 50; i++) {
    const q = mathQuestions[i % mathQuestions.length];
    questions.push({
      testId,
      section: 'Advance Math',
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty,
      order: i + 1
    });
  }
  
  // Basic Math (20 questions)
  const basicMathQuestions = getBasicMathQuestions(difficulty);
  for (let i = 0; i < 20; i++) {
    const q = basicMathQuestions[i % basicMathQuestions.length];
    questions.push({
      testId,
      section: 'Basic Math',
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty,
      order: i + 1
    });
  }
  
  // IQ & Logical (20 questions)
  const iqQuestions = getIQQuestions(difficulty);
  for (let i = 0; i < 20; i++) {
    const q = iqQuestions[i % iqQuestions.length];
    questions.push({
      testId,
      section: 'IQ & Logical',
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty,
      order: i + 1
    });
  }
  
  // English (30 questions)
  const englishQuestions = getEnglishQuestions(difficulty);
  for (let i = 0; i < 30; i++) {
    const q = englishQuestions[i % englishQuestions.length];
    questions.push({
      testId,
      section: 'English',
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty,
      order: i + 1
    });
  }
  
  return questions;
}

function getMathQuestions(difficulty) {
  const easy = [
    { question: 'What is the derivative of x²?', options: { A: '2x', B: 'x', C: '2', D: 'x²' }, correctAnswer: 'A', topic: 'Calculus' },
    { question: 'Solve for x: 2x + 5 = 15', options: { A: '5', B: '10', C: '7.5', D: '20' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'What is sin(90°)?', options: { A: '1', B: '0', C: '-1', D: '0.5' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'What is the area of a rectangle with length 5 and width 3?', options: { A: '15', B: '8', C: '16', D: '12' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'If f(x) = 2x + 1, what is f(3)?', options: { A: '7', B: '6', C: '5', D: '8' }, correctAnswer: 'A', topic: 'Functions' },
    { question: 'What is 5² + 3²?', options: { A: '34', B: '64', C: '25', D: '16' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'Simplify: 3x + 2x', options: { A: '5x', B: '6x', C: '5x²', D: '6' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'What is cos(0°)?', options: { A: '1', B: '0', C: '-1', D: 'undefined' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'Find the perimeter of a square with side 4', options: { A: '16', B: '8', C: '12', D: '20' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'What is √16?', options: { A: '4', B: '8', C: '2', D: '16' }, correctAnswer: 'A', topic: 'Algebra' }
  ];
  
  const medium = [
    { question: 'Find the integral of 3x² dx', options: { A: 'x³ + C', B: '6x + C', C: '3x³ + C', D: 'x² + C' }, correctAnswer: 'A', topic: 'Calculus' },
    { question: 'Solve: x² - 5x + 6 = 0', options: { A: 'x = 2, 3', B: 'x = 1, 6', C: 'x = -2, -3', D: 'x = 5, 1' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'Simplify: sin²θ + cos²θ', options: { A: '1', B: '0', C: '2', D: 'sin(2θ)' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'Volume of cylinder: radius 3, height 5 (use π ≈ 3.14)', options: { A: '141.3', B: '47.1', C: '94.2', D: '282.6' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'Find inverse of f(x) = 2x - 4', options: { A: '(x + 4)/2', B: '(x - 4)/2', C: '2x + 4', D: 'x/2 + 2' }, correctAnswer: 'A', topic: 'Functions' },
    { question: 'Expand: (x + 3)²', options: { A: 'x² + 6x + 9', B: 'x² + 9', C: 'x² + 3x + 9', D: 'x² + 6x + 3' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'What is tan(45°)?', options: { A: '1', B: '0', C: '√3', D: '1/√2' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'Area of circle with radius 7 (use π ≈ 22/7)', options: { A: '154', B: '44', C: '308', D: '22' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'Solve: 2ˣ = 16', options: { A: '4', B: '8', C: '2', D: '16' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'Derivative of sin(x)', options: { A: 'cos(x)', B: '-cos(x)', C: 'sin(x)', D: '-sin(x)' }, correctAnswer: 'A', topic: 'Calculus' }
  ];
  
  const hard = [
    { question: 'Evaluate: lim(x→0) (sin x)/x', options: { A: '1', B: '0', C: '∞', D: 'undefined' }, correctAnswer: 'A', topic: 'Calculus' },
    { question: 'Solve system: 2x + 3y = 12, 4x - y = 5', options: { A: 'x = 3, y = 2', B: 'x = 2, y = 3', C: 'x = 1, y = 4', D: 'x = 4, y = 1' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'Simplify: (sin x)/(cos x)', options: { A: 'tan x', B: 'cot x', C: 'sec x', D: 'csc x' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'Surface area of sphere with radius r', options: { A: '4πr²', B: '(4/3)πr³', C: '2πr²', D: 'πr²' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'Is f(x) = x³ one-to-one?', options: { A: 'Yes', B: 'No', C: 'Only for x > 0', D: 'Only for x < 0' }, correctAnswer: 'A', topic: 'Functions' },
    { question: 'Find dy/dx if y = eˣ', options: { A: 'eˣ', B: 'xeˣ⁻¹', C: 'ln(x)', D: '1/x' }, correctAnswer: 'A', topic: 'Calculus' },
    { question: 'Solve: log₂(x) = 5', options: { A: '32', B: '10', C: '25', D: '16' }, correctAnswer: 'A', topic: 'Algebra' },
    { question: 'Value of sin(30°)', options: { A: '1/2', B: '√3/2', C: '1', D: '0' }, correctAnswer: 'A', topic: 'Trigonometry' },
    { question: 'Pythagorean theorem: a² + b² = ?', options: { A: 'c²', B: '2c', C: 'c', D: 'ab' }, correctAnswer: 'A', topic: 'Geometry' },
    { question: 'Integral of 1/x dx', options: { A: 'ln|x| + C', B: 'x² + C', C: '1/x² + C', D: 'eˣ + C' }, correctAnswer: 'A', topic: 'Calculus' }
  ];
  
  return difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
}

function getBasicMathQuestions(difficulty) {
  const easy = [
    { question: 'Calculate: 25 + 37', options: { A: '62', B: '52', C: '72', D: '42' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: 'What is 20% of 100?', options: { A: '20', B: '25', C: '15', D: '30' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'Simplify the ratio 6:9', options: { A: '2:3', B: '3:2', C: '1:2', D: '3:4' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'Solve: x + 7 = 12', options: { A: '5', B: '19', C: '4', D: '6' }, correctAnswer: 'A', topic: 'Basic Algebra' },
    { question: 'What is 8 × 7?', options: { A: '56', B: '54', C: '48', D: '64' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: '50% of 80 is?', options: { A: '40', B: '30', C: '50', D: '60' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'If 3:x = 9:12, find x', options: { A: '4', B: '3', C: '6', D: '5' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'Calculate: 100 - 37', options: { A: '63', B: '73', C: '53', D: '67' }, correctAnswer: 'A', topic: 'Arithmetic' }
  ];
  
  const medium = [
    { question: 'Calculate: 456 ÷ 12', options: { A: '38', B: '36', C: '40', D: '42' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: 'A $80 shirt is 25% off. Sale price?', options: { A: '$60', B: '$55', C: '$65', D: '$70' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'Ratio 3:5, 15 boys, how many girls?', options: { A: '25', B: '20', C: '30', D: '18' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'Solve: 3(x - 2) = 15', options: { A: '7', B: '5', C: '9', D: '6' }, correctAnswer: 'A', topic: 'Basic Algebra' },
    { question: 'What is 15% of 200?', options: { A: '30', B: '25', C: '35', D: '40' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'Average of 10, 20, 30', options: { A: '20', B: '15', C: '25', D: '30' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: 'Simplify: 12:18:24', options: { A: '2:3:4', B: '3:4:5', C: '1:2:3', D: '4:6:8' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'Calculate: 23 × 15', options: { A: '345', B: '335', C: '355', D: '325' }, correctAnswer: 'A', topic: 'Arithmetic' }
  ];
  
  const hard = [
    { question: 'Calculate: (45 × 23) - (18 × 15)', options: { A: '765', B: '775', C: '755', D: '785' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: 'Price +20% then -20%. Net change?', options: { A: '-4%', B: '0%', C: '+4%', D: '-2%' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'Ratio 2:3:5, sum 100, largest?', options: { A: '50', B: '40', C: '30', D: '60' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'Solve: (x + 2)/3 = (x - 1)/2', options: { A: '8', B: '6', C: '10', D: '7' }, correctAnswer: 'A', topic: 'Basic Algebra' },
    { question: 'Compound interest: P=1000, r=10%, t=2 years', options: { A: '1210', B: '1200', C: '1100', D: '1220' }, correctAnswer: 'A', topic: 'Percentages' },
    { question: 'LCM of 12 and 18', options: { A: '36', B: '24', C: '48', D: '72' }, correctAnswer: 'A', topic: 'Arithmetic' },
    { question: 'If a:b = 2:3 and b:c = 4:5, find a:c', options: { A: '8:15', B: '2:5', C: '6:15', D: '4:15' }, correctAnswer: 'A', topic: 'Ratios' },
    { question: 'HCF of 24 and 36', options: { A: '12', B: '6', C: '18', D: '24' }, correctAnswer: 'A', topic: 'Arithmetic' }
  ];
  
  return difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
}

function getIQQuestions(difficulty) {
  const easy = [
    { question: 'Complete: 2, 4, 6, 8, ?', options: { A: '10', B: '12', C: '9', D: '14' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'Odd one out: 2, 4, 6, 9, 10', options: { A: '9', B: '2', C: '10', D: '6' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'Train travels 60 km in 1 hour. Distance in 3 hours?', options: { A: '180 km', B: '120 km', C: '240 km', D: '150 km' }, correctAnswer: 'A', topic: 'Problem Solving' },
    { question: 'If A > B and B > C, then?', options: { A: 'A > C', B: 'A < C', C: 'A = C', D: 'Cannot determine' }, correctAnswer: 'A', topic: 'Logical Reasoning' },
    { question: 'Next in series: 5, 10, 15, 20, ?', options: { A: '25', B: '30', C: '22', D: '24' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'Which is different: Apple, Banana, Carrot, Mango', options: { A: 'Carrot', B: 'Apple', C: 'Banana', D: 'Mango' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'If today is Monday, what day is it after 10 days?', options: { A: 'Thursday', B: 'Wednesday', C: 'Friday', D: 'Tuesday' }, correctAnswer: 'A', topic: 'Problem Solving' },
    { question: 'Complete: A, C, E, G, ?', options: { A: 'I', B: 'H', C: 'J', D: 'K' }, correctAnswer: 'A', topic: 'Pattern Recognition' }
  ];
  
  const medium = [
    { question: 'Complete: 1, 4, 9, 16, ?', options: { A: '25', B: '20', C: '24', D: '30' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'Find missing: 3, 6, 12, 24, ?', options: { A: '48', B: '36', C: '42', D: '50' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: '5 workers, 10 days. 10 workers need?', options: { A: '5 days', B: '20 days', C: '15 days', D: '8 days' }, correctAnswer: 'A', topic: 'Problem Solving' },
    { question: '100 people: 70 like tea, 60 coffee. Both?', options: { A: 'At least 30', B: 'Exactly 30', C: '40', D: '20' }, correctAnswer: 'A', topic: 'Logical Reasoning' },
    { question: 'Series: 2, 5, 10, 17, ?', options: { A: '26', B: '24', C: '28', D: '25' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'If CAT = 24, DOG = ?', options: { A: '26', B: '24', C: '28', D: '30' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'A is B\'s sister. B is C\'s father. What is A to C?', options: { A: 'Aunt', B: 'Mother', C: 'Sister', D: 'Grandmother' }, correctAnswer: 'A', topic: 'Logical Reasoning' },
    { question: 'Mirror image of FAST', options: { A: 'TƧAℲ', B: 'TSAF', C: 'FATS', D: 'SAFT' }, correctAnswer: 'A', topic: 'Analytical Thinking' }
  ];
  
  const hard = [
    { question: 'Complete: 2, 6, 12, 20, 30, ?', options: { A: '42', B: '40', C: '38', D: '44' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'Fibonacci: 1, 1, 2, 3, 5, 8, ?', options: { A: '13', B: '11', C: '12', D: '15' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'Clock at 3:15. Angle between hands?', options: { A: '7.5°', B: '15°', C: '0°', D: '22.5°' }, correctAnswer: 'A', topic: 'Problem Solving' },
    { question: 'All A are B. Some B are C. Conclusion?', options: { A: 'Some A may be C', B: 'All A are C', C: 'No A are C', D: 'All C are A' }, correctAnswer: 'A', topic: 'Logical Reasoning' },
    { question: 'Series: 1, 8, 27, 64, ?', options: { A: '125', B: '100', C: '120', D: '128' }, correctAnswer: 'A', topic: 'Pattern Recognition' },
    { question: 'If MANGO = 54, APPLE = ?', options: { A: '50', B: '45', C: '55', D: '60' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'Water image of 12:45', options: { A: '12:45', B: '11:15', C: '9:15', D: '3:45' }, correctAnswer: 'A', topic: 'Analytical Thinking' },
    { question: 'Missing number: 2, 6, 12, 20, 30, 42, ?', options: { A: '56', B: '54', C: '58', D: '52' }, correctAnswer: 'A', topic: 'Pattern Recognition' }
  ];
  
  return difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
}

function getEnglishQuestions(difficulty) {
  const easy = [
    { question: 'He _____ to school every day.', options: { A: 'goes', B: 'go', C: 'going', D: 'gone' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Synonym of "happy"', options: { A: 'joyful', B: 'sad', C: 'angry', D: 'tired' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'I am _____ student.', options: { A: 'a', B: 'an', C: 'the', D: 'no article' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Antonym of "hot"', options: { A: 'cold', B: 'warm', C: 'cool', D: 'heat' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'She _____ a book yesterday.', options: { A: 'read', B: 'reads', C: 'reading', D: 'will read' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Meaning of "beautiful"', options: { A: 'attractive', B: 'ugly', C: 'plain', D: 'simple' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'They _____ playing cricket.', options: { A: 'are', B: 'is', C: 'am', D: 'be' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Opposite of "big"', options: { A: 'small', B: 'large', C: 'huge', D: 'giant' }, correctAnswer: 'A', topic: 'Vocabulary' }
  ];
  
  const medium = [
    { question: 'Identify error: "She don\'t like pizza."', options: { A: 'don\'t → doesn\'t', B: 'She → Her', C: 'like → likes', D: 'No error' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Synonym for "difficult"', options: { A: 'hard', B: 'easy', C: 'simple', D: 'clear' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'Despite the rain, they _____ hiking.', options: { A: 'went', B: 'go', C: 'goes', D: 'going' }, correctAnswer: 'A', topic: 'Sentence Completion' },
    { question: 'Choose correct: "Between you and _____"', options: { A: 'me', B: 'I', C: 'myself', D: 'mine' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Meaning of "abundant"', options: { A: 'plentiful', B: 'scarce', C: 'rare', D: 'few' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'He has been working _____ morning.', options: { A: 'since', B: 'for', C: 'from', D: 'at' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Antonym of "ancient"', options: { A: 'modern', B: 'old', C: 'historic', D: 'past' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'Neither of them _____ present.', options: { A: 'was', B: 'were', C: 'are', D: 'is' }, correctAnswer: 'A', topic: 'Grammar' }
  ];
  
  const hard = [
    { question: 'Neither of the students _____ completed.', options: { A: 'has', B: 'have', C: 'had', D: 'having' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Meaning of "ubiquitous"', options: { A: 'everywhere', B: 'rare', C: 'unique', D: 'special' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'The decision was _____ by all.', options: { A: 'ratified', B: 'rated', C: 'rational', D: 'ration' }, correctAnswer: 'A', topic: 'Sentence Completion' },
    { question: 'Choose correct: "The data _____ accurate."', options: { A: 'are', B: 'is', C: 'was', D: 'were' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Synonym of "ephemeral"', options: { A: 'temporary', B: 'permanent', C: 'eternal', D: 'lasting' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'Had I known, I _____ helped.', options: { A: 'would have', B: 'will have', C: 'would', D: 'will' }, correctAnswer: 'A', topic: 'Grammar' },
    { question: 'Meaning of "pragmatic"', options: { A: 'practical', B: 'theoretical', C: 'idealistic', D: 'abstract' }, correctAnswer: 'A', topic: 'Vocabulary' },
    { question: 'Scarcely _____ he arrived when it rained.', options: { A: 'had', B: 'has', C: 'have', D: 'was' }, correctAnswer: 'A', topic: 'Grammar' }
  ];
  
  return difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
}

async function seedDatabase() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Clear existing data
    logger.info('Clearing existing test data...');
    await MockTest.deleteMany({});
    await Question.deleteMany({});
    logger.info('Existing data cleared');
    
    // Create test templates and questions
    for (const template of testTemplates) {
      logger.info(`Creating test: ${template.title}`);
      
      // Create test template
      const test = await MockTest.create(template);
      logger.info(`Test created with ID: ${test._id}`);
      
      // Generate and create questions
      logger.info(`Generating ${template.totalQuestions} questions...`);
      const questions = generateQuestions(test._id, template.difficulty);
      await Question.insertMany(questions);
      logger.info(`${questions.length} questions created`);
    }
    
    logger.info('✅ Database seeding completed successfully!');
    logger.info(`Created ${testTemplates.length} test templates`);
    logger.info(`Created ${testTemplates.length * 120} questions`);
    
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run seeding if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
