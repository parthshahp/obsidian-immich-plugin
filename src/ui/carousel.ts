import {
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Notice,
	TFile,
} from "obsidian";
import ImmichDailyCarouselPlugin from "../main";
import {
	searchAssetsForDate,
	fetchAssetThumbnail,
	isRenderableAsset,
} from "../immich/api";
import { parseDateFromTitle, formatDateForDisplay } from "../utils/date";
import { hasImmichCredentials, resolveWebBaseUrl } from "../utils/immich";

interface CarouselOptions {
	date?: string;
}

class CarouselCleanup extends MarkdownRenderChild {
	private cleanupFns: Array<() => void>;

	constructor(containerEl: HTMLElement, cleanupFns: Array<() => void>) {
		super(containerEl);
		this.cleanupFns = cleanupFns;
	}

	onunload() {
		for (const fn of this.cleanupFns) {
			fn();
		}
	}
}

export function registerCarouselProcessor(plugin: ImmichDailyCarouselPlugin) {
	plugin.registerMarkdownCodeBlockProcessor(
		"immich-carousel",
		async (source, el, ctx) => {
			if (!hasImmichCredentials(plugin.settings)) {
				renderMessage(
					el,
					"Set your Immich base URL and API key in settings to load photos.",
				);
				return;
			}

			const options = parseOptions(source);
			const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
			const title = file instanceof TFile ? file.basename : "";
			const date = options.date
				? parseDateFromTitle(options.date, "YYYY-MM-DD")
				: parseDateFromTitle(title, plugin.settings.dateFormat);

			if (!date) {
				renderMessage(el, "Could not determine a date for this note.");
				return;
			}

			const startIso = date.clone().startOf("day").toISOString();
			const endIso = date.clone().endOf("day").toISOString();

			let assets;
			try {
				assets = await searchAssetsForDate(
					plugin.settings,
					startIso,
					endIso,
				);
			} catch (error) {
				renderMessage(
					el,
					"Immich request failed. Check your settings and server availability.",
				);
				console.error("Immich carousel search failed", error);
				return;
			}

			const visibleAssets = assets.filter((asset) =>
				isRenderableAsset(asset),
			);
			if (visibleAssets.length === 0) {
				renderMessage(
					el,
					`No assets found for ${formatDateForDisplay(date)}.`,
				);
				return;
			}

			await renderCarousel(
				plugin,
				el,
				ctx,
				visibleAssets,
				formatDateForDisplay(date),
			);
		},
	);
}

function parseOptions(source: string): CarouselOptions {
	const options: CarouselOptions = {};
	const lines = source.split("\n");
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || !line.includes(":")) {
			continue;
		}
		const [key, ...rest] = line.split(":");
		if (!key) {
			continue;
		}
		const value = rest.join(":").trim();
		if (key.trim() === "date" && value) {
			options.date = value;
		}
	}
	return options;
}

async function renderCarousel(
	plugin: ImmichDailyCarouselPlugin,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	assets: Array<{ id: string; originalFileName?: string }>,
	label: string,
) {
	const wrapper = el.createDiv({ cls: "immich-carousel-wrapper" });
	wrapper.style.setProperty(
		"--immich-carousel-thumb-size",
		`${plugin.settings.thumbnailSizePx}px`,
	);
	const header = wrapper.createDiv({ cls: "immich-carousel-header" });
	header.setText(`Immich • ${label} • ${assets.length} items`);

	const webBaseUrl = resolveWebBaseUrl(
		plugin.settings.baseUrl,
		plugin.settings.webBaseUrl,
	);
	const assetTemplate =
		plugin.settings.assetUrlTemplate.trim().length > 0
			? plugin.settings.assetUrlTemplate.trim()
			: `${webBaseUrl}/photos/{{assetId}}`;
	const dayTemplate =
		plugin.settings.dayUrlTemplate.trim().length > 0
			? plugin.settings.dayUrlTemplate.trim()
			: `${webBaseUrl}/photos?timelineDate={{date}}`;

	if (webBaseUrl.length > 0) {
		const dayUrl = applyTemplate(dayTemplate, {
			baseUrl: webBaseUrl,
			date: label,
		});
		const link = header.createEl("a", {
			cls: "immich-carousel-day-link",
			text: "Open in Immich",
		});
		link.href = dayUrl;
		link.target = "_blank";
		link.rel = "noopener";
	}

	const carousel = wrapper.createDiv({ cls: "immich-carousel" });
	const track = carousel.createDiv({ cls: "immich-carousel-track" });
	const status = wrapper.createDiv({
		cls: "immich-carousel-status",
		text: "Loading photos…",
	});

	const objectUrls: string[] = [];
	const cleanupFns: Array<() => void> = [
		() => objectUrls.forEach((url) => URL.revokeObjectURL(url)),
	];

	const updateScrollState = () => {
		const maxScroll = track.scrollWidth - track.clientWidth;
		const canScrollLeft = track.scrollLeft > 1;
		const canScrollRight = track.scrollLeft < maxScroll - 1;
		const hasOverflow = maxScroll > 1;
		carousel.toggleClass("immich-carousel-overflow", hasOverflow);
		carousel.toggleClass("immich-carousel-no-overflow", !hasOverflow);
		carousel.toggleClass("immich-carousel-can-scroll-left", canScrollLeft);
		carousel.toggleClass(
			"immich-carousel-can-scroll-right",
			canScrollRight,
		);
	};

	const resizeObserver = new ResizeObserver(updateScrollState);
	resizeObserver.observe(track);
	cleanupFns.push(() => resizeObserver.disconnect());
	track.addEventListener("scroll", updateScrollState, { passive: true });
	cleanupFns.push(() =>
		track.removeEventListener("scroll", updateScrollState),
	);

	ctx.addChild(new CarouselCleanup(wrapper, cleanupFns));

	let failed = 0;
	await mapWithConcurrency(assets, 4, async (asset) => {
		try {
			const blob = await fetchAssetThumbnail(plugin.settings, asset.id);
			const url = URL.createObjectURL(blob);
			objectUrls.push(url);

			const item = track.createDiv({ cls: "immich-carousel-item" });
			const assetUrl =
				webBaseUrl.length > 0
					? applyTemplate(assetTemplate, {
							baseUrl: webBaseUrl,
							assetId: asset.id,
						})
					: "";
			const container =
				assetUrl.length > 0
					? item.createEl("a", { cls: "immich-carousel-item-link" })
					: item;
			if (assetUrl.length > 0) {
				const anchor = container as HTMLAnchorElement;
				anchor.href = assetUrl;
				anchor.target = "_blank";
				anchor.rel = "noopener";
			}
			const img = container.createEl("img");
			img.src = url;
			img.alt = asset.originalFileName ?? "Immich asset";
			img.loading = "lazy";
		} catch (error) {
			failed += 1;
			const item = track.createDiv({
				cls: "immich-carousel-item immich-carousel-item-error",
			});
			item.setText("Failed to load");
			console.error("Immich carousel thumbnail failed", error);
		}
	});

	track.scrollLeft = 0;
	updateScrollState();

	status.remove();
	if (failed > 0) {
		new Notice(`Immich carousel: ${failed} item(s) failed to load.`);
	}
}

async function mapWithConcurrency<T>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<void>,
) {
	const queue = [...items];
	const runners: Promise<void>[] = [];

	const runNext = async () => {
		const item = queue.shift();
		if (!item) {
			return;
		}
		await worker(item);
		await runNext();
	};

	for (let i = 0; i < Math.min(limit, items.length); i += 1) {
		runners.push(runNext());
	}

	await Promise.all(runners);
}

function renderMessage(el: HTMLElement, message: string) {
	const wrapper = el.createDiv({ cls: "immich-carousel-wrapper" });
	wrapper.createDiv({ cls: "immich-carousel-message", text: message });
}

function applyTemplate(template: string, values: Record<string, string>) {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
		const safeKey = String(key);
		return values[safeKey] ?? "";
	});
}
