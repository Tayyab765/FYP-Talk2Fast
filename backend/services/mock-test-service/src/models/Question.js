import mongoose from 'mongoose';

const optionsSchema = new mongoose.Schema({
  A: {
    type: String,
    required: true,
    trim: true
  },
  B: {
    type: String,
    required: true,
    trim: true
  },
  C: {
    type: String,
    required: true,
    trim: true
  },
  D: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: false,  // Optional for question bank approach
    index: true
  },
  section: {
    type: String,
    required: true,
    enum: ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: optionsSchema,
    required: true,
    validate: {
      validator: function(options) {
        // Ensure all four options exist and are non-empty
        return options.A && options.B && options.C && options.D;
      },
      message: 'Question must have exactly 4 options (A, B, C, D) with non-empty values'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    uppercase: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

// Compound index for fetching section questions in order
questionSchema.index({ testId: 1, section: 1, order: 1 });

// Index for topic-wise analytics
questionSchema.index({ topic: 1 });

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

export default Question;
