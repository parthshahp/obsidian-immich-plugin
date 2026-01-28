import { Editor, MarkdownView, Notice } from "obsidian";
import ImmichDailyCarouselPlugin from "../main";
import { parseDateFromTitle } from "../utils/date";
import { hasImmichCredentials } from "../utils/immich";

const CAROUSEL_BLOCK = "```immich-carousel\n```";

export function insertImmichCarousel(
	plugin: ImmichDailyCarouselPlugin,
	editor: Editor,
	view: MarkdownView,
) {
	if (!hasImmichCredentials(plugin.settings)) {
		new Notice("Set your Immich base URL and API key in settings first.");
		return;
	}

	const file = view.file;
	if (!file) {
		new Notice("No active file found.");
		return;
	}

	const date = parseDateFromTitle(file.basename, plugin.settings.dateFormat);
	if (!date) {
		new Notice("Could not parse a date from the note title.");
		return;
	}

	const cursor = editor.getCursor();
	const prefix = editor.getLine(cursor.line).length === 0 ? "" : "\n";
	editor.replaceRange(`${prefix}${CAROUSEL_BLOCK}\n`, cursor);
}
