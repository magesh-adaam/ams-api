import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Setting } from "../entities/Setting";

const settingRepository = AppDataSource.getRepository(Setting);

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingRepository.find();
    // Convert array of {key, value} to an object map
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body; // Expected format: { "logoUrl": "...", "appName": "..." }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    const keys = Object.keys(updates);
    const settingsToSave: Setting[] = [];

    for (const key of keys) {
      const setting = new Setting();
      setting.key = key;
      setting.value = String(updates[key]);
      settingsToSave.push(setting);
    }

    // Save all (this will insert or update because key is PrimaryColumn)
    await settingRepository.save(settingsToSave);

    // Fetch the updated map
    const updatedSettings = await settingRepository.find();
    const settingsMap: Record<string, string> = {};
    updatedSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json(settingsMap);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};
