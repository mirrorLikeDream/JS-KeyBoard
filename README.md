## 概述 | Overview

> 数据结构灵感来源：https://github.com/bytedo/keyboard

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

```js
// km.down: 添加一个按下的热键监听
// 表示一个组合键由a,b,c顺序按下触发
km.down('a b c', e=>{console.log(e)})

// 如果你需要这个快捷键包含一个或一组辅助键(ctrl,alt,shift,meta)，可以加入第三个参数
km.down('g o', e=>{
  //表示只有同时按下ctrl和alt并输入组合键才能触发回调
}, { ctrlKey: true, altKey: true })

// 如果你希望监听键盘松开的热键监听，可以使用km.up方法
km.up('a', e=>{
  console.log('keyup')
})
```

## API

`KeyboardManager`

**构造方法**

- KeyboardManager(elSource [, delay])
  - 描述：创建一个键盘热键管理对象
  - 参数：
    - elSource | `EventTarget` :  必要参数。事件源对象，用来注册键盘事件
    - delay | `number` :  组合键延迟，表示每一个按键按下后delay的时间 后重置按键记录。 默认为500

**方法**

- down(keyCombination, callback [, option])
  - 描述：添加一个键盘按下的热键监听
  - 参数：
    - keyCombination | `String` :  指定键盘组合键，以多个字符间空格隔开。(空格字符用`space`代替)
    - callback | `Funciton` : 热键触发时的回调函数
      - 示例：(event)=>{} ，event为原生键盘事件对象
    - option | `Object` : 辅助键选项，规定触发组合键时必须触发的辅助键
      - 默认值: `{ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false }`
- up(keyCombination, callback [, option])
  - 描述：添加一个键盘松开的热键监听，其余参数同`km.down`

## 注意点

1. 当键盘组合键重叠时，不会覆盖之前添加的热键，如果希望修改已添加的热键，可以直接操作`km.HKList`数组（后续会加入`remove`的api）

2. 当键盘组合键有相同前缀时，触发较短热键不会重置已激活的热键组，对此后续会加入选项来操作是否重置。目前可以通过操作`kb.activeHKList`数组来重置

   ```js
   kb.down('d', e=>{// one
     console.log('key combo is "d"`);
   })
   kb.down('d a', e=>{ // two
     console.log('key combo is "d a"');
   })
   // 当你输入 d 触发one回调时，可以继续输入a触发tow回调
   ```

   
