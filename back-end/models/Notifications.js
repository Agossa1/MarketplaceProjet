import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
    index: true
  },
  message: { 
    type: String, 
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: { 
    type: String, 
    enum: ['order_update', 'promotion', 'admin_message', 'product_update', 'payment_update', 'account_update'],
    required: [true, 'Notification type is required']
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  relatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'documentModel'
  },
  documentModel: {
    type: String,
    enum: ['Order', 'Product', 'User', 'Payment'],
    required: function() { return this.relatedDocument != null; }
  },
  actionUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ isRead: 1 });

// Virtual for time since creation
NotificationSchema.virtual('timeSinceCreated').get(function() {
  return Date.now() - this.createdAt;
});

// Pre-save hook to set expiration date if not set
NotificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  }
  next();
});

// Static method to get unread notifications for a user
NotificationSchema.statics.getUnreadNotifications = function(userId) {
  return this.find({ user: userId, isRead: false }).sort({ createdAt: -1 });
};

// Method to mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static method to delete expired notifications
NotificationSchema.statics.deleteExpiredNotifications = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;