const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid'); 
const app = express();
const port = 3000;

app.use(express.json());


const db = {
  events: new Map(),
  registrations: new Map(),
  findEvent: function(id) {
    return this.events.get(id);
  },
  createEvent: function(eventData, userId) {
    const id = uuidv4();
    const event = { ...eventData, id, createdBy: userId, registrations: 0 };
    this.events.set(id, event);
    return event;
  },
  registerForEvent: function(eventId, attendeeId) {
    const event = this.findEvent(eventId);
    if (!event) throw new Error('Event not found');
    if (event.registrations >= event.capacity) throw new Error('Event is at full capacity');
    // Simulate atomic update
    event.registrations += 1;
    const regId = uuidv4();
    this.registrations.set(regId, { eventId, attendeeId });
    return { registrationId: regId, eventId, status: 'registered' };
  },
  updateEventStatus: function(id, status) {
    const event = this.findEvent(id);
    if (!event) throw new Error('Event not found');
    event.status = status;
    return event;
  }
};


const JWT_SECRET = 'your-secret-key';


const authenticateJWT = (requiredRole) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};


app.post('/events', 
  authenticateJWT('organizer'),
  [
    body('title').notEmpty(),
    body('date').isISO8601(),
    body('location').notEmpty(),
    body('capacity').isInt({ min: 1 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const event = db.createEvent(req.body, req.user.id);
      res.status(201).json(event);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


app.post('/events/:id/registrations', 
  authenticateJWT('attendee'),
  (req, res) => {
    try {
      const registration = db.registerForEvent(req.params.id, req.user.id);
      res.status(201).json(registration);
    } catch (err) {
      if (err.message === 'Event not found') {
        res.status(404).json({ error: err.message });
      } else if (err.message === 'Event is at full capacity') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }
);



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
