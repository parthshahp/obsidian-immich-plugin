import { App, TFile, moment } from "obsidian";

const DATE_PATTERNS: string[] = ["YYYY-MM-DD", "YYYY.MM.DD", "YYYY/MM/DD"];

export function parseDateFromTitle(title: string, dateFormat: string) {
	if (dateFormat.trim().length > 0) {
		const parsed = moment(title, dateFormat, true);
		if (parsed.isValid()) {
			return parsed;
		}
	}

	for (const pattern of DATE_PATTERNS) {
		const parsed = moment(title, pattern, true);
		if (parsed.isValid()) {
			return parsed;
		}
	}

	return null;
}

interface DailyNoteSettings {
	format: string;
	folder: string;
}

interface PeriodicNotesPlugin {
	settings?: {
		daily?: {
			enabled?: boolean;
			format?: string;
			folder?: string;
		};
	};
}

interface DailyNotesInstance {
	options?: {
		format?: string;
		folder?: string;
	};
}

interface DailyNotesPlugin {
	enabled?: boolean;
	instance?: DailyNotesInstance;
}

interface AppWithPlugins extends App {
	plugins?: {
		getPlugin(id: string): PeriodicNotesPlugin | null;
	};
	internalPlugins?: {
		getPluginById(id: string): DailyNotesPlugin | null;
	};
}

function getDailyNoteSettings(app: App): DailyNoteSettings | null {
	const appWithPlugins = app as AppWithPlugins;

	// Try community Periodic Notes plugin first
	const periodicNotes = appWithPlugins.plugins?.getPlugin("periodic-notes");
	console.log("[Immich] periodic-notes plugin:", periodicNotes);
	if (periodicNotes?.settings?.daily?.enabled) {
		const { format, folder } = periodicNotes.settings.daily;
		if (format) {
			const result = { format: format ?? "YYYY-MM-DD", folder: folder ?? "" };
			console.log("[Immich] using periodic-notes settings:", result);
			return result;
		}
	}

	// Fall back to core Daily Notes plugin
	const dailyNotes = appWithPlugins.internalPlugins?.getPluginById("daily-notes");
	console.log("[Immich] daily-notes plugin:", dailyNotes, "enabled:", dailyNotes?.enabled);
	if (dailyNotes?.enabled) {
		const { format, folder } = dailyNotes.instance?.options ?? {};
		const result = { format: format ?? "YYYY-MM-DD", folder: folder ?? "" };
		console.log("[Immich] using daily-notes settings:", result);
		return result;
	}

	console.log("[Immich] no daily notes plugin found");
	return null;
}

export function parseDateFromDailyNoteFile(
	app: App,
	file: TFile,
	fallbackDateFormat: string,
): ReturnType<typeof moment> | null {
	console.log("[Immich] parseDateFromDailyNoteFile:", file.basename, "parent:", file.parent?.path);
	const dailySettings = getDailyNoteSettings(app);

	if (dailySettings) {
		// Check the file is in the configured daily notes folder
		const folder = dailySettings.folder.replace(/\/$/, "");
		const fileFolder = file.parent?.path ?? "";
		console.log("[Immich] folder check — configured:", JSON.stringify(folder), "file folder:", JSON.stringify(fileFolder));
		if (folder.length > 0 && fileFolder !== folder) {
			console.log("[Immich] folder mismatch, skipping");
			return null;
		}

		// Try configured format first, then fall back to generic patterns.
		// The folder check above is the real guard; the format is best-effort.
		if (dailySettings.format) {
			const parsed = moment(file.basename, dailySettings.format, true);
			console.log("[Immich] strict format parse (", dailySettings.format, "):", parsed.isValid());
			if (parsed.isValid()) return parsed;
		}
		console.log("[Immich] falling back to generic patterns");
		return parseDateFromTitle(file.basename, fallbackDateFormat);
	}

	// No daily notes plugin found — fall back to the user's custom format setting
	console.log("[Immich] no plugin, falling back to parseDateFromTitle");
	return parseDateFromTitle(file.basename, fallbackDateFormat);
}

export function formatDateForDisplay(date: moment.Moment) {
	return date.format("YYYY-MM-DD");
}
