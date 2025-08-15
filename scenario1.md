
### Approach Explanation
"So, for the event API, I focused on making it straightforward and predictable. We use clear resource paths (like /events or /events/{id}/registrations) and standard HTTP verbs (GET, POST, PUT, DELETE) so developers know what to expect.

Security-wise: Everything sensitive is locked down with JWT tokens. We check roles in our middleware  so only organizers can create events, while attendees can just register or see their own stuff.

Handling Scale (10k users!): We’d spread the load across multiple servers behind a load balancer. For stuff people read a lot – like event listings – we’d cache it heavily using Redis. Notifications (emails, etc.) would be sent via background jobs so they don’t slow down the main API or we can go with multi threaded servers as well if we are looking for mono repo or monolith architecture.

Keeping it Stable: To stop abuse or overload, we’d set up Kong API Gateway to limit how often someone can call the API – something like 100 requests per minute per user or IP. to answer scenarios like  "Can I actually register before the event fills up?", we use either database transactions or a version-checking system (optimistic locking) to prevent overbooking and race conditions.

Annoying Bits We Solved: Token expiry? Yeah, we added refresh tokens. Making sure duplicate registrations don’t happen if a network call fails? We use unique client-generated IDs for POST requests (idempotency keys).

The Gist: It’s built to be secure, handle a big crowd reliably, and play nicely with Kong for routing and protection. We tackled the common pain points like registration races and token headaches upfront."

### API Endpoints Design
Creating & Viewing Events

POST /events
Organizers create new events
Send: { title, date, location, capacity }
Get back: Full event details with ID 
Validates: Date format, capacity >0, user is organizer


GET /events
Anyone browses events
Filter by: ?search=keyword&fromDate=2025-01-01
Get back: [ {id, title, date...}, ... ] 
Handles: Pagination (?page=2&limit=20), empty results are okay
Why? Prevents huge data dumps

GET /events/{id}
See specific event details
Get back: { id, title..., registrations: 85/100 } 
Fails gracefully: "Event not found" (404)

Registrations & Notifications

POST /events/{id}/registrations
Attendees sign up
Send: { attendeeId } (usually from your JWT)
Get back: { registrationId, status: "registered" } (201 Created)
Blocks: Overbooking (400), duplicates (409)
Secret sauce: Atomic capacity checks prevent double-booking

GET /registrations
User see their signup
Get back: [ { registrationId, event: {...} }, ... ]
Filters: Your events only (via JWT), optional ?eventId=123
Nice touch: Returns [] for new users

POST /events/{id}/notify
Organizers blast updates
Send: { message: "Event delayed!" }
Get back: { status: "notified", sentTo: 150 } 
Runs in background: Doesn't wait for all emails/SMS to send
Checks: Valid event (404), organizer permissions (403)

Key Design Choices:

Permissions baked in:

JWT checks in middleware

Organizers ≠ Attendees
