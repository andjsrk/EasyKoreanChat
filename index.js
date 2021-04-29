const iohook = require('iohook')
const hangul = require('hangul-js')

const ALPHABET_HANGUL_MAP = {
	Q: 'ㅃ',
	W: 'ㅉ',
	E: 'ㄸ',
	R: 'ㄲ',
	T: 'ㅆ',
	O: 'ㅒ',
	P: 'ㅖ',
	q: 'ㅂ',
	w: 'ㅈ',
	e: 'ㄷ',
	r: 'ㄱ',
	t: 'ㅅ',
	y: 'ㅛ',
	u: 'ㅕ',
	i: 'ㅑ',
	o: 'ㅐ',
	p: 'ㅔ',
	a: 'ㅁ',
	s: 'ㄴ',
	d: 'ㅇ',
	f: 'ㄹ',
	g: 'ㅎ',
	h: 'ㅗ',
	j: 'ㅓ',
	k: 'ㅏ',
	l: 'ㅣ',
	z: 'ㅋ',
	x: 'ㅌ',
	c: 'ㅊ',
	v: 'ㅍ',
	b: 'ㅠ',
	n: 'ㅜ',
	m: 'ㅡ'
}
const SHIFT_MAP = {
	/**
	 * @readonly
	 */
	NUMERIC_SYMBOL: {
		48: 41, // 0 )
		49: 33, // 1 !
		50: 64, // 2 @
		51: 35, // 3 #
		52: 36, // 4 $
		53: 37, // 5 %
		54: 94, // 6 ^
		55: 38, // 7 &
		56: 42, // 8 *
		57: 40 // 9 (
	},
	/**
	 * @readonly
	 */
	SYMBOL_SYMBOL: {
		96: 126, // ` ~
		45: 95, // - _
		61: 43, // = +
		91: 123, // [ {
		93: 125, // ] }
		92: 124, // \ |
		59: 58, // ; :
		39: 34, // ' "
		44: 60, // , <
		46: 62, // . >
		47: 63 // / ?
	}
}

/**
 * @typedef {{
 * 	type: 'keydown' | 'keyup'
 * 	keycode: number
 * 	rawcode: number
 * 	altKey: boolean
 * 	shiftKey: boolean
 * 	ctrlKey: boolean
 * 	metaKey: boolean
 * }} iohookKeyEvent
 */
class WrappedKeyEvent {
	/**
	 * @param {iohookKeyEvent} event
	 */
	constructor(event) {
		this.type = event.type
		let code = event.rawcode
		switch (code) {
			case 160:
				code = 16
				break
			case 162:
				code = 17
				break
			case 164:
				code = 18
				break
		}
		this.code = code
		if (WrappedKeyEvent.uppedKey[this.code] === undefined) WrappedKeyEvent.uppedKey[this.code] = true
		this.repeat = !WrappedKeyEvent.uppedKey[this.code]
		this.alt = event.altKey
		this.ctrl = event.ctrlKey
		this.shift = event.shiftKey
		this.key = WrappedKeyEvent.getKeyByEvent(this)

		if (this.type === 'keydown') WrappedKeyEvent.uppedKey[this.code] = false
		else if (this.type === 'keyup') WrappedKeyEvent.uppedKey[this.code] = true
	}
	/**
	 * @param {WrappedKeyEvent} event
	 */
	static getKeyByEvent(event) {
		if (65 <= event.code && event.code <= 90) { // Alphabet
			const key = String.fromCharCode(event.code + 32)
			if (event.shift) return key.toUpperCase()
			else return key
		} else if (48 <= event.code && event.code <= 57) { // Numeric
			if (event.shift) return String.fromCharCode(SHIFT_MAP.NUMERIC_SYMBOL[event.code])
			else return String.fromCharCode(event.code)
		} else if ([ 96, 45, 61, 91, 93, 92, 59, 39, 44, 46, 47 ].includes(event.code)) { // Other symbols
			if (event.shift) return String.fromCharCode(SHIFT_MAP.SYMBOL_SYMBOL[event.code])
			else return String.fromCharCode(event.code)
		} else if ([ 32 ].includes(event.code)) return String.fromCharCode(event.code)
		switch (event.code) {
			case 8: return 'Backspace'
			case 9: return 'Tab'
			case 13: return 'Enter'
			case 16: return 'Shift'
			case 17: return 'Ctrl'
			case 18: return 'Alt'
			case 37: return 'ArrowLeft'
			case 38: return 'ArrowUp'
			case 39: return 'ArrowRight'
			case 40: return 'ArrowDown'
			case 46: return 'Delete'
		}
	}
	static uppedKey = {}
}

class App {
	/**
	 * @param {number} at
	 * @param {number} amount
	 */
	static sliceTypedContent(at, amount) {
		if (amount < 0) throw new Error(`invalid amount: ${amount}`)
		if (0 < App.typedContent.length) {
			if (at < 0) App.typedContent.splice(0, amount + at)
			else App.typedContent.splice(at, amount)
		}
	}
	/**
	 * @type {Array<WrappedKeyEvent>}
	 */
	static typedContent = []
	static typing = false
	static caretPosition = 0
}

iohook.on('keydown', event => {
	const key = new WrappedKeyEvent(event)
	if (App.typing && /^[a-zA-Z0-9`~)!@#$%^&*(\-_=+\[{\]}\\|;:'",<.>/? ]$/.test(key.key)) {
		App.typedContent.splice(App.caretPosition, 0, key)
		App.caretPosition++
	} else switch (key.key) {
		case 'Alt':
			if (!key.repeat) {
				App.typing = true
			}
			break
		case 'Backspace':
			App.sliceTypedContent(App.caretPosition - 1, 1)
			App.caretPosition--
			break
		case 'Delete':
			App.sliceTypedContent(App.caretPosition, 1)
			break
	}
})
iohook.on('keyup', event => {
	const key = new WrappedKeyEvent(event)
	if (key.key === 'Alt') {
		App.typing = false
		const string = App.typedContent.map(char => {
			if (/^[a-zA-Z]$/.test(char.key)) return ALPHABET_HANGUL_MAP[char.key] || ALPHABET_HANGUL_MAP[char.key.toLowerCase()]
			else return char.key
		}).join('')
		const match = string.match(/([ㄱ-ㅎㅏ-ㅣ가-힣])+/g)
		let convertedToHangul = string
		if (match !== null) {
			match.forEach(v => {
				convertedToHangul = convertedToHangul.replace(v, hangul.assemble(v.split('')))
			})
		}
		/**
		 * @type {HTMLTextAreaElement}
		 */
		const container = document.getElementById('container')
		container.innerText = convertedToHangul
		container.select()
		document.execCommand('copy')
		console.log('copy done!')
		App.typedContent = []
	}
})
iohook.start()
