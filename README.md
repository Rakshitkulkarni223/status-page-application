# status-page-application

Build a simplified version of a status page application
Objective
Create a simplified version of a status page application similar to services like StatusPage, Cachet, Betterstack, or Openstatus. The application should allow administrators to manage services and their statuses and provide a public-facing page for users to view the current status of all services.
Project Scope
The primary goal is to create a working application where anyone can log, view, and manage the status of multiple applications. The application should include a public page where customers and end users can view the status of the application.


Key Features
1. User Authentication
2. Team management
3. Organization (multi-tenant)
4. Service Management:
。 CRUD operations for services (e.g., "Website", "API", "Database")
o Ability to set and update the status of each service (e.g., "Operational", "Degraded Performance", "Partial Outage", "Major Outage")
5. Incident/Maintenance Management:
• Create, update, and resolve incidents or scheduled maintenance
o Associate incidents with specific services
• Add updates to ongoing incidents
6. Real-time Status Updates:
• Implement WebSocket connection to push status changes to connected clients in real-time
7. Public Status Page
• Display the current status of all services
。 Show active incidents and maintenance
o Display a timeline of recent incidents and status changes
Tech stack
You may choose any front-end framework, such as React, Vue.js, or others you are comfortable with.

using react code