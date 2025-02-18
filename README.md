## Backend Server

### Description

This backend server powers the digital signage system by managing screen devices, handling Socket connections, and synchronizing content between the database and connected devices.

### Features

- **Express.js API**: Provides RESTful endpoints for managing screens.
- **MongoDB Integration**: Stores screen data, including screen IDs and associated content.
- **Socket Communication**: Enables real-time data synchronization between server and display devices.
- **Device Management**: Tracks connected devices and their statuses.
- **Scheduled Tasks**: Runs periodic tasks to update device lists.

---

## Setup Instructions

### Prerequisites

- node version: 22.0.0

### Command

- npm install
- Ensure MongoDB is running and accessible.

### Environment Variables

Create a `.env` file in the root directory and define:

PORT=5000
MONGO_URI=mongodb://your-mongodb-url

### Running the Server

Start the backend server using:

- npm run start

The server will run on the port specified in `.env` (default: `5000`).

## Application Workflow

### Server Initialization

1. The server starts by:

   - Connecting to MongoDB using `connectDB()`.
   - Setting up Express middleware (`cors`, `express.json`).
   - Defining API routes for screen management.
   - Creating a Socket namespace (`/data-sync`) for real-time communication.

2. The Socket server listens for connections and device-related events.

### Device & Screen Management

1. **Device Connection & Tracking**

   - Each connected device is assigned a unique socket ID.
   - Devices are added to `connectedDevices` list with `status: 'online'`.
   - A cron job runs every minute to remove inactive devices.

2. **Screen Data Operations**

   - `get-all-screens`: Fetches all screens from the database.
   - `add-screen`: Adds a new screen with associated content.
   - `update-screen`: Updates an existing screen’s details.
   - `delete-screen`: Deletes a screen from the database.

3. **Content Syncing**

   - `request-content`: A device requests content for a specific screen.
   - `sync-screen-with-devices`: Syncs content to all devices linked to a screen ID.
   - `update-content`: Sends updated screen content to connected devices.

4. **Device Disconnection Handling**
   - When a device disconnects, its status is marked as `offline`.
   - The updated device list is broadcasted to all connected clients.

---

## API Endpoints

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/screens`     | Fetch all screens |
| POST   | `/api/screens`     | Add a new screen  |
| PUT    | `/api/screens/:id` | Update a screen   |
| DELETE | `/api/screens/:id` | Delete a screen   |

---

## Troubleshooting

- **Server Not Starting**:

  - Ensure `MONGO_URI` is correctly configured and MongoDB is running.
  - Run `npm install` to ensure dependencies are installed.
  - Check logs for database connection errors.

- **Socket Issues**:

  - Verify `SOCKET_URL` is correct.
  - Check if the Socket server is running and accessible.
  - Look for `connect_error` events in logs.

- **Content Not Updating on Devices**:
  - Ensure the device is connected (`status: 'online'`).
  - Restart the Electron app to trigger a fresh sync.
  - Check logs to confirm `update-content` events are being emitted.

---

## Future Improvements

- Implement authentication and authorization for API endpoints.
- Enhance error handling for MongoDB operations.
- Introduce logging and monitoring for better debugging.
- Extend content support to include videos and widgets.
