# HTML 보고서 만들기

보고서는 로컬 전용입니다(`.claude/figma-cache/`는 `.gitignore`). 외부에 올리지 않습니다(Artifact 발행은 사용자가 요청할 때만).

## 폴더 구성

`.claude/figma-cache/qa/<페이지>-<YYYY-MM-DD>/`. 안의 파일은 `workflow.md` "폴더"를 따릅니다. `index.html`은 `report-template.html` 복사본이라 수정하지 않습니다.

## 이전 보고서 정리

폴더는 실행할 때마다 쌓이고 자동으로 지워지지 않으므로, **만들기 전에** 같은 페이지의 이전 보고서를 확인합니다.

1. `ls -d .claude/figma-cache/qa/<페이지>-*`로 이전 폴더를 찾고, 각 `data.js`의 `date`·`branch`·`commit`·화면 수를 읽어 목록으로 보여 줍니다.
2. 이전 폴더가 2개 이상이면 **가장 최근 1개만 남기고 나머지를 지울지** 사용자에게 묻습니다(비교용으로 최근 1개는 남김). 승인받은 폴더만 `rm -rf`로 지우고, 지우기 전에 폴더 이름과 안의 화면 수를 다시 보여 줍니다. 사용자가 허락하지 않으면 지우지 않습니다.
3. 오늘 날짜의 같은 페이지 폴더가 이미 있으면 **이어쓰기(기존 `data.js`에 화면 추가)·덮어쓰기·새 폴더(`-2` 접미사)** 중 하나를 사용자에게 묻습니다. 임의로 덮어쓰지 않습니다.
4. 정리 결과(지운 폴더·남긴 폴더)를 대화창에 한 줄로 알립니다.

## 만들기

보고서 폴더·이미지·`data.js`는 `scripts/design/qa.mjs`의 `prepare`(시안 이미지)와 `report`(구현 캡처 복사, `index.html`·`data.js` 생성)가 만듭니다. 에이전트는 `screens.json`과 `verdicts.json`만 씁니다(`workflow.md`). `data.js`를 직접 고치지 않습니다. 고칠 것이 있으면 `verdicts.json`을 고치고 `report`를 다시 실행합니다.

`data.js` 형식(템플릿이 읽는 형식, 참고용):

```js
globalThis.QA_REPORT = {
  title, date, branch, commit, figmaFileKey, figmaVersion, summary: ['...'],
  screens: [
    {
      title, device, width, url, figmaNode,
      images: { figma: 'img/01-figma.png', figmaWidth: 1440, impl: 'img/01-impl.png', implWidth: 1440 },
      diffs: [{ n, element, prop, design, impl, severity, note, box: {x,y,w,h}, figmaBox: {x,y,w,h} }],
      notes: { mismatch: ['...'], check: ['...'] },
    },
    { title, device, width, status: 'skipped', skipReason: '...' },
  ],
};
```

`box`는 구현 캡처(viewport) 기준, `figmaBox`는 시안 프레임 기준 좌표입니다.

## 열기

다 쓰면 `open "$D/index.html"`로 사용자 브라우저에서 엽니다(브라우저 MCP로 열지 않습니다).
