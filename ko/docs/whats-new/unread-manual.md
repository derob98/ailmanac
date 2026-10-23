# Claude는 Claude Code 문서의 68%를 본 적이 없습니다

> Source: https://derob98.github.io/ailmanac/ko/docs/whats-new/unread-manual · AILmanac (CC BY 4.0) · last verified 2026-10-15

공식 Claude Code 문서 15개월 치를 한 주씩 되감아 보았습니다. 오늘 문서 내용의 68%는 현재 모든 Claude 모델의 학습 컷오프인 2026년 6월 이후에 쓰였습니다. 각 모델이 놓친 내용과, 이를 알려 주는 플러그인을 소개합니다.

import {UnreadHeadline, ModelBars, LearnedSlider, CohortChart, SurvivalChart, NewIdentifiers} from '@site/src/components/DocsDecay';

<VerifyNote lastVerified="2026-10-15" source="https://platform.claude.com/docs/en/about-claude/models/overview">
학습 컷오프는 Claude Platform 문서의 각 모델 페이지에서 가져왔습니다. Claude Code 문서의 이력은 공식 페이지를 하루에 여러 번 복사하는 커뮤니티 미러에서 가져왔습니다. 수치는 2026년 10월 15일 기준 스냅샷이며, 이를 만든 스크립트가 아래에 링크되어 있어 누구나 다시 실행할 수 있습니다.
</VerifyNote>

모든 Claude 모델은 학습 컷오프 시점의 문서로 Claude Code를 배웠습니다. 그 뒤에도 문서는 계속 바뀌었습니다. 우리는 그 이력을 한 주씩 되감아 둘이 얼마나 벌어졌는지 측정했습니다.

<UnreadHeadline />

최신 모델인 Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5의 신뢰할 수 있는 지식 컷오프는 2026년 6월입니다. 6월 말부터 10월 15일 사이에 문서는 107페이지에서 164페이지로 늘었고, 지금 문서 내용의 대부분은 이 3개월 반 동안 쓰였습니다. 사실이 아니라 정확한 문구 기준으로 더 엄격하게 세면 비율은 72%로 올라갑니다. 코드 예제를 빼면 70%입니다. 어떻게 세든 Claude는 자신의 매뉴얼 대부분을 본 적이 없습니다.

## 각 모델이 본 적 없는 것

컷오프가 오래될수록 모델이 읽었을 수 있는 오늘의 문서는 줄어듭니다. 이 모델들은 모두 Claude API로 여전히 사용할 수 있습니다.

<ModelBars />

컷오프가 2025년 2월인 Claude Haiku 4.5는 거의 모든 것보다 앞섭니다. Claude Code가 그달에 리서치 프리뷰로 출시되었고, 오늘 문서의 거의 전부가 그 이후에 나왔습니다.

## Claude Code를 배운 주를 고르세요

같은 계산이 사람에게도 적용됩니다. 슬라이더를 문서를 읽은 주, 또는 따라 하고 있는 튜토리얼의 날짜로 옮겨 보세요.

<LearnedSlider />

## 문서는 늘어나기만 하는 것이 아니라 다시 쓰입니다

격차의 대부분은 성장으로 설명되지만 전부는 아닙니다. 페이지도 다시 쓰입니다. 아래 각 띠는 한 분기에 쓰인 텍스트이며, 문장이 삭제되거나 바뀔수록 띠가 가늘어집니다.

<CohortChart />

2025년 7월에 문서는 29페이지였습니다. 지금은 164페이지이고, 문장과 코드 줄은 21배입니다. 2025년 7월 시점의 문서 중 지금도 남아 있는 것은 30.5%이며, 나머지는 삭제되었거나 숫자, 플래그, 이름이 달라지는 방식으로 다시 쓰였습니다. 최신 모델이 본 2026년 6월 문서조차 넉 달이 채 안 되어 사실의 26.9%를 잃었습니다.

## 문장은 얼마나 오래 가는가

모든 문장을 나타난 주부터 사라진 주까지 따라가 보면, 절반은 196일 안에 사라지거나 문구가 바뀝니다. 숫자, 플래그, 경로, 이름이 바뀌는 경우에만 바뀐 것으로 치면, 사실의 절반이 사라지는 데 266일, 약 아홉 달이 걸립니다.

<SurvivalChart />

## 여러분의 모델이 들어본 적 없는 것

오늘의 레퍼런스 표에는 있지만 모델의 컷오프 시점에는 없던 식별자들입니다. CLI 플래그, 슬래시 명령, hook 이벤트, 환경 변수가 해당합니다. 이 중 하나를 Claude에게 물으면 추측할 수밖에 없습니다.

<NewIdentifiers />

"문서화된 시점"이 "출시된 시점"은 아닙니다. 이 가운데 일부는 더 일찍 존재했고 나중에야 문서에 올랐습니다. 어느 쪽이든 모델에게는 배울 페이지가 없었습니다.

## Claude에게 목록을 주세요

[since-cutoff 플러그인](https://github.com/derob98/ailmanac/tree/main/plugins/since-cutoff)은 이 목록을 Claude 앞에 놓아 줍니다. 세션이 시작되면 hook이 어떤 모델이 실행 중인지 읽고, 그 모델의 컷오프 이후에 문서화된 플래그, 명령, hook 이벤트에 대한 짧은 메모를 컨텍스트에 추가합니다. 기억에 의존하거나 기능이 없다고 말하기 전에 문서를 확인하라는 지시도 함께 들어갑니다.

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install since-cutoff@ailmanac
```

hook은 몇 줄의 POSIX 셸입니다. Node도 네트워크도 필요 없고, 세션당 약 400~750 토큰이 듭니다. 헤드리스 `-p` 테스트처럼 Claude Code가 hook에 모델을 전달하지 않으면, 메모에는 2026년 6월 이후 바뀐 내용이 나열되며 이는 모든 Claude 모델에 해당합니다. 그 테스트에서 세션은 메모를 받았고, Claude는 그것을 한 글자도 틀리지 않고 그대로 인용했습니다.

## 이것을 어떻게 활용할까

- **Claude Code에 대한 Claude의 기억을 믿지 마세요.** 플래그, 설정, hook, 명령은 페이지를 읽게 하세요. Claude Code에는 자기 자신에 대한 질문에 답하는 가이드 에이전트가 있고, 문서는 [code.claude.com/docs/llms.txt](https://code.claude.com/docs/llms.txt)에 인덱스를 공개합니다.
- **튜토리얼의 날짜를 확인하세요.** 여섯 달 전 가이드는 사실의 3분의 1 이상을 잃었습니다. 그보다 오래된 것은 명령을 복사하기 전에 문서와 대조하세요.
- **확인 날짜를 밝히는 페이지를 우선하세요.** 이 사이트의 모든 페이지에는 마지막으로 검증한 날짜가 있습니다. [최신성 대시보드](/docs/whats-new/freshness)에 모두 나열되어 있고, [Deprecation & Migration Watch](/docs/whats-new/deprecations)는 제거된 항목을 추적합니다.

## 측정 방법

- **이력.** [web3dev1337/claude-code-docs](https://github.com/web3dev1337/claude-code-docs)는 전체 동기화 이력을 보존한 유명한 문서 미러의 포크로, 2025년 7월부터 2026년 10월까지 3,604번의 동기화가 있습니다. 매주 마지막 동기화를 취해 모두 67개의 스냅샷을 사용했습니다.
- **범위.** 이력을 기록하는 것이 목적인 변경 로그와 주간 다이제스트, 그리고 2026년에 다른 문서 사이트에서 옮겨 와 그대로 두면 새것으로 집계될 Agent SDK 페이지를 제외한 모든 Claude Code 페이지.
- **단위.** 각 페이지를 링크와 마크업을 제거한 문장, 표의 행, 코드 줄로 나눕니다. 배너나 일반적인 코드 줄처럼 다섯 개 이상의 페이지에 동시에 나타나는 줄은 제외했습니다. 그 결과 추적할 고유 단위가 90,674개 남았습니다.
- **소멸.** 단위는 연속한 두 주간 스냅샷에서, 또는 최신 스냅샷에서 빠지면 사라진 것으로 봅니다. 한 번의 동기화에 실패한 페이지는 집계에 넣지 않습니다.
- **사실.** 같은 주에 삭제된 문장을 대체하는 새 문장은, 단어의 60% 이상이 일치하고 모든 숫자, 플래그, 경로, 식별자가 동일하면 같은 사실로 취급합니다. 이렇게 7,965건의 문구 변경을 연결했습니다.
- **컷오프.** 각 모델은 컷오프 달의 마지막 날 이전의 마지막 주간 스냅샷과 비교하며, 이는 가장 후한 해석입니다. 2025년 7월 이전의 컷오프는 첫 스냅샷을 쓰는데, 이 스냅샷에는 그 모델들이 볼 수 있었던 것보다 이미 더 많은 내용이 들어 있으므로 그 비율은 하한입니다.
- **생존.** 첫 스냅샷 이후에 생긴 모든 단위에 대한 Kaplan–Meier 추정이며, 오늘까지 남아 있는 단위는 중도절단으로 처리합니다.

이 미러는 비공식입니다. 페이지를 놓치거나 깨뜨렸다면 수치도 그 영향을 받습니다. 컷오프 주간에 동기화 한 번 동안 사라진 페이지가 있는지 확인했지만 찾지 못했습니다. 이 분석이 비교하는 것은 텍스트이지 제품 동작이 아닙니다.

## 재현하기

스크립트와 출력은 이 사이트의 저장소에 있습니다. [scripts/research/docs-decay.mjs](https://github.com/derob98/ailmanac/blob/main/scripts/research/docs-decay.mjs)와 [data/research/claude-code-docs-decay.json](https://github.com/derob98/ailmanac/blob/main/data/research/claude-code-docs-decay.json)입니다. Node와 git이 필요하며 약 15초 만에 실행됩니다.

```bash
git clone https://github.com/web3dev1337/claude-code-docs
git clone https://github.com/derob98/ailmanac
node ailmanac/scripts/research/docs-decay.mjs claude-code-docs
```
