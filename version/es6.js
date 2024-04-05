export const { root, version } = getBaseMeta()
console.log("[ZyX] Version:", version, "BaseDir:", root);

export function getBaseMeta() {
	return { root: import.meta.url, version: import.meta.url.split("/").slice(-2)[0] }
}
