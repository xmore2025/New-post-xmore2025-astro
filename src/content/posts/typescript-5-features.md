---
title: TypeScript 5.x 里真正改变写法的特性
description: 装饰器标准化、const 类型参数、satisfies 与 using —— 挑出那些会实际改变你日常代码的更新。
date: 2025-11-12
tags: [typescript, engineering]
---

TypeScript 每年都会发布一堆特性，其中大部分你永远不会用。这一篇只挑四个真正会改变日常写法的。

## 1. `satisfies`：既要校验，又要保留字面量

在 `satisfies` 出现之前，你只有两个选择：要么用类型注解（丢失字面量），要么用 `as`（丢失校验）。

```ts
type Route = { path: string; auth: boolean };

// 注解：config 的类型被拓宽成 Route，keys 丢了
const config: Record<string, Route> = {
  home: { path: '/', auth: false },
};

// satisfies：既校验，又保留精确类型
const routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
} satisfies Record<string, Route>;

routes.admin.path; // 类型是 '/admin'，不是 string
```

这在配置对象、主题 token、路由表里几乎是必备的。

## 2. `const` 类型参数：让泛型推断更"贪心"

泛型默认会把字面量拓宽成基础类型。加一个 `const` 修饰符，就能让推断保留字面量：

```ts
declare function defineRoutes<const T extends readonly string[]>(routes: T): T;

const r = defineRoutes(['home', 'posts', 'about']);
// 类型是 readonly ["home", "posts", "about"]，而不是 string[]
```

写库的人受益最大，但业务代码里定义枚举式的常量集合时也很好用。

## 3. 标准装饰器：终于不用两套写法了

TypeScript 5.0 实现了 TC39 的装饰器提案，与 `experimentalDecorators` 是两套东西。新的装饰器有明确的执行顺序和更好的类型支持：

```ts
function logged<This, Args extends unknown[], Ret>(
  target: (this: This, ...args: Args) => Ret,
  context: ClassMethodDecoratorContext
) {
  return function (this: This, ...args: Args): Ret {
    console.log(`→ ${String(context.name)}`, args);
    return target.apply(this, args);
  };
}

class Service {
  @logged
  fetch(id: string) {
    return db.get(id);
  }
}
```

迁移时要注意：新装饰器不能修改 `prototype`，也不能装饰参数。老代码需要重写，不是换个开关就行。

## 4. `using`：显式资源管理

`using` 声明会在作用域结束时自动调用 `[Symbol.dispose]()`，`await using` 则调用 `[Symbol.asyncDispose]()`：

```ts
function withTempDir() {
  using dir = openTempDir();       // 离开作用域时自动清理
  return process(dir.path);
}

async function query() {
  await using conn = await pool.acquire();
  return conn.execute('select 1');
}
```

对比 `try/finally`，它的价值在于**清理逻辑跟着资源定义走**，而不是散落在每个调用点。

## 不值得追的那些

顺便说一句，下面这些我基本不用：

- **装饰器元数据**（`emitDecoratorMetadata`）：和框架强绑定，迁移成本高
- **`namespace`**：ESM 已经够用
- **过度嵌套的条件类型**：三个月后你自己也读不懂

工具的价值在于减少认知负担。任何让代码更难读的特性，即使它"更类型安全"，也应该谨慎引入。
