/**
 * 键盘热键管理器
 * @author 周梽烽
 * @version 1.1.0
 * @date 2023/6/13
 * @change 更新内容：在不改变代码逻辑的情况下对代码结构优化，去除了冗余的代码
 */
class KeyboardManager {
    static EVENT_TYPE = {
        DOWN: 'keydown',
        UP: 'keyup'
    }
    static DEFAULT_OPTIONS = {
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    }

    #elSource
    #isListened
    #hotKeyMap
    #delay
    #rule

    constructor(elSource, delay = 500, rule = null) {
        isSupportElOrThrow(elSource)
        isNumberOrThrow(delay) && isGtNumOrThrow(delay, 0)
        this.#elSource = elSource
        this.#delay = delay
        this.#rule = KeyboardManager._fillRule(rule)
        this.#isListened = KeyboardManager._isListened
        this.#hotKeyMap = KeyboardManager._hotKeyMap
    }

    addHotKey(type, cb, combo, opt, isCap=false) {
        // 参数判断

        // 添加到热键对象中
        this.#hotKeyMap[type].set(this.genHKMapKey(combo, opt), cb)

        // 判断是否开启监听
        if (this.#isListened[type]) return
        
        // 调用创建监听的方法
        this.addListener(type, isCap)

        this.#isListened[type] = true
    }

    addListener(type, isCap) {
        const keyCombo = new KeyCombo(this.#delay)

        this.#elSource.addEventListener(type, e => {
            e.preventDefault()

            // 输入key
            keyCombo.input(e.key)

            
            // 获取热键函数
            const combo = keyCombo.combo
            if(combo.length < 1) return
            const cb = this.#hotKeyMap[type].get(this.genHKMapKey(combo, e))

            if (!cb) return
            
            // 调用回调
            cb.call(this.#elSource, e)

            // 清空输入的按键
            keyCombo.clear()

        }, isCap)
    }
    
    down(combo, cb, opt, isCap) {
        this.addHotKey(KeyboardManager.EVENT_TYPE.DOWN, cb, combo, opt, isCap)
    }

    up(combo, cb, opt, isCap) {
        this.addHotKey(KeyboardManager.EVENT_TYPE.UP, cb, combo, opt, isCap)
    }

    static get _rule() {
        return {
            ordered: false, // 为true时表示当前组合键触发是有顺序的
            repeatable: false // 为true时表示当前组合键可重复
        }
    }

    static get _isListened() {
        const isListened = {}
        const eventType = Object.values(KeyboardManager.EVENT_TYPE)
        for (let type of eventType) {
            isListened[type] = false
        }
        return isListened
    }

    static get _hotKeyMap() {
        const hotKeyMap = {}
        const eventType = Object.values(KeyboardManager.EVENT_TYPE)
        for (let type of eventType) {
            hotKeyMap[type] = new Map()
        }
        return hotKeyMap
    }

    static _fillRule(obj) {
        const rule = KeyboardManager._rule
        if (!obj) return rule
        else return toBoolPropOrFill(obj, rule)
    }

    static _fillOptions(obj) {
        const opt = KeyboardManager.DEFAULT_OPTIONS
        if (!obj) return Object.assign({}, opt)
        else return toBoolPropOrFill(obj, opt)
    }

    genHKMapKey(combo, opt) {
        opt = KeyboardManager._fillOptions(opt)
        const keys = Object.keys(KeyboardManager.DEFAULT_OPTIONS)
        let optStr = ''
        for(let k of keys) { optStr += opt[k] }
        return KeyCombo.handleCombo(combo, this.#rule) + '=>' + optStr
    }
    
}

class KeyCombo {
    /** 忽视的key（不在组合键字符串和keys中显示的字符） */
    static IGNORE_KEYS = ['control', 'alt', 'shift', 'meta', 'escape']
    /** 一个数组，记录键盘输入的key */
    #keys
    /** 延时器 */
    #timer
    /** 延时器延迟时间 */
    #delay

    constructor(delay) {
        this.#keys = []
        this.#timer = null
        this.#delay = delay
    }

    /**
     * 输入一个字符
     * @param {String} key 
     */
    input(key) {
        let k = KeyCombo.handleKey(key)
        if (k !== null) {
            this.#keys.push(k)
            // 有效字符输入时才重置延时器
            this.#timer && clearTimeout(this.#timer)
            this.#timer = setTimeout(() => {
                this.clear()
            }, this.#delay);
        }
    }

    /** 清除所有记录的字符 */
    clear() {
        this.#keys.length = 0
    }

    get combo() {
        return this.#keys.join(' ')
    }

    static handleCombo(combo, rule) {
        if (!combo) {
            throw new Error('组合键combo不能为空')
        }
        let combos = combo.trim().split(' ')
        const { repeatable, ordered } = rule
        if (!repeatable) {
            let arr = []
            combos.filter(k => {
                k = KeyCombo.handleKey(k)
                if (!arr.includes(k)) {
                    arr.push(k)
                    return true
                }
                return false
            })
        }
        if (ordered) {
            combos.sort()
        }
        return combos.join(' ')
    }

    static handleKey(key) {
        if (!key) return null
        key = key.toLowerCase()
        if (key === ' ') return 'space'
        if (KeyCombo.IGNORE_KEYS.find(k=>k===key) != null) return null
        return key
    }
}


/**
 * 参数类型检测和异常
 */

function isNumberOrThrow(v, msg = '参数类型必须为number') {
    if (!(typeof v === 'number')) { throw new Error(msg) }
    return true
}

function isGtNumOrThrow(num, gtNum, msg='') {
    if (num <= gtNum) { throw new Error(`数值必须大于${gtNum}${msg}`) }
    return true
}

class NotSupportElement extends TypeError {
    name = 'NotSupportElement'
    message = '不支持的元素类型'
    constructor() {
        super()
    }
}

function isSupportElOrThrow(el) {
    if (! (el instanceof EventTarget)) {
        throw new NotSupportElement()
    }
    return true
}

function toBoolPropOrFill(target, source) {
    let res = {}
    for (const [key, value] of Object.entries(source)) {
        if ((typeof target[key]) == 'undefined') res[key] = value
        else res[key] = !!(target[key])
    }
    return res
}