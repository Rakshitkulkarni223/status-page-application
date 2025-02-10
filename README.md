
# Status page application

#### Description
Create a simplified version of a status page application similar to services like StatusPage or
Cachet or Betterstack or Openstatus. The application should allow administrators to manage
services and their statuses, and provide a public-facing page for users to view the current status
of all services.
## Run Locally

Clone the project

```bash
  git clone https://github.com/Rakshitkulkarni223/status-page-application.git
```

## Backend Setup


Go to the project directory

```bash
  cd status-page-backend
```

Install dependencies

```bash
  npm install
```

Configure environment variables

- ##### Create a ***.env*** file in the root of the ***status-page-backend*** directory.

- ##### Add the following variables:

```bash
PORT=5000
SOCKET_PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
```

Start the server

```bash
  npm start
```

The server will be running at http://localhost:5000 by default.

## Frontend Setup

Navigate to the frontend directory (In new terminal)

```bash
  cd status-page-frontend
```

Install dependencies

```bash
  npm install
```

Start the application

```bash
  npm run dev
```

The application will be accessible at http://localhost:5173 by default.

## Tech Stack

**Client:** React (with Vite), TailwindCSS, ShadCN UI

**Server:** Node, Express

**Database:** MongoDB


## Deployment

The application is deployed and can be accessed at
[Link to application](https://staus-page-c0540.web.app)