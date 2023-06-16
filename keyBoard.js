/**
 * 键盘热键管理器
 * @author 周梽烽
 * @version 1.2.0
 * @date 2023/6/14
 * @change 更新内容：在对外API不变的前提下，更换了内部的数据结构和代码逻辑；修复了键盘热键功能键要求只需要最后一个字符符合条件即通过的bug
 */
class KeyboardManager {
    static EVENT_TYPE = {
        DOWN: 'keydown',
        UP: 'keyup'
    }
    elSource
    //=======键盘热键存储=========
    activeHKList
    HKList
    //====键盘输入延时器、监听记录=====
    #timer
    delay
    isListened


    constructor(elSource, delay = 500) {
        // 参数检测
        isSupportElOrThrow(elSource)
        isNumberOrThrow(delay) && isGtNumOrThrow(delay, 0)
        // 初始化参数
        this.HKList = {}
        this.activeHKList = {}
        for (let t of Object.values(KeyboardManager.EVENT_TYPE)) {
            this.HKList[t] = []
            this.activeHKList[t] = []
        }
        this.elSource = elSource
        this.delay = delay
        this.isListened = this._isListened
    }

    down(combo, cb, opt) {
        this.addHotKey(KeyboardManager.EVENT_TYPE.DOWN, combo, cb, opt)
    }
    up(combo, cb, opt) {
        this.addHotKey(KeyboardManager.EVENT_TYPE.UP, combo, cb, opt)
    }

    addHotKey(type, combo, cb, opt) {
        // 参数检测
        if (!isSupportEvent(type)) {
            return console.error('事件类型不支持！')
        }
        isComboOrThrow(combo) && isFunctionAtCBOrThrow(cb)
        
        this.HKList[type].push(this._parseHKToItem(combo, cb, opt))

        if (this.isListened[type]) return
        // 添加监听
        this.addListener(type)

        this.isListened[type] = true
    }

    addListener(type) {
        this.elSource.addEventListener(type, e => {
            let key = this._input(e.key, type)
            const activeHKList = [...this.activeHKList[type]]
            this.activeHKList[type].length = 0
            for (let hkItem of activeHKList) {
                if (hkItem.check(key, e)) {
                    if (hkItem.hasNext) this.activeHKList[type].push(hkItem.next)
                    else {
                        hkItem.root.isActive = false
                        hkItem.cb && hkItem.cb.call(hkItem, e, hkItem)
                    }
                }
            }
            for (let hkItem of this.HKList[type]) {
                if (!hkItem.isActive && hkItem.check(key, e)) {
                    if (hkItem.hasNext) {
                        this.activeHKList[type].push(hkItem.next)
                        hkItem.isActive = true
                    } else {
                        hkItem.isActive = false
                        hkItem.cb && hkItem.cb.call(hkItem, e, hkItem)
                    }
                }
            }

            /* const activeList = this.activeHKList
            let hotKeys = null
            if (activeList.length > 0) {
                hotKeys = [...activeList]
                this.activeHKList.length = 0
            } else {
                hotKeys = this.HKList
            }

            for (let hkItem of hotKeys) {
                if (hkItem.check(key, e)) {
                    if(hkItem.hasNext) this.activeHKList.push(hkItem.next)
                    hkItem.cb && hkItem.cb.call(hkItem, e, hkItem)
                }
            } */
        })
    }
    
    _parseHKToItem(combo, cb, opt) {
        let res = null
        let firstItem = null
        combo.split(' ').map(HotKeyItem.handleKey).forEach((key, idx, arr) => {
            if (idx === 0) {
                if (idx !== arr.length - 1) {
                    res = new HotKeyItem(key, opt)
                } else {
                    res = new HotKeyItem(key, opt, cb)
                }
                firstItem = res
            } else {
                if (idx !== arr.length - 1) {
                    res.next = new HotKeyItem(key, opt)
                } else {
                    res.next = new HotKeyItem(key, opt, cb)
                }
                res = res.next
            }
            res.root = firstItem
        })
        return firstItem
    }

    _input(key, type) {
        key = HotKeyItem.handleKey(key)
        if (key !== null) {
            this.#timer && clearTimeout(this.#timer)
            this.#timer = setTimeout(() => {
                const hkList = [...this.HKList[type]]
                while (hkList.length > 0) {
                    hkList.shift().root.isActive = false
                }
                this.activeHKList[type].length = 0
            }, this.delay);
        }
        return key
    }

    get _isListened() {
        const isListened = {}
        const eventType = Object.values(KeyboardManager.EVENT_TYPE)
        for (let type of eventType) {
            isListened[type] = false
        }
        return isListened
    }
}

/**
 * 组合键（热键）单元，每一个Item代表一种热键
 */
class HotKeyItem {
    static option = {
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    }
    static IGNORE_KEYS = ['control', 'alt', 'shift', 'meta']
 
    key
    option
    next
    cb
    isActive
    root

    constructor(key, opt, cb=null) {
        this.key = key
        this.cb = cb
        this.option = HotKeyItem._option(opt)
        this.next = null
    }
    get hasNext() {
        return this.next != null
    }
    check(key, event) {
        // const key = HotKeyItem.handleKey(event.key)
        if (!key || key !== this.key) return false
        // 检查辅助键
        for (const [key, value] of Object.entries(this.option)) {
            if(event[key] != value) return false
        }
        return true
    }

    static _option(opt) {
        // 将opt转化为只有默认opt属性的对象
        return copyObjAndTrProp(opt, HotKeyItem.option, prop=>Boolean(prop))
    }
    static handleKey(key) {
        if (!key) return null
        key = key.toLowerCase()
        if (key === ' ') return 'space'
        if (HotKeyItem.IGNORE_KEYS.includes(key)) return null
        return key
    }
}

/**
 * 浅拷贝对象source到target中，同时对target中重复的属性转化
 */
function copyObjAndTrProp(target, source, trFn) {
    if(!target) return Object.assign({}, source)
    let res = {}
    for (const [key, value] of Object.entries(source)) {
        if ((typeof target[key]) == 'undefined') res[key] = value
        else res[key] = trFn.call(target, target[key], source)
    }
    return res
}

//#region ==================== Start 参数检测函数

function isSupportElOrThrow(el) {
    if (! (el instanceof EventTarget)) {
        throw new Error('不支持的元素类型')
    }
    return true
}
function isNumberOrThrow(v, msg = '参数类型必须为number') {
    if (!(typeof v === 'number')) { throw new Error(msg) }
    return true
}

function isGtNumOrThrow(num, gtNum, msg='') {
    if (num <= gtNum) { throw new Error(`数值必须大于${gtNum}${msg}`) }
    return true
}
function isSupportEvent(type) {
    return Object.values(KeyboardManager.EVENT_TYPE).includes(type)
}
function isComboOrThrow(combo) {
    if(!combo || !(combo.trim())) throw new Error('组合键规则combo不能为空')
    //TODO ps: 还没有写键盘字符范围检测
    return true
}
function isFunctionAtCBOrThrow(o) {
    if (typeof o !== 'function') {
        throw new Error('热键参数cb必须是一个函数')
    }
}
//#endregion ==================== End