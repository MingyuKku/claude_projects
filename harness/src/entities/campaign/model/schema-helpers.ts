import { z } from "zod";

// 서버가 null인 값을 생략해 보낼 수도 있어(Swagger는 필수 여부를 알려 주지 않음) 비어 있는 값은 null·빈 배열·false로 채움.

export function nullable<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform((value) => value ?? null);
}

export function list<T extends z.ZodType>(schema: T) {
  return z
    .array(schema)
    .nullish()
    .transform((value) => value ?? []);
}

export function flag() {
  return z
    .boolean()
    .nullish()
    .transform((value) => value ?? false);
}
