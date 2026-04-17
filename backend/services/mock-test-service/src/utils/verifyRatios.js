/**
 * Verify we have enough questions for each difficulty ratio
 * Run with: node src/utils/verifyRatios.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Question from '../models/Question.js';

const DIFFICULTY_RATIOS = {
  easy: {
    'Advance Math': { easy: 30, medium: 15, hard: 5 },
    'Basic Math': { easy: 12, medium: 6, hard: 2 },
    'IQ & Logical': { easy: 12, medium: 6, hard: 2 },
    'English': { easy: 16, medium: 13, hard: 1 }  // Only 1 hard available
  },
  medium: {
    'Advance Math': { easy: 12, medium: 25, hard: 13 },
    'Basic Math': { easy: 5, medium: 10, hard: 5 },
    'IQ & Logical': { easy: 5, medium: 10, hard: 5 },
    'English': { easy: 8, medium: 21, hard: 1 }  // Adjusted: 21 medium, 1 hard
  },
  hard: {
    'Advance Math': { easy: 5, medium: 15, hard: 30 },
    'Basic Math': { easy: 2, medium: 6, hard: 12 },
    'IQ & Logical': { easy: 2, medium: 6, hard: 12 },
    'English': { easy: 1, medium: 28, hard: 1 }  // Adjusted: 28 medium, 1 hard
  }
};

async function connectDB() {
  const uri = process.env.MOCKTEST_MONGODB_URI;
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas\n');
}

async function verifyRatios() {
  console.log('='.repeat(70));
  console.log('DIFFICULTY RATIO VERIFICATION');
  console.log('='.repeat(70));
  
  const sections = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  const testLevels = ['easy', 'medium', 'hard'];
  
  let allGood = true;
  
  for (const testLevel of testLevels) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${testLevel.toUpperCase()} TEST`);
    console.log('='.repeat(70));
    
    for (const section of sections) {
      console.log(`\n${section}:`);
      const ratios = DIFFICULTY_RATIOS[testLevel][section];
      
      for (const [difficulty, required] of Object.entries(ratios)) {
        const available = await Question.countDocuments({
          section,
          difficulty,
          testId: null
        });
        
        const status = available >= required ? '✅' : '❌';
        const statusText = available >= required ? 'OK' : 'INSUFFICIENT';
        
        console.log(
          `  ${difficulty.padEnd(6)}: ${required.toString().padStart(2)} required, ` +
          `${available.toString().padStart(3)} available ${status} ${statusText}`
        );
        
        if (available < required) {
          allGood = false;
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (allGood) {
    console.log('✅ ALL RATIOS CAN BE SATISFIED!');
    console.log('The question bank has enough questions for all difficulty levels.');
  } else {
    console.log('❌ INSUFFICIENT QUESTIONS FOR SOME RATIOS!');
    console.log('Some difficulty levels do not have enough questions.');
    console.log('\nRecommendations:');
    console.log('1. Add more questions to the insufficient categories');
    console.log('2. Adjust the difficulty ratios to match available questions');
    console.log('3. Allow fallback to other difficulties when insufficient');
  }
  
  console.log('='.repeat(70));
}

async function main() {
  try {
    await connectDB();
    await verifyRatios();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

main();
