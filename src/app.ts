import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dotenv from "dotenv";
import { ensureDatabaseExists, AppDataSource } from "./config/data-source";
import { seedDatabase } from "./utils/db-seed";
import userRoutes from "./routes/userRoutes";
import facilityRoutes from "./routes/facilityRoutes";
import blockRoutes from "./routes/blockRoutes";
import authRoutes from "./routes/authRoutes";
import roleRoutes from "./routes/roleRoutes";
import levelRoutes from "./routes/levelRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import userLocationRoutes from "./routes/userLocationRoutes";
import assetClassificationRoutes from "./routes/assetClassificationRoutes";
import assetTypeRoutes from "./routes/assetTypeRoutes";
import assetRoutes from "./routes/assetRoutes";
import ppmChecklistRoutes from "./routes/ppmChecklistRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import path from "path";

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let startupError: any = null;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow localhost and vercel apps
      if (origin.includes("localhost") || origin.includes("vercel.app") || origin === process.env.CORS_ORIGIN) {
        return callback(null, true);
      }
      // Alternatively, allow all origins in dev/staging (you can make this stricter for prod)
      return callback(null, true);
    },
    credentials: true,
  })
);

// Logging Middleware
app.use(morgan("dev"));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless DB Connection Middleware
app.use(async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("[Database] Connected successfully to PostgreSQL database (Serverless).");
    }
    next();
  } catch (error) {
    console.error("Critical: Serverless database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Serve Static Files (Uploads)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Health Check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// Sample/Mock Data for testing connection with frontend
app.get("/api/dashboard/summary", (req: Request, res: Response) => {
  res.status(200).json({
    stats: {
      facilities: 24,
      activeAssets: 12482,
      pendingWorkOrders: 156,
      staffCount: 842,
    },
    recentOperations: [
      { id: "#WO-8821", category: "Asset Maint", action: "PPM Checklist Update", assignedTo: "Robert Chen", status: "IN PROGRESS" },
      { id: "#LO-4412", category: "Location", action: "New Ward Mapping", assignedTo: "Alice Wright", status: "COMPLETED" },
      { id: "#HR-1092", category: "Staff Reg", action: "User Training Log", assignedTo: "James Wilson", status: "PENDING" },
      { id: "#WO-8819", category: "Work Order", action: "Safety SHE Audit", assignedTo: "Sarah Jenkins", status: "URGENT" },
      { id: "#DC-5510", category: "Registry", action: "ISO Certification Ref", assignedTo: "System Auto", status: "ARCHIVED" },
    ],
  });
});

// User Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/user-locations", userLocationRoutes);
app.use("/api/asset-classifications", assetClassificationRoutes);
app.use("/api/asset-types", assetTypeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/ppm-checklists", ppmChecklistRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);

// Root Route - API Status Page
app.get("/", (req: Request, res: Response) => {
  const env = process.env.NODE_ENV || "development";
  const routes = [
    "/api/health", "/api/dashboard/summary", "/api/auth", "/api/users", 
    "/api/facilities", "/api/blocks", "/api/levels", "/api/departments", 
    "/api/user-locations", "/api/asset-classifications", "/api/asset-types", 
    "/api/assets", "/api/roles", "/api/ppm-checklists", "/api/settings", "/api/upload"
  ];

  let statusHtml = "";
  if (startupError) {
    statusHtml = `
      <div class="status-container error-border">
        <div class="dot error-dot"></div>
        <div class="text error-text">API Status: OFFLINE</div>
      </div>
      <div class="error-box">
        <strong>Database Connection Error:</strong><br/>
        ${startupError.message || startupError}
      </div>
    `;
  } else {
    statusHtml = `
      <div class="status-container">
        <div class="dot"></div>
        <div class="text">API Status: HEALTHY (${env})</div>
      </div>
      <div class="routes-container">
        <h3>Available API Routes</h3>
        <ul>
          ${routes.map(r => `<li><a href="${r}">${r}</a></li>`).join("")}
        </ul>
      </div>
    `;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Status</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 20px;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 600px;
          width: 100%;
        }
        .status-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
        }
        .error-border { border-color: #fca5a5; }
        .dot {
          width: 14px;
          height: 14px;
          background-color: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(34,197,94,0.6);
        }
        .error-dot {
          background-color: #ef4444;
          box-shadow: 0 0 8px rgba(239,68,68,0.6);
        }
        .text {
          color: #16a34a;
          font-weight: 600;
          font-size: 18px;
        }
        .error-text { color: #dc2626; }
        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 16px;
          border-radius: 8px;
          color: #991b1b;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .routes-container {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
        }
        .routes-container h3 {
          margin-top: 0;
          color: #334155;
          font-size: 16px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .routes-container ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
        }
        .routes-container li a {
          color: #3b82f6;
          text-decoration: none;
          font-size: 14px;
        }
        .routes-container li a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${statusHtml}
      </div>
    </body>
    </html>
  `);
});

// Fallback Route
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize DB and Seed before starting (Local Development Only)
async function startServer() {
  // Start server first so it can serve the status page even if DB connection fails
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  CAFMS Backend Server Running Locally   `);
    console.log(`  URL: http://localhost:${PORT}          `);
    console.log(`  Environment: ${process.env.NODE_ENV || "development"} `);
    console.log(`=========================================`);
  });

  try {
    await ensureDatabaseExists();
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("[Database] Connected successfully to PostgreSQL database.");
    }

    await seedDatabase();
  } catch (error: any) {
    console.error("Critical: Server initialization failed:", error);
    startupError = error;
    // We intentionally do not process.exit(1) here so the Express server stays running
    // to display the error on the root page.
  }
}

// Only start the server if not running in a Serverless environment (like Vercel)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  startServer();
}

export default app;
