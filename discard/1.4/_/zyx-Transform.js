/*

zyxTransform v1.0 - developed by twitter.com/wumbl3
__________________________________________________________________________________

const test_element = document.createElement('div')                              //  LET'S CREATE A NEW ELEMENT TO DEMO THIS.
zyxTransform(test_element)                                                      //  WE CAN CALL THE BIND FUNCTION WITH THE ELEMENT AS THE ONLY PARAMETER

<div></div>                                                                     //  THIS IS OUR NEW ELEMENT, AFTER EACH SET I'LL DISPLAY THE CHANGES


test_element.set({
    scale: '2'                                                                  //  YOU CAN SET VALUES LIKE THIS
})

<div style="transform: scale(2);"></div>


test_element.set({
    rotate3D: '.5, 0, 0, 10deg',                                                //  SETTING A NEW VALUE WILL NOT REPLACE THE LAST ONES
})

<div style="transform: scale(2) rotate3D(.5, 0, 0, 10deg);"></div>


test_element.set({
    scale: '/=4'                                                                //  YOU CAN USE OPERATORS FOLLOWED BY = TO MANIPULATE THE CURENT VALUE
    rotate3D: '==, ==, 1, +=100deg',                                            //  USING == WILL LEAVE THE VALUE UNCHANGED
})

<div style="transform: scale(.5) rotate3D(.5, 0, 1, 110deg);"></div>


test_element.set({
    scale: null                                                                 //  YOU CAN REMOVE AN EXISTING TRANSFORM USING null
})

<div style="transform: rotate3D(.5, 0, 1, 110deg);"></div>


test_element.set(null)                                                          //  FINALLY YOU CAN REMOVE ALL TRANSFORMS USING null
    
<div style></div>                                                               //  THANKS FOR YOUR ATTENTION, ALSO WHILE YOU'RE HERE, PIPP IS BEST PONY.
__________________________________________________________________________________

TODO:
✅ Snapshots
    Save a state and restore it later.
- Error handling
- Caching current transforms instead of deconstructing on .set()

*/
export function zyxTransform(element) {
	const snapshots = {};
	let transforms = {};
	function snapshot(name) {
		snapshots[name] = { ...transforms };
	}
	function restore(name) {
		if (!(name in snapshots)) return false;
		set(null);
		set(snapshots[name]);
	}
	function set(transforms_obj) {
		if (transforms_obj === null) transforms = {};
		else
			for (let [new_key, new_val] of Object.entries(transforms_obj)) {
				if (new_val === null) {
					delete transforms[new_key];
					continue;
				}
				if (includesOperators(new_val)) new_val = operateOnTransform(transforms[new_key], new_val);
				transforms[new_key] = new_val;
			}
		element.style.transform = "";
		for (let [key, val] of Object.entries(transforms)) element.style.transform += `${key}(${val})`;
	}
	Object.assign(element, { set, snapshot, restore });
}

const includesOperators = (string_in) => string_in.match(/([-+*\/=][=])+/);

function modifierDecontruct(string_in) {
	try {
		if (string_in === "==") return [undefined, "", ""];
		const [, operator, value, unit] = /^([-+*\/][=])?([-+.0-9]+)([a-z%]*)$/.exec(string_in);
		return [operator, parseFloat(value), unit];
	} catch (e) {
		console.error("deconstructor error", e, "string_in:", string_in);
	}
}

function operateOnTransform(current_string, set_string) {
	if (current_string === undefined) return set_string.replaceAll(/[-+*\/][=]?/g, "");
	const current = current_string.replaceAll(" ", "").split(",").map(modifierDecontruct);
	const set_operations = set_string
		.replaceAll(" ", "")
		.split(",")
		.map(modifierDecontruct)
		.map(([set_operator, set_val, set_unit] = _, i) => {
			let [, current_val, current_unit] = current[i];
			if (set_operator) return eval(`current_val${set_operator}${set_val}`) + (set_unit || current_unit);
			return (set_val || current_val) + (set_unit || current_unit);
		});
	return set_operations.join(",");
}
