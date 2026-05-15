import { validationResult } from 'express-validator';
import { generateAIResponse } from '../services/aiService.js';
import { getDb } from '../config/mongoClient.js';
import { ObjectId } from 'mongodb';
import { logger } from '../utils/logger.js';

export const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { recipient_id, message, conversationId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = user.id;
    const userType = user.type || 'authenticated';
    logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} sending message to conversation`);

    const db = getDb();
    const convColl = db.collection('conversations');

    let conversation = null;

    // If conversationId is provided, use that specific conversation
    if (conversationId && ObjectId.isValid(conversationId)) {
      conversation = await convColl.findOne({ _id: new ObjectId(conversationId) });
      
      // Verify user is a participant
      if (conversation && !conversation.participants.includes(userId)) {
        return res.status(403).json({ error: 'Forbidden: Not a participant' });
      }
    }

    // If no conversation found or not provided, find or create default conversation
    if (!conversation) {
      const participants = [userId, recipient_id || 'ai'].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
      conversation = await convColl.findOne({ participants });
      
      if (!conversation) {
        logger.info(`Creating new conversation for participants: ${participants.join(', ')}`);
        const result = await convColl.insertOne({ 
          participants, 
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          participantTypes: {
            [userId]: userType,
            [recipient_id || 'ai']: 'ai'
          }
        });
        conversation = await convColl.findOne({ _id: result.insertedId });
      }
    }

    // Save user message
    const userMsg = {
      type: 'user',
      sender: userId,
      senderType: userType,
      text: message,
      createdAt: new Date()
    };

    // Generate and save AI response
    const aiText = await generateAIResponse({ 
      userId: userId, 
      message, 
      context: conversation.messages 
    });
    
    const aiMsg = {
      type: 'ai',
      sender: 'ai',
      text: aiText,
      createdAt: new Date()
    };

    // Save both messages to MongoDB and update timestamp
    await convColl.updateOne(
      { _id: conversation._id }, 
      { 
        $push: { 
          messages: { 
            $each: [userMsg, aiMsg] 
          }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    logger.info(`Successfully saved ${userType} message and AI response to conversation ${conversation._id}`);

    return res.json({ 
      ok: true, 
      userMessage: userMsg,
      aiMessage: aiMsg,
      conversationId: conversation._id 
    });
  } catch (err) {
    logger.error(`Error in sendMessage: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

export const getHistory = async (req, res, next) => {
  const paramId = req.params.id; // could be conversationId or userId/guestId
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const userId = user.id;
    const userType = user.type || 'authenticated';
    logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} fetching conversation history for param: ${paramId}`);

    const db = getDb();
    const convColl = db.collection('conversations');

    let conv = null;

    // If param is a valid ObjectId, try to fetch by conversation id
    if (ObjectId.isValid(paramId)) {
      conv = await convColl.findOne(
        { _id: new ObjectId(paramId) },
        {
          projection: {
            participants: 1,
            messages: 1
          }
        }
      );
    }

    // If not found by conversation id, treat param as a user/guest id and fetch latest conversation
    if (!conv) {
      const searchId = paramId;
      logger.info(`Param ${paramId} not a conversation id or not found; looking up conversations for identifier ${searchId}`);

      const convs = await convColl.find({ participants: searchId }).toArray();
      if (!convs || convs.length === 0) {
        logger.error(`No conversations found for identifier: ${searchId}`);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // pick latest conversation by last message createdAt or by conversation createdAt
      convs.sort((a, b) => {
        const aLast = a.messages?.length ? a.messages.at(-1)?.createdAt : a.createdAt;
        const bLast = b.messages?.length ? b.messages.at(-1)?.createdAt : b.createdAt;
        return new Date(bLast) - new Date(aLast);
      });

      conv = convs[0];
    }

    if (!conv) {
      logger.error(`Conversation not found for param: ${paramId}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Ensure user/guest is participant
    if (!conv.participants.includes(userId)) {
      logger.warn(`Unauthorized access attempt to conversation ${conv._id} by ${userType} ${userId}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Normalize messages and sort chronologically
    const messages = (conv.messages || []).map(m => ({
      type: m.type,
      text: m.text,
      senderType: m.senderType || 'authenticated',
      createdAt: m.createdAt
    }));

    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    logger.info(`Successfully retrieved conversation history for ${userType} ${userId}, conversation ${conv._id}`);
    return res.json({
      conversation: {
        id: conv._id,
        messages
      }
    });
  } catch (err) {
    logger.error(`Error fetching conversation history: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

export const clearHistory = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const userId = user.id;
        const userType = user.type || 'authenticated';
        logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} attempting to delete conversation: ${conversationId}`);

        const db = getDb();
        const convColl = db.collection('conversations');

        if (!ObjectId.isValid(conversationId)) {
            logger.error(`Invalid conversation ID format: ${conversationId}`);
            return res.status(400).json({ error: 'Invalid conversation id' });
        }

        const conv = await convColl.findOne({ _id: new ObjectId(conversationId) });
        if (!conv) {
            logger.error(`Conversation not found: ${conversationId}`);
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user/guest is participant
        const isParticipant = conv.participants.includes(userId);

        if (!isParticipant) {
            logger.warn(`Unauthorized deletion attempt of conversation ${conversationId} by ${userType} ${userId}`);
            return res.status(403).json({ error: 'Forbidden' });
        }

        await convColl.deleteOne({ _id: new ObjectId(conversationId) });
        logger.info(`Successfully deleted conversation ${conversationId} by ${userType} ${userId}`);
        
        return res.json({ message: 'Conversation deleted successfully' });
    } catch (err) {
        logger.error(`Error deleting conversation: ${err.message}`);
        return res.status(500).json({ error: err.message });
    }
};

export const getAllConversations = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const userId = user.id;
        const userType = user.type || 'authenticated';
        logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} fetching all conversations`);

        const db = getDb();
        const convColl = db.collection('conversations');

        // Find all conversations where user is a participant
        const conversations = await convColl
            .find({ participants: userId })
            .sort({ updatedAt: -1, createdAt: -1 })
            .toArray();

        // Format conversations with preview
        const formattedConversations = conversations.map(conv => {
            const messages = conv.messages || [];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const firstUserMessage = messages.find(m => m.type === 'user');
            
            return {
                id: conv._id,
                title: firstUserMessage?.text?.substring(0, 50) || 'New Chat',
                preview: lastMessage?.text?.substring(0, 100) || '',
                messageCount: messages.length,
                createdAt: conv.createdAt,
                updatedAt: lastMessage?.createdAt || conv.createdAt
            };
        });

        logger.info(`Retrieved ${formattedConversations.length} conversations for ${userType} ${userId}`);
        return res.json({ conversations: formattedConversations });
    } catch (err) {
        logger.error(`Error fetching conversations: ${err.message}`);
        return res.status(500).json({ error: err.message });
    }
};

export const createNewConversation = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const userId = user.id;
        const userType = user.type || 'authenticated';
        logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} creating new conversation`);

        const db = getDb();
        const convColl = db.collection('conversations');

        const newConversation = {
            participants: [userId, 'ai'].sort(),
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            participantTypes: {
                [userId]: userType,
                'ai': 'ai'
            }
        };

        const result = await convColl.insertOne(newConversation);
        const conversation = await convColl.findOne({ _id: result.insertedId });

        logger.info(`Created new conversation ${conversation._id} for ${userType} ${userId}`);
        return res.json({ 
            conversation: {
                id: conversation._id,
                title: 'New Chat',
                messageCount: 0,
                createdAt: conversation.createdAt
            }
        });
    } catch (err) {
        logger.error(`Error creating conversation: ${err.message}`);
        return res.status(500).json({ error: err.message });
    }
};
