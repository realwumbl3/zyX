//// start offset (ie: .5)
///input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
//output: 0 ----------- 0  .2 .4 .6 .8 1
export function offset(int, off) {
	return Math.max(0, (-off + int) / (1 - off));
}

//// limit offset (ie: .5)
///input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
//output: 0 .2 .4 .6 .8 1 ------------ 1
export function offsetLimit(int, off) {
	return Math.min(1, int / off);
}
