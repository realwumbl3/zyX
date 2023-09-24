export const zyxCookie = {};

zyxCookie.get = (cname, defaultVal) => {
	const name = cname + "=",
		decodedCookie = decodeURIComponent(document.cookie),
		ca = decodedCookie.split(";");
	if (!decodedCookie.includes(cname)) {
		zyxCookie.set(cname, defaultVal);
		return defaultVal;
	}
	for (let i in ca) {
		let c = ca[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			let cookie = c.substring(name.length, c.length);
			return cookie === "true" || cookie === "false" ? cookie === "true" : cookie;
		}
	}
	return "";
};

zyxCookie.set = (cname, cvalue, exdays) => {
	const d = new Date();
	if (exdays) d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	else d.setTime(d.getTime() + 9999 * 24 * 60 * 60 * 1000);
	const expires = "expires=" + d.toUTCString();
	document.cookie = `${cname}=${cvalue};${expires};path=/`;
};
