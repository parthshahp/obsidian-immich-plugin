import { MarkdownView, TFile } from "obsidian";
import ImmichDailyCarouselPlugin from "../main";
import { parseDateFromTitle } from "../utils/date";
import { hasImmichCredentials } from "../utils/immich";

const CAROUSEL_BLOCK = "```immich-carousel\n```";

export function registerAutoInsert(plugin: ImmichDailyCarouselPlugin) {
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", async (file) => {
			if (!file || !(file instanceof TFile)) {
				return;
			}
			if (!plugin.settings.autoInsertDailyNote) {
				return;
			}
			if (!hasImmichCredentials(plugin.settings)) {
				return;
			}

			const date = parseDateFromTitle(
				file.basename,
				plugin.settings.dateFormat,
			);
			if (!date) {
				return;
			}

			const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view || view.file?.path !== file.path) {
				return;
			}

			const content = await plugin.app.vault.read(file);
			if (content.includes(CAROUSEL_BLOCK)) {
				return;
			}

			const placeholder = plugin.settings.templatePlaceholder.trim();
			if (placeholder.length > 0 && content.includes(placeholder)) {
				const updated = content.split(placeholder).join(CAROUSEL_BLOCK);
				await plugin.app.vault.modify(file, updated);
				return;
			}

			const insertionTarget = resolveInsertionTarget(content);
			if (!insertionTarget.shouldInsert) {
				return;
			}

			const editor = view.editor;
			const insertion = insertionTarget.insertAfterFrontmatter
				? `\n${CAROUSEL_BLOCK}\n`
				: `${CAROUSEL_BLOCK}\n`;
			const cursor = insertionTarget.insertAfterFrontmatter
				? { line: insertionTarget.frontmatterEndLine, ch: 0 }
				: { line: 0, ch: 0 };
			editor.replaceRange(insertion, cursor);
		}),
	);
}

function resolveInsertionTarget(content: string) {
	const trimmed = content.trim();
	if (trimmed.length === 0) {
		return {
			shouldInsert: true,
			insertAfterFrontmatter: false,
			frontmatterEndLine: 0,
		};
	}

	if (!trimmed.startsWith("---")) {
		return {
			shouldInsert: false,
			insertAfterFrontmatter: false,
			frontmatterEndLine: 0,
		};
	}

	const lines = content.split("\n");
	let frontmatterEnd = -1;
	for (let i = 1; i < lines.length; i += 1) {
		const line = lines[i];
		if (line && line.trim() === "---") {
			frontmatterEnd = i + 1;
			break;
		}
	}

	if (frontmatterEnd === -1) {
		return {
			shouldInsert: false,
			insertAfterFrontmatter: false,
			frontmatterEndLine: 0,
		};
	}

	const rest = lines.slice(frontmatterEnd).join("\n").trim();
	if (rest.length > 0) {
		return {
			shouldInsert: false,
			insertAfterFrontmatter: false,
			frontmatterEndLine: 0,
		};
	}

	return {
		shouldInsert: true,
		insertAfterFrontmatter: true,
		frontmatterEndLine: frontmatterEnd,
	};
}
