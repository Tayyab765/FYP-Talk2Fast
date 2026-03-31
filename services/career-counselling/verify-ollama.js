#!/usr/bin/env node

/**
 * Ollama Setup Verification Script
 * Checks if Ollama is properly configured and ready for use
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkOllamaConnection() {
  log('\n📡 Checking Ollama connection...', 'blue');
  
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 5000
    });
    
    log('✅ Ollama is running!', 'green');
    return response.data;
    
  } catch (error) {
    log('❌ Cannot connect to Ollama', 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n⚠️  Ollama is not running. Please start it:', 'yellow');
      log('   Windows: Ollama should auto-start, or run "ollama serve"', 'yellow');
      log('   Mac/Linux: Run "ollama serve" in a terminal', 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    return null;
  }
}

async function checkModelAvailability(tags) {
  log('\n🤖 Checking model availability...', 'blue');
  
  if (!tags || !tags.models) {
    log('❌ Could not retrieve model list', 'red');
    return false;
  }
  
  const models = tags.models.map(m => m.name);
  log(`   Found ${models.length} installed model(s)`, 'reset');
  
  if (models.length > 0) {
    log('   Installed models:', 'reset');
    models.forEach(model => {
      if (model === OLLAMA_MODEL) {
        log(`     ✅ ${model} (configured)`, 'green');
      } else {
        log(`     - ${model}`, 'reset');
      }
    });
  }
  
  const modelExists = models.includes(OLLAMA_MODEL);
  
  if (!modelExists) {
    log(`\n❌ Required model "${OLLAMA_MODEL}" is not installed`, 'red');
    log('\n⚠️  Please install it:', 'yellow');
    log(`   ollama pull ${OLLAMA_MODEL}`, 'yellow');
    return false;
  }
  
  log(`\n✅ Model "${OLLAMA_MODEL}" is ready!`, 'green');
  return true;
}

async function testModelInference() {
  log('\n🧪 Testing model inference...', 'blue');
  
  const testPrompt = 'Hello! Please respond with a brief greeting (one sentence).';
  
  try {
    log('   Sending test prompt...', 'reset');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: testPrompt,
        stream: false,
        options: {
          num_predict: 50
        }
      },
      {
        timeout: 60000 // 60 seconds for first request (model loading)
      }
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data && response.data.response) {
      log('✅ Model inference successful!', 'green');
      log(`   Response time: ${duration}ms`, 'reset');
      log(`   Model response: "${response.data.response.trim().substring(0, 100)}"`, 'reset');
      
      if (duration > 30000) {
        log('\n⚠️  Note: First request took >30s (model loading)', 'yellow');
        log('   Subsequent requests will be much faster', 'yellow');
      }
      
      return true;
    } else {
      log('❌ Model returned empty response', 'red');
      return false;
    }
    
  } catch (error) {
    log('❌ Model inference failed', 'red');
    
    if (error.code === 'ECONNABORTED') {
      log('   Request timed out (60s)', 'red');
      log('   The model may be loading or your system may be slow', 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    return false;
  }
}

async function checkEnvironmentConfig() {
  log('\n⚙️  Checking environment configuration...', 'blue');
  
  const requiredVars = [
    { name: 'OLLAMA_API_URL', value: process.env.OLLAMA_API_URL },
    { name: 'OLLAMA_MODEL', value: process.env.OLLAMA_MODEL },
    { name: 'OLLAMA_TIMEOUT', value: process.env.OLLAMA_TIMEOUT },
    { name: 'MONGODB_URI', value: process.env.MONGODB_URI },
    { name: 'PORT', value: process.env.PORT }
  ];
  
  let allConfigured = true;
  
  for (const envVar of requiredVars) {
    if (envVar.value) {
      log(`   ✅ ${envVar.name} = ${envVar.value}`, 'green');
    } else {
      log(`   ⚠️  ${envVar.name} not set (using default)`, 'yellow');
      allConfigured = false;
    }
  }
  
  return allConfigured;
}

async function main() {
  log('\n' + '='.repeat(60), 'bold');
  log('   OLLAMA INTEGRATION VERIFICATION', 'bold');
  log('='.repeat(60) + '\n', 'bold');
  
  log(`Configuration:`, 'blue');
  log(`   Ollama URL: ${OLLAMA_URL}`, 'reset');
  log(`   Model: ${OLLAMA_MODEL}`, 'reset');
  
  // Check environment configuration
  const configOk = await checkEnvironmentConfig();
  
  // Check Ollama connection
  const tags = await checkOllamaConnection();
  if (!tags) {
    log('\n❌ Setup verification failed: Ollama not accessible', 'red');
    process.exit(1);
  }
  
  // Check model availability
  const modelOk = await checkModelAvailability(tags);
  if (!modelOk) {
    log('\n❌ Setup verification failed: Required model not installed', 'red');
    process.exit(1);
  }
  
  // Test model inference
  const inferenceOk = await testModelInference();
  if (!inferenceOk) {
    log('\n❌ Setup verification failed: Model inference error', 'red');
    process.exit(1);
  }
  
  // Final summary
  log('\n' + '='.repeat(60), 'bold');
  log('   ✅ ALL CHECKS PASSED!', 'green');
  log('='.repeat(60), 'bold');
  log('\n🚀 Your system is ready to use Ollama for career counseling!', 'green');
  log('\nNext steps:', 'blue');
  log('   1. Start the career counseling service: npm start', 'reset');
  log('   2. Test the API endpoints', 'reset');
  log('   3. Refer to OLLAMA_INTEGRATION.md for detailed usage', 'reset');
  log('');
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
