const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

const organizerToken = jwt.sign({ id: 'user1', role: 'organizer' }, JWT_SECRET, { expiresIn: '1d' });
const attendeeToken = jwt.sign({ id: 'user2', role: 'attendee' }, JWT_SECRET, { expiresIn: '1d' });

console.log('Organizer Token:', organizerToken);
console.log('Attendee Token:', attendeeToken);