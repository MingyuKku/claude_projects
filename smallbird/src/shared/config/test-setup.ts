import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy*·waitFor의 기본 대기(1초)는 CI 러너에 비해 짧음. 라우트 지연 로딩이 들어가는 테스트는 로컬 0.4초가
// CI에서 3초 넘게 걸려(러너가 약 7배 느림) 단계마다 1초 근처였고, 테스트 파일이 늘어 부하가 커지자 같은 단계에서 계속 실패함.
// vitest의 테스트별 제한(기본 5초)보다 짧게 둬서 진짜 실패는 Testing Library의 읽기 쉬운 오류로 나옴.
// 조건이 만족되면 바로 반환하므로 정상 동작의 테스트 시간은 늘지 않음.
configure({ asyncUtilTimeout: 4000 });
