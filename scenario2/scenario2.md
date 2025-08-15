Validation: Bolted on express-validator – no more garbage data. Dates, capacities, required fields? All checked upfront.

Auth That Actually Works:

JWT middleware verifies tokens on every protected route.

Added role checks (organizer vs. attendee) by digging into the token claims. 

Data Sanity:
* UUIDs everywhere (no ID collisions)

* Duplicate registration checks

* Clear error messages 

Trade-offs & Workarounds:

* Persistence: It is still in-memory  But it's structured like a real DB now, so swapping in actual PostgreSQL later is trivial.

ACID Transactions
* For critical stuff like event capacity checks, I wrote atomic operations (this.registrations.set) to avoid overbooking races. It is not perfect, but it prevents the worst race conditions.

