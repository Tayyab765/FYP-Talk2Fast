import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  },
  questionCount: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  order: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  sections: {
    type: [sectionSchema],
    required: true,
    validate: {
      validator: function(sections) {
        // Must have exactly 4 sections
        if (sections.length !== 4) return false;
        
        // Check sequential order (0, 1, 2, 3)
        const orders = sections.map(s => s.order).sort((a, b) => a - b);
        if (orders.join(',') !== '0,1,2,3') return false;
        
        return true;
      },
      message: 'Test must have exactly 4 sections with sequential order (0, 1, 2, 3)'
    }
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for filtering active tests and sorting
mockTestSchema.index({ isActive: 1, difficulty: 1 });
mockTestSchema.index({ createdAt: -1 });

const MockTest = mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema);

export default MockTest;
