# ✅ Getting Started Checklist

Use this checklist to ensure you're ready to run the Career Counseling Module.

---

## 📋 Pre-Installation Checklist

### System Requirements
- [ ] **Node.js v16+** installed
  - Check: `node --version`
  - Install from: https://nodejs.org/

- [ ] **npm** installed (comes with Node.js)
  - Check: `npm --version`

- [ ] **MongoDB** installed and running
  - Check: `mongo --version`
  - Install from: https://www.mongodb.com/try/download/community
  - OR use Docker: `docker run -d -p 27017:27017 mongo`

- [ ] **OpenAI API Key** obtained
  - Get from: https://platform.openai.com/api-keys
  - Ensure billing is enabled

- [ ] **Code Editor** (VS Code recommended)
  - Download from: https://code.visualstudio.com/

- [ ] **API Testing Tool** (Postman recommended)
  - Download from: https://www.postman.com/downloads/

---

## 📥 Installation Checklist

### 1. Project Setup
- [ ] Navigate to backend directory
  ```bash
  cd e:\FYP-2\CareerCouncelling\backend
  ```

- [ ] Verify all files are present
  ```bash
  ls
  # Should see: src/, package.json, README.md, etc.
  ```

### 2. Dependencies
- [ ] Install npm packages
  ```bash
  npm install
  ```

- [ ] Wait for installation to complete (may take 2-3 minutes)

- [ ] Verify node_modules folder created
  ```bash
  ls node_modules
  ```

### 3. Environment Configuration
- [ ] Copy environment template
  ```bash
  cp .env.example .env
  ```

- [ ] Open .env file in editor

- [ ] Configure MongoDB URI
  ```env
  MONGODB_URI=mongodb://localhost:27017/career_counseling
  ```

- [ ] Add your OpenAI API key
  ```env
  OPENAI_API_KEY=sk-your-actual-key-here
  ```

- [ ] Review other settings (defaults are fine)

- [ ] Save .env file

### 4. Database Setup
- [ ] Ensure MongoDB is running
  ```bash
  # Windows
  net start MongoDB
  
  # Mac/Linux
  sudo systemctl start mongod
  
  # Manual start
  mongod --dbpath ./data
  ```

- [ ] Test MongoDB connection
  ```bash
  mongo
  show dbs
  exit
  ```

---

## 🚀 First Run Checklist

### 1. Start Server
- [ ] Run development server
  ```bash
  npm run dev
  ```

- [ ] Wait for startup messages:
  ```
  MongoDB Connected: localhost
  Server running in development mode on port 5000
  ```

- [ ] Server should be running at http://localhost:5000

### 2. Test Basic Endpoints

- [ ] Test health endpoint
  ```bash
  curl http://localhost:5000/api/health
  ```
  Should return: `{"success": true, "message": "Career Counseling API is running"}`

- [ ] Test questions endpoint
  ```bash
  curl http://localhost:5000/api/career/questions
  ```
  Should return 22 questions

- [ ] Open browser and visit http://localhost:5000
  Should see API welcome message

---

## 🧪 Testing Checklist

### 1. Postman Setup
- [ ] Open Postman

- [ ] Import collection
  - Click Import
  - Select `postman_collection.json`
  - Click Import

- [ ] Verify collection imported
  - Should see "Career Counseling API" collection
  - With 9 requests

### 2. Run Test Requests

- [ ] **Test 1:** Health Check
  - Run GET /health
  - Should return 200 OK

- [ ] **Test 2:** Get Questions
  - Run GET /career/questions
  - Should return 22 questions array

- [ ] **Test 3:** Submit Profile
  - Run POST /career/profile
  - Edit userId if needed
  - Should return 201 Created with profileId

- [ ] **Test 4:** Generate Recommendations (⚠️ Uses OpenAI API)
  - Run POST /career/recommend
  - Should return sessionId and recommendations
  - **Note:** This costs ~$0.05-0.10

- [ ] **Test 5:** Send Chat Message (⚠️ Uses OpenAI API)
  - Update :sessionId in URL with actual session ID
  - Run POST /career/chat/:sessionId
  - Should return AI response
  - **Note:** This costs ~$0.01-0.02

---

## 📚 Documentation Checklist

### Read These First
- [ ] README.md (5 minutes)
  - Overview and features

- [ ] QUICK_START.md (3 minutes)
  - Fast setup guide

- [ ] DOCUMENTATION_INDEX.md (5 minutes)
  - Navigation guide

### For Development
- [ ] DIRECTORY_STRUCTURE.md (15 minutes)
  - Understand file organization

- [ ] API_DOCUMENTATION.md (20 minutes)
  - Learn all endpoints

### For Understanding
- [ ] ARCHITECTURE.md (30 minutes)
  - System design and flows

- [ ] PROJECT_OVERVIEW.md (25 minutes)
  - Complete project details

### For Deployment
- [ ] SETUP_GUIDE.md (15 minutes)
  - Production deployment

---

## 🎓 FYP Preparation Checklist

### Understanding the Project
- [ ] Can explain the problem statement
- [ ] Understand the solution approach
- [ ] Know the system architecture
- [ ] Understand clean architecture benefits
- [ ] Know SOLID principles applied
- [ ] Understand AI integration

### Code Walkthrough
- [ ] Can explain project structure
- [ ] Know what each directory contains
- [ ] Understand data flow
- [ ] Can explain Controller-Service-Model pattern
- [ ] Know how AI prompts work
- [ ] Understand token optimization

### Live Demonstration
- [ ] Server runs without errors
- [ ] Can get assessment questions
- [ ] Can submit a profile
- [ ] Can generate recommendations
- [ ] Can chat with the system
- [ ] Can show session analytics

### Answering Questions
- [ ] Why this architecture?
- [ ] Why OpenAI API?
- [ ] How does contextual chat work?
- [ ] How to scale the system?
- [ ] What are security measures?
- [ ] What are future enhancements?

---

## 🔧 Troubleshooting Checklist

### If Server Won't Start

- [ ] Check Node.js version
  ```bash
  node --version
  # Should be v16 or higher
  ```

- [ ] Check if port 5000 is available
  ```bash
  netstat -ano | findstr :5000
  # Should be empty
  ```

- [ ] Check .env file exists
  ```bash
  ls .env
  ```

- [ ] Check MongoDB is running
  ```bash
  mongo
  ```

- [ ] Check for errors in console
  - Read error messages carefully
  - Check logs/error.log

### If MongoDB Won't Connect

- [ ] Verify MongoDB is running
  ```bash
  ps aux | grep mongod  # Mac/Linux
  tasklist | findstr mongod  # Windows
  ```

- [ ] Check MongoDB URI in .env
  - Should be: `mongodb://localhost:27017/career_counseling`

- [ ] Try connecting manually
  ```bash
  mongo mongodb://localhost:27017
  ```

- [ ] Check MongoDB logs
  - Usually in `/var/log/mongodb/mongod.log`

### If OpenAI API Fails

- [ ] Verify API key in .env
  - Should start with `sk-`
  - No spaces or quotes

- [ ] Check OpenAI account status
  - Visit: https://platform.openai.com/usage
  - Ensure you have credits

- [ ] Check API key permissions
  - Should have access to GPT-4

- [ ] Test with simple request first

### If Dependencies Won't Install

- [ ] Clear npm cache
  ```bash
  npm cache clean --force
  ```

- [ ] Delete node_modules
  ```bash
  rm -rf node_modules
  # or
  rmdir /s node_modules  # Windows
  ```

- [ ] Reinstall
  ```bash
  npm install
  ```

- [ ] Check npm version
  ```bash
  npm --version
  # Should be v7 or higher
  ```

---

## ✨ Post-Setup Checklist

### Verification
- [ ] All tests pass in Postman
- [ ] No errors in console
- [ ] Logs directory created
- [ ] Can access all endpoints
- [ ] MongoDB collections created

### Learning
- [ ] Read main documentation
- [ ] Understand code structure
- [ ] Reviewed example code
- [ ] Tested all features
- [ ] Ready to explain to others

### Next Steps
- [ ] Build frontend interface
- [ ] Add more test cases
- [ ] Practice demo presentation
- [ ] Prepare for questions
- [ ] Plan future enhancements

---

## 📊 Final Verification

Run this checklist before your FYP presentation:

### 24 Hours Before
- [ ] Server starts without errors
- [ ] All endpoints work
- [ ] OpenAI integration tested
- [ ] Database has test data
- [ ] Postman collection ready
- [ ] Laptop/demo machine tested

### 1 Hour Before
- [ ] MongoDB is running
- [ ] Server is running
- [ ] Postman is open
- [ ] Browser is ready
- [ ] Code editor is open
- [ ] Documentation is accessible

### During Presentation
- [ ] Show architecture diagram
- [ ] Demonstrate complete flow
- [ ] Walk through code
- [ ] Show database
- [ ] Explain AI integration
- [ ] Discuss scalability

---

## 🎯 Success Indicators

You're ready when you can confidently:

✅ Start the server in under 1 minute  
✅ Explain the architecture in 5 minutes  
✅ Demonstrate the complete flow  
✅ Answer questions about the code  
✅ Explain SOLID principles used  
✅ Discuss future enhancements  
✅ Show clean code examples  
✅ Navigate the codebase easily  

---

## 📞 Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Check MongoDB
mongo

# View logs
tail -f logs/combined.log

# Test health endpoint
curl http://localhost:5000/api/health

# Run verification script
./verify-installation.ps1
```

---

## 🎉 Completion

Once all checkboxes are marked, you're ready to:
- ✅ Demo your project
- ✅ Present to stakeholders
- ✅ Deploy to production
- ✅ Add to portfolio
- ✅ Excel in your viva

---

**Good luck! You've got this! 🚀**

---

*Keep this checklist handy for quick reference*
