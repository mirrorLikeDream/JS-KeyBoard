## 概述 | Overview

这是一个JS语言实现的键盘快捷键注册代码，支持你使用简单的API去注册键盘组合键。

## 示例 | Example

1. 下载并引用`KeyBoard.js`文件

```html
<script src="keyBoard.js"></script>
```

2. 创建`KeyboardManager`对象并传入Dom元素作为键盘事件的事件源

```js
// 以window为例创建一个键盘管理对象，
const km = new KeyboardManager(window)
```

3. 调用`down`或`up`方法来添加快捷键

   `down(keyCombination, callback, option)` 

   - 监听键盘按下时

   | 参数名         | 参数类型 | 说明                                                 | 默认值   | 是否可选 |
   | -------------- | -------- | ---------------------------------------------------- | -------- | -------- |
   | keyCombination | string   | 键盘组合键，具体请查看[组合键规则](#key-combination) | 无默认值 | 否       |
   | callback       | Function | 热键触发时的回调函数                                 | 无默认值 | 否       |
   | option         | object   | 键盘选项,具体查看[热键选项说明](#hk-opt)             | 无       | 是       |

   最简洁的监听方式如下，以监听字符`a`为例

   ```js
   km.down('a', ()=>{console.log('press down the a!')})
   ```

   如果你希望组合键为多个字符，可以在`keyCombination`参数中以空格隔开多个字符，示例如下

   ```js
   km.down('k c', ()=>{console.log('input !!')]})
   ```

   如果你需要在键入时携带功能辅助键，有如下两种方式:

   1. 在`keyCombination`中加入

   ```js
   km.down('ctrl alt A', e=>{console.log('keyboardEvent trigger at ',e)]})
   ```

   2. 加入第三个参数`option`，传入想要的功能键

   ```js
   km.down('a', ()=>{console.log('key down!')]}, {ctrl: true, alt: true})
   ```

   up(keyCombination, callback, option)` 

   - 监听键盘松开时，语法与`down`一致

## API

`KeyboardManager`

**构造方法**

- KeyboardManager(elSource [, delay])
  - 描述：创建一个键盘热键管理对象
  - 参数：
    - elSource | `EventTarget` :  必要参数。事件源对象，用来注册键盘事件
    - delay | `number` :  组合键延迟，表示每一个按键按下后delay的时间 后重置按键记录。 默认为500

**方法**

- `down(keyCombination, callback [, option])`
  - 描述：添加一个键盘按下的热键监听
  - 参数：
    - keyCombination | `String` :  指定键盘组合键，以多个字符间空格隔开。(空格字符用`space`代替)
    - callback | `Funciton` : 热键触发时的回调函数
      - function(event, hk)
        - `this`，指向事件源对象`elSource`
        - `event`，键盘事件对象
        - `hk`，类型为`HotKey`，表示当前触发的热键对象
    - option | `Object` : 辅助键选项，规定触发组合键时必须触发的辅助键
- `up(keyCombination, callback [, option])`
  - 描述：添加一个键盘松开的热键监听，其余参数同`km.down`

## 参数说明

### 键盘组合键规则（KeyCombination）{#key-combination}

有以下规则：

- 组合键由一个或多个字符或功能辅助键组成，字符间用空格隔开。
- 其中，功能辅助键分别为`ctrl`,`alt`,`shift`,`meta`四个
- 组合键不能只包含功能键，功能键可以在任意位置键入
- 当需要使用空格作为字符时，用`space`代替
- 若需要匹配任意字符，可以使用关键字`all`

示例：

- `a`  表示该组合键由字符`a`组成
- `j m` 表示该组合键由`j`和`m`同时按下触发
- `ctrl a`或`a ctrl`表示该组合键由`ctrl+a`组成
- `ctrl alt`，这是不合法的写法，至少需要一个有效字符（非功能键）
- `alt space` 表示需要同时按下`alt`和空格触发组合键

### 热键选项说明{#hk-opt}

热键选项是添加热键是的可选参数，它是一个普通对象，包含一些热键参数或事件参数作为属性。**每个属性都是可选的**

**属性如下**

| 属性名    | 类型              | 说明                                                         | 默认值 |
| --------- | ----------------- | ------------------------------------------------------------ | ------ |
| ctrl      | boolean           | true时表示热键触发必须包含ctrl键                             | false  |
| alt       | boolean           | true时表示热键触发必须包含alt键                              | false  |
| shift     | boolean           | true时表示热键触发必须包含shift键                            | false  |
| meta      | boolean           | true时表示热键触发必须包含meta键                             | false  |
| isSelfish | boolean           | true时表示热键触发会后限制其他热键的触发                     | true   |
| event     | boolean \| object | 事件监听参数，作用在`EventTarget.addEventListener`的第三个参数中 | 无     |

**示例**

```js
let opt = { ctrl: true, alt: flase } 
```

或

```js
let opt = { shift: true, isSelfish: false }
```

或

```js
let opt = { event: { signal: new AbortController().signal } }
// or
opt = { event: false }
```