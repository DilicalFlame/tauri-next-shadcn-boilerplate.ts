[**app**](../../../../README.md)

***

Defined in: [lib/services/WindowStateManager.ts:28](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L28)

## Methods

### addOrUpdateWindow()

> **addOrUpdateWindow**(`scope`, `windowState`): `void`

Defined in: [lib/services/WindowStateManager.ts:106](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L106)

#### Parameters

##### scope

`string`

##### windowState

[`WindowState`](../interfaces/WindowState.md)

#### Returns

`void`

***

### getPreset()

> **getPreset**(`category`): `Partial`\<[`WindowState`](../interfaces/WindowState.md)\> \| `undefined`

Defined in: [lib/services/WindowStateManager.ts:159](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L159)

#### Parameters

##### category

`string`

#### Returns

`Partial`\<[`WindowState`](../interfaces/WindowState.md)\> \| `undefined`

***

### getWindow()

> **getWindow**(`scope`, `label`): [`WindowState`](../interfaces/WindowState.md) \| `undefined`

Defined in: [lib/services/WindowStateManager.ts:151](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L151)

#### Parameters

##### scope

`string`

##### label

`string`

#### Returns

[`WindowState`](../interfaces/WindowState.md) \| `undefined`

***

### getWindows()

> **getWindows**(`scope`): [`WindowState`](../interfaces/WindowState.md)[]

Defined in: [lib/services/WindowStateManager.ts:155](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L155)

#### Parameters

##### scope

`string`

#### Returns

[`WindowState`](../interfaces/WindowState.md)[]

***

### loadState()

> **loadState**(): `Promise`\<[`AppState`](../interfaces/AppState.md)\>

Defined in: [lib/services/WindowStateManager.ts:43](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L43)

#### Returns

`Promise`\<[`AppState`](../interfaces/AppState.md)\>

***

### pruneScope()

> **pruneScope**(`scope`, `keepLabels`): `void`

Defined in: [lib/services/WindowStateManager.ts:140](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L140)

#### Parameters

##### scope

`string`

##### keepLabels

`string`[]

#### Returns

`void`

***

### removeWindow()

> **removeWindow**(`scope`, `label`): `void`

Defined in: [lib/services/WindowStateManager.ts:127](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L127)

#### Parameters

##### scope

`string`

##### label

`string`

#### Returns

`void`

***

### saveState()

> **saveState**(): `Promise`\<`void`\>

Defined in: [lib/services/WindowStateManager.ts:72](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L72)

#### Returns

`Promise`\<`void`\>

***

### trackWindow()

> **trackWindow**(`window`, `scope`, `url`, `type`, `category?`): `Promise`\<`void`\>

Defined in: [lib/services/WindowStateManager.ts:163](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L163)

#### Parameters

##### window

`Window` | `WebviewWindow`

##### scope

`string`

##### url

`string`

##### type

[`WindowType`](../type-aliases/WindowType.md)

##### category?

`string`

#### Returns

`Promise`\<`void`\>

***

### updateWindowState()

> **updateWindowState**(`scope`, `label`, `update`): `void`

Defined in: [lib/services/WindowStateManager.ts:86](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L86)

#### Parameters

##### scope

`string`

##### label

`string`

##### update

`Partial`\<[`WindowState`](../interfaces/WindowState.md)\>

#### Returns

`void`

***

### getInstance()

> `static` **getInstance**(): `WindowStateManager`

Defined in: [lib/services/WindowStateManager.ts:36](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowStateManager.ts#L36)

#### Returns

`WindowStateManager`
