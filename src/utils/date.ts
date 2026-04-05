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
	if (periodicNotes?.settings?.daily?.enabled) {
		const { format, folder } = periodicNotes.settings.daily;
		if (format) {
			return { format: format ?? "YYYY-MM-DD", folder: folder ?? "" };
		}
	}

	// Fall back to core Daily Notes plugin
	const dailyNotes = appWithPlugins.internalPlugins?.getPluginById("daily-notes");
	if (dailyNotes?.enabled) {
		const { format, folder } = dailyNotes.instance?.options ?? {};
		return { format: format ?? "YYYY-MM-DD", folder: folder ?? "" };
	}

	return null;
}

export function parseDateFromDailyNoteFile(
	app: App,
	file: TFile,
	fallbackDateFormat: string,
	folderOverride = "",
): ReturnType<typeof moment> | null {
	const fileFolder = file.parent?.path ?? "";

	// If the user has specified an explicit folder, enforce it directly
	if (folderOverride.trim().length > 0) {
		const normalized = folderOverride.trim().replace(/\/$/, "");
		if (fileFolder !== normalized) {
			return null;
		}
		return parseDateFromTitle(file.basename, fallbackDateFormat);
	}

	const dailySettings = getDailyNoteSettings(app);

	if (dailySettings) {

		// Try configured format first, then fall back to generic patterns.
		// The folder check above is the real guard; the format is best-effort.
		if (dailySettings.format) {
			const parsed = moment(file.basename, dailySettings.format, true);
			if (parsed.isValid()) return parsed;
		}
		return parseDateFromTitle(file.basename, fallbackDateFormat);
	}

	// No daily notes plugin found — fall back to the user's custom format setting
	return parseDateFromTitle(file.basename, fallbackDateFormat);
}

export function formatDateForDisplay(date: moment.Moment) {
	return date.format("YYYY-MM-DD");
}
