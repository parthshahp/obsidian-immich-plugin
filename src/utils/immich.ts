import {ImmichDailySettings} from "../settings";

export function hasImmichCredentials(settings: ImmichDailySettings) {
	return settings.baseUrl.trim().length > 0 && settings.apiKey.trim().length > 0;
}

export function normalizeBaseUrl(baseUrl: string) {
	return baseUrl.replace(/\/+$/, "");
}

export function resolveWebBaseUrl(baseUrl: string, webBaseUrl: string) {
	if (webBaseUrl.trim().length > 0) {
		return normalizeBaseUrl(webBaseUrl);
	}
	return normalizeBaseUrl(baseUrl);
}
