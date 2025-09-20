# Copilot Instructions for best-wishes-final

## Project Overview
This is a full-stack event and gifting platform with a Next.js frontend (`frontend/`) and a Node.js/Express backend (`backend/`). The backend uses MongoDB (via Mongoose), integrates with Stripe for payments, Cloudinary for media, and has modular controllers/routes for features like authentication, collaborative purchases, delivery, and notifications.

## Architecture & Data Flow
- **Frontend**: Built with Next.js, using React components and hooks. UI primitives are in `frontend/src/components/ui/`. Pages are organized by user roles (e.g., `(admin)`, `(deliveryStaff)`). Data is fetched via REST APIs from the backend.
- **Backend**: Express app (`backend/app.js`) loads routes from `backend/routes/`, each mapped to a controller in `backend/controllers/`. Models are in `backend/models/`. Middleware handles auth, error handling, uploads, and validation.
- **Config**: Environment variables are loaded via `dotenv`. Key configs are in `backend/config/` (e.g., `db.js`, `cloudinary.js`, `emailConfig.js`).

## Developer Workflows
- **Start Backend**: `node backend/server.js` (ensure MongoDB and required env vars are set)
- **Start Frontend**: `npm run dev` in `frontend/` (Next.js dev server)
- **Build Frontend**: `npm run build` in `frontend/`
- **Deploy**: Frontend is Vercel-ready; backend can be deployed to any Node.js host.
- **Testing**: No standard test runner detected; add tests in `__tests__` or similar if needed.

## Conventions & Patterns
- **Controllers/Routes**: Each feature (auth, cart, event, etc.) has its own controller and route file. Example: `backend/routes/authRoutes.js` → `backend/controllers/authController.js`.
- **Models**: Mongoose schemas in `backend/models/` (e.g., `User.js`, `Order.js`).
- **Utils**: Shared logic (token generation, email sending, reminders) in `backend/utils/`.
- **Frontend UI**: Use primitives from `frontend/src/components/ui/` for consistency. State managed via React hooks; some Redux usage detected.
- **Role-based Pages**: Admin, delivery staff, and other roles have separate page folders under `frontend/src/app/`.

## Integration Points
- **Stripe**: Payment logic uses `STRIPE_SECRET_KEY` (see backend `.env`).
- **Cloudinary**: Media uploads configured in `backend/config/cloudinary.js`.
- **Email**: Email sending via config in `backend/config/emailConfig.js` and utils in `backend/utils/sendEmail.js`.
- **Authentication**: JWT-based, with middleware in `backend/middleware/authMiddleware.js`.

## Examples
- To add a new feature, create a model, controller, route, and update frontend API calls.
- For a new UI component, add to `frontend/src/components/ui/` and import in relevant page.
- For backend config, update or add to `backend/config/` and reference via `process.env`.

## References
- See `frontend/README.md` for Next.js usage and deployment.
- See `backend/app.js` for backend entrypoint and route wiring.
- See `backend/routes/` and `backend/controllers/` for feature structure.

---

**If any section is unclear or missing, please provide feedback so this guide can be improved.**
