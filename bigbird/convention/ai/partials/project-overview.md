## 프로젝트 개요

`bigbird`는 React 19 + TypeScript 웹 애플리케이션입니다. 설계의 핵심 목표는 **한 기능의 변경이 다른 기능으로 번지지 않게 하는 것**이며, 이를 위해 Feature-Sliced Design(FSD)으로 기능 단위를 격리합니다.
디자인의 원본은 Figma, API 계약의 원본은 OpenAPI 명세입니다.
서비스의 목적·사용자·기능 범위·용어는 `docs/prd.md`가 기준이며, 기능 단위 상세는 `specs/<feature>.md`에 있습니다. 작업 전에 읽고, PRD에 "미정"인 항목은 추측하지 말고 질문합니다.
