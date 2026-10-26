import { browser } from '$app/environment'

/** @param {number} mX1 @param {number} mY1 @param {number} mX2 @param {number} mY2 */
function cubicBezier(mX1, mY1, mX2, mY2) {
	/** @param {number} a1 @param {number} a2 */
	const A = (a1, a2) => 1 - 3 * a2 + 3 * a1
	/** @param {number} a1 @param {number} a2 */
	const B = (a1, a2) => 3 * a2 - 6 * a1
	/** @param {number} a1 */
	const C = (a1) => 3 * a1
	/** @param {number} t @param {number} a1 @param {number} a2 */
	const calcBezier = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
	/** @param {number} t @param {number} a1 @param {number} a2 */
	const calcSlope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)
	/** @param {number} x */
	function getTForX(x) {
		let guess = x
		for (let i = 0; i < 4; i++) {
			const slope = calcSlope(guess, mX1, mX2)
			if (slope === 0) return guess
			guess -= (calcBezier(guess, mX1, mX2) - x) / slope
		}
		return guess
	}
	/** @param {number} x */
	return (x) => calcBezier(getTForX(x), mY1, mY2)
}

// page in/out duration (+layout.svelte) — header tags wait this long before
// revealing, so tag and page animations don't run in the same frames
export const PAGE_DURATION = 500

// prefers-reduced-motion: every custom transition becomes instant
const reduceMotion = browser && matchMedia('(prefers-reduced-motion: reduce)').matches

/** @param {number} duration @param {number} delay */
function timing(duration, delay) {
	return reduceMotion ? { duration: 0, delay: 0 } : { duration, delay }
}

// matches --transition: cubic-bezier(0.42, 0, 0.58, 1) in main.scss
const transitionEasing = cubicBezier(0.42, 0, 0.58, 1)

/**
 * @param {HTMLElement} node
 * @param {{duration?: number, delay?: number, easing?: (t: number) => number}} [params]
 */
export function revealWidth(node, { duration = 300, delay = 0, easing = transitionEasing } = {}) {
	const width = node.getBoundingClientRect().width
	const style = getComputedStyle(node)
	const paddingLeft = parseFloat(style.paddingLeft) || 0
	const paddingRight = parseFloat(style.paddingRight) || 0
	const marginLeft = parseFloat(style.marginLeft) || 0
	return {
		...timing(duration, delay),
		easing,
		// Safari <18 ignores overflow set via animation keyframes, so during an
		// intro's delay the zero-width wrapper didn't clip its tag and it flashed at
		// full size — hide it at t=0 only. Not clip-path/opacity: those make the
		// wrapper a backdrop root and the tag's backdrop blur vanishes mid-reveal
		/** @param {number} t */
		css: (t) =>
			`width: ${t * width}px; margin-left: ${t * marginLeft}px; padding-left: ${t * paddingLeft}px; padding-right: ${t * paddingRight}px; overflow: hidden;${t === 0 ? ' visibility: hidden;' : ''}`
	}
}

// full-element blur is the heaviest part of a transition (and page transitions
// blur two whole pages at once) — low-end devices (html.lite, set in app.html)
// get the fade without it
const noBlur = !browser || document.documentElement.classList.contains('lite')
// blur cost grows with radius — touch devices that keep it get a third of it
const blurScale = browser && matchMedia('(pointer: coarse)').matches ? 0.3 : 1

/** @param {number} t @param {number} blur */
function blurCss(t, blur) {
	return noBlur ? '' : `filter: blur(${(1 - t) * blur * blurScale}px);`
}

/**
 * @param {HTMLElement} node
 * @param {{duration?: number, delay?: number, blur?: number, easing?: (t: number) => number}} [params]
 */
export function fadeBlur(node, { duration = 500, delay = 0, blur = 100, easing = transitionEasing } = {}) {
	return {
		...timing(duration, delay),
		easing,
		/** @param {number} t */
		css: (t) => `opacity: ${t}; ${blurCss(t, blur)}`
	}
}

/**
 * @param {HTMLElement} node
 * @param {{duration?: number, delay?: number, blur?: number, easing?: (t: number) => number, fixed?: boolean}} [params]
 */
export function pageIn(node, { duration = 500, delay = 0, blur = 100, easing = transitionEasing, fixed = false } = {}) {
	const position = fixed ? 'position: fixed; inset: 0;' : 'position: absolute; inset: 0;'
	return {
		...timing(duration, delay),
		easing,
		/** @param {number} t */
		css: (t) => `${position} opacity: ${t}; ${blurCss(t, blur)}`
	}
}

/**
 * @param {HTMLElement} node
 * @param {{duration?: number, delay?: number, blur?: number, easing?: (t: number) => number, fixed?: boolean}} [params]
 */
export function pageOut(node, { duration = 500, delay = 0, blur = 100, easing = transitionEasing, fixed = false } = {}) {
	const scrollY = browser && !fixed ? window.scrollY : 0
	const position = fixed
		? 'position: fixed; inset: 0;'
		: `position: fixed; top: ${-scrollY}px; left: 0; right: 0;`
	return {
		...timing(duration, delay),
		easing,
		/** @param {number} t */
		css: (t) => `${position} opacity: ${t}; ${blurCss(t, blur)}`
	}
}
