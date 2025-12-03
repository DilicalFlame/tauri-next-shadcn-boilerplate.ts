[**app**](../../../../README.md)

***

Defined in: [lib/services/WindowManager.ts:26](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L26)

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [lib/services/WindowManager.ts:43](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L43)

#### Returns

`Promise`\<`void`\>

***

### openAuxiliaryWindow()

> **openAuxiliaryWindow**(`path`, `options?`): `Promise`\<`void`\>

Defined in: [lib/services/WindowManager.ts:259](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L259)

#### Parameters

##### path

`string` = `"/"`

##### options?

`Partial`\<[`WindowConfig`](../interfaces/WindowConfig.md)\>

#### Returns

`Promise`\<`void`\>

***

### openChildWindow()

> **openChildWindow**(`path`, `options?`): `Promise`\<`void`\>

Defined in: [lib/services/WindowManager.ts:305](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L305)

#### Parameters

##### path

`string` = `"/"`

##### options?

`Partial`\<[`WindowConfig`](../interfaces/WindowConfig.md)\>

#### Returns

`Promise`\<`void`\>

***

### setUiLock()

> **setUiLock**(`locked`): `Promise`\<`void`\>

Defined in: [lib/services/WindowManager.ts:162](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L162)

Emits an event to lock/unlock the UI of the current window.

#### Parameters

##### locked

`boolean`

#### Returns

`Promise`\<`void`\>

***

### shakeWindow()

> **shakeWindow**(`window`): `Promise`\<`void`\>

Defined in: [lib/services/WindowManager.ts:173](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L173)

Shakes the specified window to indicate it requires attention.

#### Parameters

##### window

`WebviewWindow`

#### Returns

`Promise`\<`void`\>

***

### getInstance()

> `static` **getInstance**(): `WindowManager`

Defined in: [lib/services/WindowManager.ts:152](https://github.com/DilicalFlame/tauri-next-shadcn-boilerplate.ts/blob/3e5737a308cfa5d09ede14cb902f0f1e7d2b94ca/lib/services/WindowManager.ts#L152)

#### Returns

`WindowManager`
