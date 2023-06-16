/**
 * 键盘热键管理类
 * @author 周梽烽
 * @version 1.0.0
 * @date 2023/6/12
 */
class Keyboard {
    static KEYBOARD_EVENT_TYPE = {
        DOWN: 'keydown',
        UP: 'keyup'
    }

    #elEventSource
    #isListened
    #hotKeyMap
    #delay
    #hasOrder // 规定热键组合是否有顺序要求

    constructor(elEventSource, delay = 500, hasOrder = false) {
        if (!this._isSupportEl(elEventSource)) {
            throw new Error('参数一: elEventSource 元素类型不支持')
        }
        if (typeof delay != 'number' || delay <= 0) {
            throw new Error('参数二: delay 类型必须为number且大于0')
        }
        if (typeof hasOrder != 'boolean') {
            throw new Error('参数三: hasOrder 类型必须为boolean')
        }
        this.#elEventSource = elEventSource
        this.#isListened = this._isListened()
        this.#hotKeyMap = this._hotKeyMap()
        this.#delay = delay
        this.#hasOrder = hasOrder
    }

    /**
     * 获取默认参数
     * @returns 事件监听记录对象
     */
    _isListened() {
        const isListened = {}
        const eventType = Keyboard.KEYBOARD_EVENT_TYPE
        for (let key in eventType) {
            isListened[eventType[key]] = false
        }
        return isListened
    }

    /**
     * 获取默认参数
     * @returns 键盘热键映射对象
     */
    _hotKeyMap() {
        const hotKeyMap = {}
        const eventType = Keyboard.KEYBOARD_EVENT_TYPE
        for (let key in eventType) {
            hotKeyMap[eventType[key]] = new Map()
        }
        return hotKeyMap
    }

    /**
     * 热键选项
     * @typedef HotkeyOptions
     * @property {Boolean} ctrlKey
     * @property {Boolean} altKey
     * @property {Boolean} shiftKey
     * @property {Boolean} metaKey
     */
    /**
     * 添加热键
     * @param {String} type 键盘事件类型
     * @param {Function} cb 热键触发后的回调函数
     * @param {String} combination 设置组合键，不同键名用空格隔开；需要使用空格作为键名时，用space代替；示例：'s space'
     * @param {HotkeyOptions} options 热键选项
     * @param {Boolean} isCapture 事件是否捕获
     */
    addHotKey(type, cb, combination, options, isCapture=false) {
        // 参数判断：type是否支持、cb是否为空、triggerCondition类型
        if (!Object.values(Keyboard.KEYBOARD_EVENT_TYPE).includes(type)) {
            throw new Error('参数一: type为不支持的事件类型,请参考Keyboard.KEYBOARD_EVENT_TYPE参量')
        }
        if (!cb || !combination) {
            throw new Error('参数二或三: cb, combination不能为空')
        }
        if (typeof isCapture != 'boolean') {
            throw new Error('参数五: isCapture只能为boolean了类型')
        }
        // 处理参数
        let triggerCondition = new TriggerCondition(combination, options, this.#hasOrder)
        
        // 添加到热键对象中
        this.#hotKeyMap[type].set(triggerCondition.toKey(), { triggerCondition, cb })
        
        // 判断是否开启监听
        if (this.#isListened[type]) return
        
        // 调用创建监听的方法
        this.addListener(type, isCapture)

        this.#isListened[type] = true
    }

    /**
     * 添加事件监听
     * @param {String} type 键盘事件类型
     * @param {Boolean} isCapture 事件是否捕获
     */
    addListener(type, isCapture) {
        const keyCombination = new KeyCombination(this.#delay)
        
        this.#elEventSource.addEventListener(type, e => {
            e.preventDefault()
            const { key } = e
            // 输入key
            keyCombination.input(key)

            // 获取热键对象
            const keyStr = keyCombination.getKeyStr()
            if (keyStr.length < 1) return
            const hotKey = this.#hotKeyMap[type].get(TriggerCondition.generateKey(keyStr, e, this.#hasOrder))
            // 若没有对应的热键对象则结束
            if (!hotKey) return

            // // 判断是否符合组合键条件
            // if (!KeyCombination.isEligible(e, hotKey.triggerCondition)) return

            // 符合条件后回调
            hotKey.cb && hotKey.cb.call(this.#elEventSource, e)

            // 清空记录的组合键
            keyCombination.clear()
        }, isCapture)
    }

    //========================================================================
    //      addHotKey方法简洁调用 ⬇⬇⬇⬇
    //========================================================================

    /**
     * 注册键盘松开的热键
     * @param {Function} cb 回调函数
     * @param {TriggerCondition} triggerCondition 触发条件
     * @param {Boolean} isCapture 事件是否捕获
     */
    up(combination, options, cb, isCapture) {
        this.addHotKey(Keyboard.KEYBOARD_EVENT_TYPE.UP, cb, combination, options, isCapture)
    }

    /**
     * 注册键盘按下的热键
     * @param {Function} cb 回调函数
     * @param {TriggerCondition} triggerCondition 触发条件
     * @param {Boolean} isCapture 事件是否捕获
     */
    down(combination, options, cb, isCapture) {
        this.addHotKey(Keyboard.KEYBOARD_EVENT_TYPE.DOWN, cb, combination, options, isCapture)
    }

    /**
     * 获取元素支持注册事件的情况
     * @param {Object} el 对象
     * @returns 布尔值，true表示支持，否则反之
     */
    _isSupportEl(el) {
        return el instanceof EventTarget
    }
}

/**
 * 键盘组合键处理对象
 */
class KeyCombination {
    /** 忽视的组合键（不在组合键字符串中显示的字符） */
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
        let k = KeyCombination._handleKey(key)
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

    /** 处理传入的字符，将其转化为需要的形式 */
    static _handleKey(key) {
        if (!key) return null
        key = key.toLowerCase()
        if (key === ' ') return 'space'
        if (KeyCombination.IGNORE_KEYS.find(k=>k===key) != null) return null
        return key
    }

    /** 获取字符数组拼接空格后的字符串 */
    getKeyStr() {
        return this.#keys.join(' ')
    }

    /**
     * @discard 废弃的方法
     * 判断是该事件的key否符合条件
     * @param {KeyboardEvent} event 
     * @param {TriggerCondition} triggerCondition 
     */
    static isEligible(event, triggerCondition) {
        const { options: activeKey } = triggerCondition
        for (let keyName in activeKey) {
            if (activeKey[keyName] !== event[keyName]) return false
        }
        return true
    }

    /**
     * 处理传入的组合键字符串
     * @param {String} combination
     * @param {Boolean} hasOrder 规定热键组合是否有顺序要求
     * @returns 返回处理后的结果
     */
    static handleCombination(combination, hasOrder) {
        if (!combination) {
            throw new Error('组合键定义不能为空')
        }
        // 对combination做转换、去重和排序
        let _arr = []
        combination.trim().split(' ').forEach(k => {
            k = KeyCombination._handleKey(k)
            if(!_arr.includes(k)) _arr.push(k)
        })
        if (hasOrder) {
            return _arr.join(' ')
        }
        return _arr.sort().join(' ')
    }
}

/**
 * 触发条件对象，用来生成 Keyboard 对象的hotKeyMap需要的key
 */
class TriggerCondition {
    static #DEFAULT_VALUES = {
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    }
    combination
    options
    
    constructor(combination, options, hasOrder=false) {
        this.combination = KeyCombination.handleCombination(combination, hasOrder)
        if (!options) {
            this.options = Object.assign({}, TriggerCondition.#DEFAULT_VALUES)
        } else {
            this.options = {}
            for (let keyName in TriggerCondition.#DEFAULT_VALUES) {
                this.options[keyName] = !!(options[keyName]) || TriggerCondition.#DEFAULT_VALUES[keyName]
            }
        }
    }

    toKey() {
        return this.combination + '==>' + JSON.stringify(this.options)
    }
    static generateKey(combination, options, hasOrder = false) {
        let _options = {}
        for (let keyName in TriggerCondition.#DEFAULT_VALUES) {
            _options[keyName] = !!(options[keyName]) || TriggerCondition.#DEFAULT_VALUES[keyName]
        }
        return KeyCombination.handleCombination(combination, hasOrder) + '==>' + JSON.stringify(_options)
    }
}

export default Keyboard