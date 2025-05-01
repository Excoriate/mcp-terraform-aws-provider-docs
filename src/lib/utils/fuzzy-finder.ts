// Normalise AWS resource name or subcategory for robust matching.
// - Lowercase
// - Remove "aws" and "amazon" prefixes
// - Remove all non-alphanumeric characters
export function normaliseAWSResourceNameOrSubcategory(input: string): string {
	return input
		.toLowerCase()
		.replace(/^(aws|amazon)[ _-]?/i, "")
		.replace(/[^a-z0-9]/g, "");
}

// Levenshtein distance implementation for fuzzy matching
export function levenshtein(a: string, b: string): number {
	const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
		Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : i)),
	);
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			if (a[i - 1] === b[j - 1]) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1, // deletion
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j - 1] + 1, // substitution
				);
			}
		}
	}
	return matrix[a.length][b.length];
}

// Fuzzy match function: returns the best match and its index if within threshold, else null
export function findBestFuzzyMatch(
	target: string,
	candidates: string[],
	threshold: 3,
): { match: string; index: number; distance: number } | null {
	let minDist = Number.POSITIVE_INFINITY;
	let bestIndex = -1;
	for (let i = 0; i < candidates.length; i++) {
		const dist = levenshtein(target, candidates[i]);
		if (dist < minDist) {
			minDist = dist;
			bestIndex = i;
		}
	}
	if (minDist <= threshold && bestIndex !== -1) {
		return {
			match: candidates[bestIndex],
			index: bestIndex,
			distance: minDist,
		};
	}
	return null;
}

// Remove "aws-" or "aws_" prefix from file name
export function removeAwsPrefixFromFileName(fileName: string): string {
	return fileName.replace(/^aws[-_]/, "");
}
