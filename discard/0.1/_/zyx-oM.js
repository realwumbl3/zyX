// Object Markup

import { zyxMagic, placeObject } from "./zyx-Magic.js";

const returnMethods = (scope, markup) => {
	return {
		appendTo: (target) => {
			target.append(markup);
			return returnMethods(scope, markup);
		},
		prependTo: (target) => {
			target.prepend(markup);
			return returnMethods(scope, markup);
		},
		place: (place) => {
			placeObject(markup, place);
			return returnMethods(scope, markup);
		},
		placeFunc: (callback) => {
			callback(markup);
		},
		markup: function () {
			return markup;
		},
		output: function () {
			return output;
		},
		with: (_) => {
			return _(scope, markup);
		},
		touch: (_) => {
			return {
				..._(scope, markup),
				...scope,
				...returnMethods(scope, markup),
			};
		},
	};
};

export function oM(that) {
	return function (htme) {
		if (!that) that = {};
		const zyxMagicScope = zyxMagic(that, htme);
		const { scope, markup } = zyxMagicScope;
		return returnMethods(scope, markup);
	};
}
