import { MarkdownView, Notice } from "obsidian";
import ImmichDailyCarouselPlugin from "../main";
import { insertImmichCarousel } from "./insert-immich-carousel";
import { searchCache, thumbnailCache } from "../utils/cache";

export function registerCommands(plugin: ImmichDailyCarouselPlugin) {
	plugin.addCommand({
		id: "insert-immich-carousel",
		name: "Insert Immich carousel",
		editorCallback: (editor, view) => {
			if (!(view instanceof MarkdownView)) {
				new Notice("Open a Markdown note to insert the carousel.");
				return;
			}
			insertImmichCarousel(plugin, editor, view);
		},
	});

	plugin.addCommand({
		id: "clear-immich-cache",
		name: "Clear Immich cache",
		callback: () => {
			const searchCount = searchCache.size;
			const thumbCount = thumbnailCache.size;
			searchCache.clear();
			thumbnailCache.clear();
			new Notice(`Cleared Immich cache (${searchCount} searches, ${thumbCount} thumbnails).`);
		},
	});
}
