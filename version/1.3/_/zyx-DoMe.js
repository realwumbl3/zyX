export function doMe(type) {
	return ({ that = {}, element, id, cls, style, props, attr, innerText, innerHTML, append, assign, evt, passive, appendTo, place, user } = {}) => {
		if (type) element = document.createElement(type || "div");

		if (id) element.id = id;

		if (cls)
			if (typeof cls === "object") for (let x of cls) element.classList.add(x);
			else element.classList.add(cls);

		if (attr) for (let [key, value] of Object.entries(attr)) element.setAttribute(key, value);

		if (innerText) element.innerText = innerText;

		if (innerHTML) element.innerHTML = innerHTML;

		if (style) Object.assign(element.style, style);

		if (props) for (let [key, val] of Object.entries(props)) element.style.setProperty(key, val);

		if (evt) for (let [key, val] of Object.entries(evt)) element.addEventListener(key, val, passive ? { passive: true } : null);

		if (appendTo) appendTo.append(element);

		if (append) for (let val of append) element.append(val);

		if (assign) Object.assign(element, assign);

		if (place)
			if (typeof place === "string") document.querySelector(`ph[${place}]`).replaceWith(element);
			else if (typeof place === "object") place.replaceWith(element);

		if (user && is_signed_in()) element.classList.add("loggedin");

		return element;
	};
}
