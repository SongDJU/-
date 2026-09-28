# EASYCHEM 대모험 — 도트 게임 스타일 회사 소개 영상 (30초 · 1920×1080)

- `easychem_intro.mp4` — 완성 영상 (H.264 + AAC, 30fps, 8비트 칩튠 BGM·효과음 포함)
- `easychem_intro.html` — 영상 원본. 로컬 서버로 열고 화면을 클릭하면 사운드와 함께 재생됩니다.
- `timeline.js` — 장면 전환·효과음·화면 흔들림 시각 (영상과 사운드가 같이 참조)
- `music.py` — 칩튠 BGM/효과음 합성 → `assets/bgm.wav`
- `render.js` — HTML을 프레임 단위로 캡처해 MP4로 인코딩

## 구성
| 시간 | 장면 | 내용 |
|---|---|---|
| 0–3.5s | 타이틀 화면 | CI 로고 낙하, "정밀화학소재 대모험", PRESS START |
| 3.5–5.5s | WORLD 1-1 | 충북 청주 · 창립 25년차(SINCE 2001) · 미션 제시 |
| 5.5–11s | 횡스크롤 스테이지 | ? 블록에서 단분산 나노입자 · 기능성 PP 접착제 획득 = 수입 소재 국산화 |
| 11–17.5s | ITEM BOOK | 사업 분야 4종: 특수접착제, 나노입자, 인조대리석(2012), 라미네이팅 필름(2015) |
| 17.5–23s | 보스전 | "기술 장벽"을 CMP 경면 연마제 · 포름알데히드 제거제로 격파 → INNO-BIZ 인증 업적 |
| 23–26.5s | 월드맵 | 청주 본사 → 괴산 공장 → GLOBAL |
| 26.5–30s | STAGE CLEAR | 불꽃놀이, 글로벌 TOP TIER 비전, 홈페이지·주소 |

## 수정 및 다시 렌더링
1. 문구·장면은 `easychem_intro.html`, 타이밍은 `timeline.js`에서 수정합니다.
2. 미리보기 프레임: `node video/render.js --preview 3 15 29`
3. 전체 렌더링: `node video/render.js` (Playwright + ffmpeg + python3/numpy 필요, `FFMPEG=/path/to/ffmpeg`로 경로 지정 가능)

폰트: [Galmuri](https://github.com/quiple/galmuri) (SIL OFL 1.1, `assets/fonts/Galmuri-OFL.md`)
