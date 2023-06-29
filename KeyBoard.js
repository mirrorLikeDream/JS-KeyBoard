/**
 * 键盘热键管理器
 * @author 周梽烽
 * @version 1.4.0
 * @date 2023/6/29
 */
class KeyboardManager {
    static EVENT_TYPE = {
        DOWN: 'keydown',
        UP: 'keyup'
    }
    elSource
    hotKeyList
    keyTimer
    delay
    isListened

    constructor(el, delay) {
        checkTypeByEl(el)
        checkDelay(delay)
        this.elSource = el ?? window
        this.delay = delay ?? 500
        this.keyTimer = null
        this.hotKeyList = getObjByProps(Object.values(KeyboardManager.EVENT_TYPE), {}, ()=>[])
        this.isListened = getObjByProps(Object.values(KeyboardManager.EVENT_TYPE), {}, ()=>false)
    }
    _addHotKey(type, combo, cb, opt) {
        checkCombo(combo)
        checkCB(cb)
        const hkList = this.hotKeyList[type]
        const hk = new HotKey(combo, cb, opt)
        let idx = hkList.findIndex(_hk=>_hk.equals(hk))
        if (idx !== -1) {
            hkList.splice(idx, 1)
        }
        if (hk.isSelfish) {
            hkList.unshift(hk)
        } else {
            hkList.push(hk)
        }
        if (this.isListened[type]) return
        this.isListened[type] = true
        this._addListener(type, opt?.event)
    }
    _addListener(type, eventOpt) {
        let t = type
        this.elSource.addEventListener(t, (e) => {
            let key = this._input(e)
            if (!key) return
            const hkList = this.hotKeyList[t]
            for (let hk of hkList) {
                if (!(hk.check(e))) continue
                let cb = hk.next()
                if (typeof cb === 'function') {
                    cb.call(this.elSource, e, hk)
                    hk.reset()
                    if(hk.isSelfish) break
                }
            }
        }, eventOpt)
    }
    up(combo, cb, opt) { this._addHotKey(KeyboardManager.EVENT_TYPE.UP, combo, cb, opt) }
    down(combo, cb, opt) { this._addHotKey(KeyboardManager.EVENT_TYPE.DOWN, combo, cb, opt) }
    _input(e) {
        let { key, type } = e
        if (key != null) {
            clearTimeout(this.keyTimer)
            this.keyTimer = setTimeout(() => {
                const hkList = this.hotKeyList[type]
                for (const hk of hkList) {
                    hk.reset()
                }
            }, this.delay);
        }
        return key
    }
}

/**
 * @typedef KeyOpt 键盘功能辅助键对象
 * @property {string} ctrl
 * @property {string} shift
 * @property {string} alt
 * @property {string} meta
 */

class HotKey {
    static SPECIAL_KEYS = ['all']
    static ASSIST_KEY = ['ctrl', 'alt', 'shift', 'meta']
    combo
    keys
    index
    /** @type {KeyOpt} */
    keyOpt
    cb
    isSelfish
    
    /**
     * @param {string} combo 键盘组合
     */
    constructor(combo, cb, opt) {
        const { keyOpt, isSelfish } = this._handleOpt(opt)
        this.keyOpt = keyOpt
        const { combo: _combo, keys } = this._handleCombo(combo)
        this.combo = _combo
        this.cb = cb
        this.keys = keys
        this.index = 0
        this.isSelfish = isSelfish
    }
    check(e) {
        let k = this._handelKeyByEvent(e.key)
        for (let [name, val] of Object.entries(this.keyOpt)) {
            if(e[`${name}Key`] !== val) return false
        }
        let _k = this.keys[this.index]
        if(HotKey.SPECIAL_KEYS.includes(_k)) return true
        if (!(k === _k)) return false
        return true
    }
    next() {
        let index = this.index + 1
        this.index = index
        return this.index >= this.keys.length ? this.cb : null
    }

    /**
     * 处理键盘组合字符串:
     * 0. 判空
     * 1. 去除前后空格
     * 2. 按空格切割成数组
     * 3. 过滤掉空字符
     * 4. 转化字符为小写
     * 5. 检查字符是否为功能辅助键，过滤掉并修改KeyOpt中的对应功能键为true
     * 6. 过滤掉空key后返回新的组合键字符串和keys数组
     */
    _handleCombo(combo) {
        if (!combo || !(combo=combo.trim())) throw new Error('组合键combo不能为空')
        const keys = combo.split(' ').filter(k => k)
            .map(k => k.toLowerCase())
            .filter(k => {
                if (HotKey.ASSIST_KEY.includes(k)) {
                    this.keyOpt[k] = true
                    return false
                }
                return true
            })
        return { combo: keys.join(' '), keys }
    }
    /**
     * @return {KeyOpt}
     */
    _handleOpt(opt) {
        return {
            keyOpt: getObjByProps(HotKey.ASSIST_KEY, opt, () => false),
            isSelfish: opt?.isSelfish ?? true
        }
    }
    /**
     * 处理事件传入的key：
     * 1. 判空
     * 2. 转化字符为小写
     * 3. 检查字符是否为空格并将其替换为'space'
     * 4. 检查字符是否是功能键并返回null
     */
    _handelKeyByEvent(key) {
        if (!key) return null
        key = key.toLowerCase()
        if (key === ' ') return 'space'
        if (HotKey.ASSIST_KEY.includes(key)) return null
        return key
    }
    reset() {
        this.index = 0
    }
    equals(obj) {
        if (!obj || !(obj instanceof HotKey)) return false
        if (obj.combo !== this.combo) return false

        const { keyOpt } = obj
        for (let [name, val] of Object.entries(this.keyOpt)) {
            if(keyOpt[name] !== val) return false
        }
        return true
    }
}

function getObjByProps(props, obj, deftVal=()=>{}) {
    if(!props || !(typeof props[Symbol.iterator] === 'function')) return null
    let res = {}
    for (let i = 0; i < props.length; i++) {
        let key = props[i]
        let val = obj ? obj[key] : deftVal.call(this, i, obj)
        if (typeof val === 'undefined') {
            res[key] = deftVal.call(this, i, obj)
        } else {
            res[key] = val
        }
    }
    return res
}
function checkRequireParam(param, paramName) {
    if (typeof param === 'undefined') {
        throw new Error(`Param '${paramName}' is a necessary parameter,Cannot be undefined`)
    }
    if (param === null) {
        throw new Error(`Param '${paramName}' is a necessary parameter,Cannot be null`)
    }
}
function checkParamAt(fn, msg) {
    return (param) => {
        if (!(fn.call(this, param))) {
            throw new Error(msg)
        }
    }
}
const checkTypeByEl = checkParamAt((obj) => {
    return obj instanceof EventTarget || typeof obj==='undefined' || obj === null
}, '参数el类型错误，必须为html元素')
const checkDelay = checkParamAt(delay => {
    let t = typeof delay
    return t === 'undefined' || t === 'number' && delay > 0
}, '参数delay必须为数值且大于0')
const checkCombo = checkParamAt(combo => {
    checkRequireParam(combo, 'combo')
    return typeof combo === 'string' && combo.trim().length>0
}, '参数combo不能为空')
const checkCB = checkParamAt(cb => {
    checkRequireParam(cb, 'cb')
    return typeof cb === 'function'
}, '参数cb类型必须是函数Function')
