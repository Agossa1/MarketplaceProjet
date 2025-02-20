 import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Sender is required']
  },
  text: { 
    type: String, 
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  isAIResponse: { 
    type: Boolean, 
    default: false 
  },
  attachments: [{
    type: { type: String, enum: ['image', 'file'] },
    url: String,
    name: String
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
});

const ChatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'At least two participants are required'],
    validate: [arrayMinLength, 'Chat must have at least two participants']
  }],
  messages: [MessageSchema],
  linkedOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  linkedProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Custom validator for minimum array length
function arrayMinLength(val) {
  return val.length >= 2;
}

// Indexes for better query performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for unread messages count
ChatSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => msg.readBy.length < this.participants.length).length;
});

// Pre-save hook to update lastMessage
ChatSchema.pre('save', function(next) {
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      text: lastMsg.text,
      sender: lastMsg.sender,
      timestamp: lastMsg.timestamp
    };
  }
  next();
});

// Method to add a message to the chat
ChatSchema.methods.addMessage = function(senderId, text, isAIResponse = false, attachments = []) {
  this.messages.push({
    sender: senderId,
    text,
    isAIResponse,
    attachments,
    readBy: [{ user: senderId }]
  });
  return this.save();
};

// Static method to get recent chats for a user
ChatSchema.statics.getRecentChats = function(userId, limit = 10) {
  return this.find({ participants: userId, status: 'active' })
             .sort({ 'lastMessage.timestamp': -1 })
             .limit(limit)
             .populate('participants', 'username avatar')
             .populate('lastMessage.sender', 'username');
};

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;