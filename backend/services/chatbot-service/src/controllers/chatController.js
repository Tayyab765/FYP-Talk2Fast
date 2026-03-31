import { validationResult } from 'express-validator';
import { generateAIResponse } from '../services/aiService.js';
import { getDb } from '../config/mongoClient.js';
import { ObjectId } from 'mongodb';
import { logger } from '../utils/logger.js';

export const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { recipient_id, message } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = user.id;
    const userType = user.type || 'authenticated';
    logger.info(`${userType === 'guest' ? 'Guest' : 'User'} ${userId} sending message to conversation`);

    const db = getDb();
    const convColl = db.collection('conversations');

    // find or create conversation
    const participants = [userId, recipient_id].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
    let conversation = await convColl.findOne({ participants });
    if (!conversation) {
      logger.info(`Creating new conversation for participants: ${participants.join(', ')}`);
      const result = await convColl.insertOne({ 
        participants, 
        messages: [],
        createdAt: new Date(),
        participantTypes: {
          [userId]: userType,
          [recipient_id]: 'ai'
        }
      });
      conversation = await convColl.findOne({ _id: result.insertedId });
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

    // Save both messages to MongoDB
    await convColl.updateOne(
      { _id: conversation._id }, 
      { 
        $push: { 
          messages: { 
            $each: [userMsg, aiMsg] 
          }
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
