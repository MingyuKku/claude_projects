import {
  isFeeVisible,
  parseAmount,
  parseFeeRate,
  splitGreeting,
  toProposalValues,
} from "./proposal-form";

const GROUP_BUY = {
  campaignIdx: 1,
  name: "공구",
  typeName: "공구형",
  isGroupBuy: true,
};
const BRAND = {
  campaignIdx: 2,
  name: "브랜드",
  typeName: "브랜드형",
  isGroupBuy: false,
};

it("숫자만 남기고 0은 빈 값으로 본다", () => {
  expect(parseAmount("250,000")).toBe(250_000);
  expect(parseAmount("0")).toBeNull();
  expect(parseAmount("a")).toBeNull();
  expect(parseFeeRate("20%")).toBe(20);
  expect(parseFeeRate("999")).toBe(100);
});

it("공구형은 수수료가 있어야 하고 브랜드형은 수수료를 보내지 않는다", () => {
  expect(
    toProposalValues({ campaign: GROUP_BUY, amount: 10, feeRate: null }),
  ).toBeNull();
  expect(
    toProposalValues({ campaign: GROUP_BUY, amount: 10, feeRate: 20 }),
  ).toEqual({ campaignIdx: 1, amount: 10, groupBuyFeeRate: 20 });
  expect(
    toProposalValues({ campaign: BRAND, amount: 10, feeRate: 20 }),
  ).toEqual({ campaignIdx: 2, amount: 10 });
  expect(
    toProposalValues({ campaign: null, amount: 10, feeRate: 20 }),
  ).toBeNull();
});

it("수수료 칸은 브랜드형을 골랐을 때만 숨긴다", () => {
  const form = { amount: null, feeRate: null };
  expect(isFeeVisible({ ...form, campaign: null })).toBe(true);
  expect(isFeeVisible({ ...form, campaign: BRAND })).toBe(false);
});

it("인사말에서 처음 나오는 닉네임만 나눈다", () => {
  expect(splitGreeting("안녕 하루 님 하루", "하루")).toEqual({
    before: "안녕 ",
    after: " 님 하루",
  });
  expect(splitGreeting("안녕", "하루")).toBeNull();
});
