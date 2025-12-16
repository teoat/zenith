
---
description: Verify AI Endpoints Security
---

1. Start the backend server
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --port 8000
   ```

2. Start the frontend
   ```bash
   cd frontend
   npm run dev
   ```

3. Verification Steps:
   - Go to AI Assistant.
   - Send a message.
   - Verify network request has `Authorization: Bearer ...` header.
   - Verify response is 200 OK.
   - Verify unauthorized request (via curl without token) returns 401.

   Example Curl:
   ```bash
   curl -X POST "http://localhost:8000/ai/chat" -H "Content-Type: application/json" -d '{"message": "hello", "context": {}, "persona": "frenly"}'
   ```
   Should return 401 Unauthorized.
