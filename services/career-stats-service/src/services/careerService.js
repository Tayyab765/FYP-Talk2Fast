import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load salary data from JSON file
let salaryData = [];
try {
  const dataPath = path.join(__dirname, '../../../../shared/data/payscale/pakistan_job_salaries.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  salaryData = JSON.parse(rawData);
  console.log(`✅ Loaded ${salaryData.length} career salary records`);
} catch (error) {
  console.error('❌ Error loading salary data:', error.message);
}

export const listCareers = () => {
  return salaryData;
};

export const getCareerByTitle = (title) => {
  return salaryData.find(job => 
    job.job_title.toLowerCase().includes(title.toLowerCase())
  );
};

export const searchCareers = (query) => {
  if (!query) return salaryData;
  const lowerQuery = query.toLowerCase();
  return salaryData.filter(job => 
    job.job_title.toLowerCase().includes(lowerQuery)
  );
};

export const getSalaryStats = () => {
  if (salaryData.length === 0) return null;
  
  // Extract numeric salary values
  const salaries = salaryData.map(job => {
    const salaryStr = job.average_salary.replace(/[^0-9]/g, '');
    return parseInt(salaryStr, 10);
  }).filter(s => !isNaN(s));
  
  const sorted = salaries.sort((a, b) => a - b);
  
  return {
    total_jobs: salaryData.length,
    min_salary: Math.min(...salaries),
    max_salary: Math.max(...salaries),
    avg_salary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
    median_salary: sorted[Math.floor(sorted.length / 2)]
  };
};