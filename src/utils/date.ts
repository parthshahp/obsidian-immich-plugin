import {moment} from "obsidian";

const DATE_PATTERNS: RegExp[] = [
	/(\d{4})-(\d{2})-(\d{2})/,
	/(\d{4})\.(\d{2})\.(\d{2})/,
	/(\d{4})\/(\d{2})\/(\d{2})/,
];

export function parseDateFromTitle(title: string, dateFormat: string) {
	if (dateFormat.trim().length > 0) {
		const parsed = moment(title, dateFormat, true);
		if (parsed.isValid()) {
			return parsed;
		}
	}

	for (const pattern of DATE_PATTERNS) {
		const match = title.match(pattern);
		if (match) {
			const [_, year, month, day] = match;
			const parsed = moment(`${year}-${month}-${day}`, "YYYY-MM-DD", true);
			if (parsed.isValid()) {
				return parsed;
			}
		}
	}

	return null;
}

export function formatDateForDisplay(date: moment.Moment) {
	return date.format("YYYY-MM-DD");
}
