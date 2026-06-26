---
title: Codex App 强开 Fast、插件和 Goal 记录
published: 2026-05-12T13:56:23+08:00
description: 分享参考网上脚本后在 Codex App 中打开 Fast、插件和 Goal 的方法，重点讲作用、用法和验证方式。
tags: [Codex, AI, 第三方API, 插件, Goal, 随笔]
category: 浮生随笔
draft: false
image: "../images/category/suibi.png"
author: Quin.Lin
---

`Codex App` 里有些功能，并不是所有登录方式下都会稳定出现。

除了第三方 API 场景，有时候即便是官方 `OAuth` 登录，也会遇到 `Fast`、插件或者 `Goal` 没有出现、入口不完整，或者命令调不出来的情况。结果就是：客户端明明具备这些能力，但实际使用时总像是少了一块。

这篇文章主要分享一个网上流传的补丁脚本，以及实际使用时的做法。重点不放在底层原理，而是放在它能解决什么问题、怎么使用，以及怎么确认它已经生效。

## 这次主要解决了什么

先说结论，这套补丁不是为了“加新功能”，而是把客户端里本来就有、但在某些登录方式或限制条件下不一定会稳定开放的能力重新放出来。

### 1. 强开 Fast

第一个是 `Fast Mode`。

有些时候，明明是同一个客户端，但 `Fast` 这类能力就是不会正常出现，或者直接被当成不可用处理。补丁打完之后，这部分限制就会被放开，不再轻易因为当前接入方式或者内置判断被挡在门外。

对实际使用来说，意义很直接：

- 某些模式不再被额外限制
- 不同登录方式下的体验更接近完整形态
- 不用为了一个开关反复切环境

### 2. 把插件入口和页面放出来

第二个是插件。

插件相关的入口有时也会被一起锁掉。表现通常很直白：

- 插件侧边栏看不到
- 插件页打不开
- 插件详情页不可用
- 某些登录方式下插件能力直接被拦

这套补丁处理完之后，插件相关的几个关键入口就能恢复出来。至少从使用层面来说，不会再出现“客户端里明明有插件，但就是不给你点”的情况。

### 3. 把 Goal 开出来

第三个是 `Goal`。

这个功能比我一开始想的更烦一点，因为它不只是一个页面入口问题。很多时候你就算知道它存在，直接在输入框里敲 `/goal`，最后看到的也只是 `No commands`。

所以这次处理的不只是 Goal 本身的开关，也把 `/goal` 的命令匹配一起补上了。打完之后，在非 cloud 的场景里，`/goal` 就能正常出来，不再是“知道有这个东西，但根本调不出来”。

## 怎么使用

做法很简单：新建一个 `.sh` 脚本文件，把下面完整内容贴进去，然后执行即可。

比如你可以先新建一个文件：

```bash
nano patch_codex_fast_mode.sh
```

然后把下面这整段脚本原样粘进去：

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-/Applications/Codex.app}"
KEEP_WORKDIR="${KEEP_WORKDIR:-0}"

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-fast-repatch.XXXXXX")"
EXTRACT_DIR="$WORKDIR/extracted"
NEW_ASAR="$WORKDIR/app.asar"
ASAR_PATH="$APP_PATH/Contents/Resources/app.asar"
INFO_PLIST="$APP_PATH/Contents/Info.plist"

log() {
  printf '[codex-local-patch] %s\n' "$*"
}

fail() {
  printf '[codex-local-patch] error: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ "$KEEP_WORKDIR" == "1" ]]; then
    log "keeping workdir: $WORKDIR"
    return
  fi
  rm -rf "$WORKDIR"
}

trap cleanup EXIT

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

require_cmd node
require_cmd npx
require_cmd rg
require_cmd codesign
require_cmd plutil
require_cmd /usr/libexec/PlistBuddy

[[ -d "$APP_PATH" ]] || fail "app not found: $APP_PATH"
[[ -f "$ASAR_PATH" ]] || fail "asar not found: $ASAR_PATH"
[[ -f "$INFO_PLIST" ]] || fail "Info.plist not found: $INFO_PLIST"

VERSION="$(defaults read "$APP_PATH/Contents/Info" CFBundleShortVersionString 2>/dev/null || true)"
BUILD="$(defaults read "$APP_PATH/Contents/Info" CFBundleVersion 2>/dev/null || true)"

log "target app: $APP_PATH"
log "version/build: ${VERSION:-unknown} / ${BUILD:-unknown}"

if pgrep -x "Codex" >/dev/null 2>&1; then
  log "quitting running Codex process"
  osascript -e 'tell application "Codex" to quit' >/dev/null 2>&1 || true
  sleep 2
  pkill -x "Codex" >/dev/null 2>&1 || true
fi

log "extracting app.asar"
npx --yes asar extract "$ASAR_PATH" "$EXTRACT_DIR" >/dev/null

PATCH_TARGET="$(rg -l 'featureRequirements\?\.fast_mode' "$EXTRACT_DIR/webview/assets" | head -n 1 || true)"
[[ -n "$PATCH_TARGET" ]] || fail "could not find fast-mode gate in extracted assets"

PLUGIN_SIDEBAR_TARGET="$(rg -l '533078438' "$EXTRACT_DIR/webview/assets" | head -n 1 || true)"
[[ -n "$PLUGIN_SIDEBAR_TARGET" ]] || fail "could not find plugin sidebar gate in extracted assets"

PLUGIN_SKILLS_TARGET="$(rg -l 'pluginDeepLinkAuthBlocked===!0' "$EXTRACT_DIR/webview/assets" | head -n 1 || true)"
[[ -n "$PLUGIN_SKILLS_TARGET" ]] || fail "could not find plugin skills-page auth gate in extracted assets"

PLUGIN_DETAIL_TARGET="$(rg -l 'pluginDeepLinkAuthBlocked:!0' "$EXTRACT_DIR/webview/assets" | head -n 1 || true)"
[[ -n "$PLUGIN_DETAIL_TARGET" ]] || fail "could not find plugin detail auth gate in extracted assets"

GOAL_TARGET="$(
  rg -l 'set-thread-goal-status|3074100722.*`goals`' "$EXTRACT_DIR/webview/assets" | while IFS= read -r file; do
    if rg -q 'threadGoalObjective|3074100722.*`goals`' "$file"; then
      printf '%s\n' "$file"
    fi
  done | head -n 1 || true
)"
[[ -n "$GOAL_TARGET" ]] || fail "could not find goal slash-command gate in extracted assets"

log "fast-mode patch target: ${PATCH_TARGET#$EXTRACT_DIR/}"
log "plugin sidebar patch target: ${PLUGIN_SIDEBAR_TARGET#$EXTRACT_DIR/}"
log "plugin skills-page patch target: ${PLUGIN_SKILLS_TARGET#$EXTRACT_DIR/}"
log "plugin detail patch target: ${PLUGIN_DETAIL_TARGET#$EXTRACT_DIR/}"
log "goal patch target: ${GOAL_TARGET#$EXTRACT_DIR/}"

PATCH_RESULT="$(
  node - "$PATCH_TARGET" <<'NODE'
const fs = require('node:fs');

const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');

const legacyPatchedRe =
  /function L\(e\)\{let (\w+)=v\(x\),(\w+)=e\?\.hostId\?\?\1,\{data:(\w+)\}=d\(E,\2\);return \3\?\.requirements\?\.featureRequirements\?\.fast_mode!==!1\}/;

const currentDirectPatchedRe =
  /featureRequirements\?\.fast_mode===!1;return!\w+\}/;

const legacyOriginalRe =
  /function L\(e\)\{let (\w+)=v\(x\),(\w+)=e\?\.hostId\?\?\1,(\w+)=O\(\2\),\{data:(\w+)\}=d\(E,\2\);return!\(\3\?\.authMethod!==`chatgpt`\|\|\4\?\.requirements\?\.featureRequirements\?\.fast_mode===!1\)\}/;

const currentDirectOriginalRe =
  /function (\w+)\(e\)\{let (\w+)=([^,;]+),(\w+)=e\?\.hostId\?\?\2,(\w+)=(\w+\(\4\)),\{data:(\w+)\}=(\w+\(\w+,\4\)),(\w+)=\7\?\.requirements\?\.featureRequirements\?\.fast_mode===!1;return!\(\5\?\.authMethod!==`chatgpt`\|\|\9\)\}/;

const currentSplitConditionRe =
  /if\((\w+)\?\.authMethod!==`chatgpt`\|\|(\w+)\)\{/;

if (
  legacyPatchedRe.test(text) ||
  (currentDirectPatchedRe.test(text) &&
    !legacyOriginalRe.test(text) &&
    !currentDirectOriginalRe.test(text) &&
    !currentSplitConditionRe.test(text))
) {
  process.stdout.write('already-patched');
  process.exit(0);
}

let next = text;
let patched = !1;

const legacyMatch = next.match(legacyOriginalRe);
if (legacyMatch) {
  const [, rootVar, hostVar, , dataVar] = legacyMatch;
  const replacement =
    `function L(e){let ${rootVar}=v(x),${hostVar}=e?.hostId??${rootVar},{data:${dataVar}}=d(E,${hostVar});return ${dataVar}?.requirements?.featureRequirements?.fast_mode!==!1}`;
  next = next.replace(legacyOriginalRe, replacement);
  patched = !0;
}

if (!patched) {
  const currentMatch = next.match(currentDirectOriginalRe);
  if (currentMatch) {
    const [, fn, rootVar, rootExpr, hostVar, , , dataVar, dataCall, disabledVar] = currentMatch;
    const replacement =
      `function ${fn}(e){let ${rootVar}=${rootExpr},${hostVar}=e?.hostId??${rootVar},{data:${dataVar}}=${dataCall},${disabledVar}=${dataVar}?.requirements?.featureRequirements?.fast_mode===!1;return!${disabledVar}}`;
    next = next.replace(currentDirectOriginalRe, replacement);
    patched = !0;
  }

  if (/canUseFastMode:!1/.test(next)) {
    const splitNext = next.replace(currentSplitConditionRe, 'if($2){');
    if (splitNext === next) {
      process.stderr.write('split-gate-target-not-found\n');
      process.exit(2);
    }
    next = splitNext;
    patched = !0;
  }
}

if (!patched) {
  process.stderr.write('patch-target-not-found\n');
  process.exit(2);
}

if (next === text) {
  process.stderr.write('patch-did-not-change-file\n');
  process.exit(3);
}

fs.writeFileSync(file, next);
process.stdout.write('patched');
NODE
)" || fail "failed to patch fast-mode gate"

log "patch result: $PATCH_RESULT"

PLUGIN_PATCH_RESULT="$(
  node - "$PLUGIN_SIDEBAR_TARGET" "$PLUGIN_SKILLS_TARGET" "$PLUGIN_DETAIL_TARGET" <<'NODE'
const fs = require('node:fs');

const [sidebarFile, skillsFile, detailFile] = process.argv.slice(2);
let changed = false;

function rewriteFile(label, file, patchedRe, originalRe, replacement) {
  const text = fs.readFileSync(file, 'utf8');

  if (patchedRe.test(text)) {
    return;
  }

  const next = text.replace(originalRe, replacement);
  if (next === text) {
    process.stderr.write(`${label}-target-not-found\n`);
    process.exit(2);
  }

  fs.writeFileSync(file, next);
  changed = true;
}

rewriteFile(
  'plugin-sidebar-gate',
  sidebarFile,
  /\{authMethod:(\w+)\}=([A-Za-z_$][\w$]*)\(\),(\w+)=([A-Za-z_$][\w$]*)\(`533078438`\),(\w+)=!1,(\w+)=e&&\3&&\5,(\w+)=([A-Za-z_$][\w$]*)\(\{hostId:([A-Za-z_$][\w$]*)\}\),(\w+)=e&&\7&&!\5,/,
  /\{authMethod:(\w+)\}=([A-Za-z_$][\w$]*)\(\),(\w+)=([A-Za-z_$][\w$]*)\(`533078438`\),(\w+)=([A-Za-z_$][\w$]*)\(\1\),(\w+)=e&&\3&&\5,(\w+)=([A-Za-z_$][\w$]*)\(\{hostId:([A-Za-z_$][\w$]*)\}\),(\w+)=e&&\8&&!\5,/,
  (_match, authMethodVar, authHook, flagVar, featureFlagHook, apiKeyGateVar, _apiKeyGateHook, disabledVar, availabilityVar, availabilityHook, hostIdVar, enabledVar) =>
    `{authMethod:${authMethodVar}}=${authHook}(),${flagVar}=${featureFlagHook}(\`533078438\`),${apiKeyGateVar}=!1,${disabledVar}=e&&${flagVar}&&${apiKeyGateVar},${availabilityVar}=${availabilityHook}({hostId:${hostIdVar}}),${enabledVar}=e&&${availabilityVar}&&!${apiKeyGateVar},`
);

rewriteFile(
  'plugin-skills-page-gate',
  skillsFile,
  /let (\w+)=!1,(\w+),(\w+);if\(e\[(\d+)\]!==(\w+)\|\|e\[(\d+)\]!==\1\|\|e\[(\d+)\]!==(\w+)\?/,
  /let (\w+)=(\w+),(\w+),(\w+);if\(e\[(\d+)\]!==(\w+)\|\|e\[(\d+)\]!==\1\|\|e\[(\d+)\]!==(\w+)\?/,
  (_match, pluginAuthBlockedVar, _sourceVar, effectFnVar, effectDepsVar, slotA, deepLinkBlockedVar, slotB, slotC, toastApiVar) =>
    `let ${pluginAuthBlockedVar}=!1,${effectFnVar},${effectDepsVar};if(e[${slotA}]!==${deepLinkBlockedVar}||e[${slotB}]!==${pluginAuthBlockedVar}||e[${slotC}]!==${toastApiVar}?`
);

rewriteFile(
  'plugin-detail-gate',
  detailFile,
  /\{authMethod:(\w+)\}=([A-Za-z_$][\w$]*)\(\);if\(!1\)\{let (\w+);return/,
  /\{authMethod:(\w+)\}=([A-Za-z_$][\w$]*)\(\);if\(([A-Za-z_$][\w$]*)\(\1\)\)\{let (\w+);return/,
  (_match, authMethodVar, authHook, _isAuthBlockedHook, redirectElementVar) =>
    `{authMethod:${authMethodVar}}=${authHook}();if(!1){let ${redirectElementVar};return`
);

process.stdout.write(changed ? 'patched' : 'already-patched');
NODE
)" || fail "failed to patch plugin auth gates"

log "plugin patch result: $PLUGIN_PATCH_RESULT"

GOAL_PATCH_RESULT="$(
  node - "$GOAL_TARGET" <<'NODE'
const fs = require('node:fs');

const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');

const goalPatchedRe = /(\w+)=([A-Za-z_$][\w$]*)!==`cloud`,(\w+)=([^,]+),/;
const goalOriginalRe =
  /(\w+)=([A-Za-z_$][\w$]*)\(`3074100722`\)&&([A-Za-z_$][\w$]*)\((\w+)\?\.config,`goals`\)===!0&&(\w+)!==`cloud`,(\w+)=([^,]+),/;

const slashOriginal =
  'function Nx(e,t){let n=t.trim();if(n.length===0)return e;let r=new Map;return e.forEach(e=>{let t=e.group??null;r.has(t)||r.set(t,r.size)}),(0,Tx.default)(e.map(e=>({command:e,score:zi(e.title,n)})).filter(e=>e.score>0),[e=>r.get(e.command.group??null)??2**53-1,e=>-e.score,e=>e.command.title]).map(e=>e.command)}';

const slashPatched =
  'function Nx(e,t){let n=t.trim().replace(/^\\/+/,"");if(n.length===0)return e;let r=new Map;return e.forEach(e=>{let t=e.group??null;r.has(t)||r.set(t,r.size)}),(0,Tx.default)(e.map(e=>({command:e,score:Math.max(zi(e.title,n),zi(e.id,n))})).filter(e=>e.score>0),[e=>r.get(e.command.group??null)??2**53-1,e=>-e.score,e=>e.command.title]).map(e=>e.command)}';

let next = text;
let changed = false;

if (!next.includes(slashPatched)) {
  if (!next.includes(slashOriginal)) {
    process.stderr.write('slash-match-patch-target-not-found\n');
    process.exit(2);
  }
  next = next.replace(slashOriginal, slashPatched);
  changed = true;
}

if (goalOriginalRe.test(next)) {
  next = next.replace(
    goalOriginalRe,
    (_match, goalGateVar, _statsigFn, _configAccessFn, _configVar, modeVar, hasGoalVar, hasGoalExpr) =>
      `${goalGateVar}=${modeVar}!==\`cloud\`,${hasGoalVar}=${hasGoalExpr},`,
  );
  changed = true;
} else if (!goalPatchedRe.test(next)) {
  process.stderr.write('goal-patch-target-not-found\n');
  process.exit(2);
}

if (!changed) {
  process.stdout.write('already-patched');
  process.exit(0);
}

fs.writeFileSync(file, next);
process.stdout.write('patched');
NODE
)" || fail "failed to patch goal slash-command gate"

log "goal patch result: $GOAL_PATCH_RESULT"

if [[ "$PATCH_RESULT" == "already-patched" && "$PLUGIN_PATCH_RESULT" == "already-patched" && "$GOAL_PATCH_RESULT" == "already-patched" ]]; then
  log "fast-mode, plugin, and goal gates are already patched for this build"
  exit 0
fi

log "repacking app.asar"
npx --yes asar pack "$EXTRACT_DIR" "$NEW_ASAR" >/dev/null

ASAR_HEADER_HASH="$(
  node - "$NEW_ASAR" <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');

const file = process.argv[2];
const fd = fs.openSync(file, 'r');

try {
  const sizeBuf = Buffer.alloc(8);
  const sizeRead = fs.readSync(fd, sizeBuf, 0, 8, 0);
  if (sizeRead !== 8) {
    throw new Error('could not read asar size pickle');
  }

  const headerSize = sizeBuf.readUInt32LE(4);
  const headerBuf = Buffer.alloc(headerSize);
  const headerRead = fs.readSync(fd, headerBuf, 0, headerSize, 8);
  if (headerRead !== headerSize) {
    throw new Error('could not read asar header');
  }

  const stringLength = headerBuf.readUInt32LE(4);
  const headerStringBytes = headerBuf.subarray(8, 8 + stringLength);
  const hash = crypto.createHash('sha256').update(headerStringBytes).digest('hex');
  process.stdout.write(hash);
} finally {
  fs.closeSync(fd);
}
NODE
)" || fail "failed to compute Electron asar integrity hash"

log "new ElectronAsarIntegrity hash: $ASAR_HEADER_HASH"

cp "$NEW_ASAR" "$ASAR_PATH"
/usr/libexec/PlistBuddy -c "Set :ElectronAsarIntegrity:Resources/app.asar:hash $ASAR_HEADER_HASH" "$INFO_PLIST"

log "re-signing app bundle"
codesign --force --deep --sign - "$APP_PATH" >/dev/null

FINAL_HASH="$(/usr/libexec/PlistBuddy -c 'Print :ElectronAsarIntegrity:Resources/app.asar:hash' "$INFO_PLIST")"
[[ "$FINAL_HASH" == "$ASAR_HEADER_HASH" ]] || fail "plist hash verification failed"

log "done"
```

保存之后，给它执行权限：

```bash
chmod +x patch_codex_fast_mode.sh
```

接着执行：

```bash
./patch_codex_fast_mode.sh /Applications/Codex.app
```

如果你的 `Codex.app` 不在这个位置，把后面的路径替换成自己的安装路径就行。

这个脚本会一起处理几类东西：

- `fast mode` 相关限制
- 插件 sidebar 的限制
- 插件页面的限制
- 插件详情页的限制
- `goal` 相关限制
- `/goal` 的命令匹配问题

也就是说，它不是只改一个点，而是把 `Fast`、插件和 `Goal` 这条链路一起补全。

### 可选：保留临时工作目录

如果你想保留脚本运行时的临时目录，方便自己继续排查或者比对，也可以这样执行：

```bash
KEEP_WORKDIR=1 ./patch_codex_fast_mode.sh /Applications/Codex.app
```

这样脚本结束后不会自动清理工作目录。

## 打完之后怎么验证

补丁这类东西，最怕的就是“看起来跑完了”，但实际上没有生效。所以一般可以按下面几个方式确认。

### 1. 先看脚本输出

正常情况下，脚本会打印它定位到的 patch target，以及每一块的处理结果。

你通常会看到类似这些信息：

- `fast-mode patch target`
- `plugin sidebar patch target`
- `plugin skills-page patch target`
- `plugin detail patch target`
- `goal patch target`

结果一般会显示成：

- `patched`
- `already-patched`

如果是 `already-patched`，通常说明这版已经打过了，不是报错。

### 2. 打开 App 看插件相关入口

补丁完成后，直接打开 `Codex App`，重点看这几处：

- 插件侧边栏有没有出来
- 插件页能不能正常打开
- 插件详情页能不能正常进入
- 当前登录方式下插件还会不会被直接拦住

如果这些都正常了，插件这一块基本就算通了。

### 3. 直接试 `/goal`

最后找一个非 cloud 的 composer 场景，直接输入：

```text
/goal
```

如果它不再提示 `No commands`，而是能正常匹配出 Goal，那这一块也就基本没问题了。

很多时候页面入口看起来恢复了，但命令层面还是半残。真正能调起来，才算是真的能用。

## 这套东西适合谁

我觉得比较适合下面几类人：

- 平时会在 `Codex App` 里切换不同登录方式或接入方式
- 想尽量把客户端里已有功能用完整
- 对插件和 `Goal` 有明确需求
- 不想每次更新后都手工重新定位和修改资源

如果你当前环境里这些能力本身就都正常出现，那这篇东西对你可能意义不大。

但如果你确实遇到过这些功能缺失、入口不完整或者命令调不出来的问题，这套补丁带来的改善还是挺直接的。

## 为什么这种方式更省事

这类事情最麻烦的地方，从来都不是“第一次怎么改”，而是客户端一更新，资源一替换，之前的修改往往也要重做。

做成脚本之后，后面更新了直接重新打一遍就行，至少不用每次都重新手工定位。尤其这次处理的不是单独一个开关，而是 `Fast`、插件和 `Goal` 一整套相关能力。脚本化之后，维护成本会低很多。

## 最后

这篇主要是做一个使用层面的分享。

如果你也正好遇到 `Codex App` 里这些功能缺失的问题，可以直接照着上面的步骤建一个脚本跑一遍。对于只是想把功能尽量补齐、并不想反复折腾细节的人来说，这已经是一种很省事的做法了。
