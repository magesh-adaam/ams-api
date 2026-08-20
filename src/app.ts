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

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
  try {
    await ensureDatabaseExists();
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("[Database] Connected successfully to PostgreSQL database.");
    }

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  CAFMS Backend Server Running Locally   `);
      console.log(`  URL: http://localhost:${PORT}          `);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"} `);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error("Critical: Server initialization failed:", error);
    process.exit(1);
  }
}

// Only start the server if not running in a Serverless environment (like Vercel)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  startServer();
}

export default app;
