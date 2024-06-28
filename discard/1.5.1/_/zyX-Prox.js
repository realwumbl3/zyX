export class typeProxy {
	constructor(proxyName, proxyType, node) {
		this.keyname = proxyName;
		this.type = proxyType;
		this.node = node;
		this.setType = "textContent";
		this.value = this.setValue(node.textContent);
	}

	set(val) {
		const set = this.setValue(val);
		if (set === null || set === undefined) return true;
		this.updateNode();
		return true;
	}

	setValue(val) {
		if (val === this.value) return false;
		if (typeof val === this.type) return (this.value = val);
		switch (this.type) {
			case "number":
				return (this.value = Number(val));
			case "string":
				return (this.value = `${val}`);
		}
		return true;
	}

	updateNode() {
		switch (this.setType) {
			case "textContent":
				this.node.textContent = this.value;
				break;
			case "HTML":
				this.node.innerHTML = this.value;
				break;
		}
	}
}

export const pr0x = (raw, ...data) => {
	const [name] = raw;
	return (def, ...options) => {
		const type = typeof def;
		const attrList = readHtmlOptions(options);
		return `<span ${attrList} pr0x${type === "string" ? "" : `-${type}`}="${name}">${def}</span>`;
	};
};

function readHtmlOptions(options) {
	let string = "";
	for (const option of options) {
		let [key, val] = option.split("=");
		string += key += `="${val}" `;
	}
	return string;
}

/*

HTML: pr0x`<haha>`("")

Place: pr0x`|haha|`(node)

Node: prox`:nodeName:`(node)

String: pr0x`haha`("")

Number: pr0x`haha`(0)

*/
