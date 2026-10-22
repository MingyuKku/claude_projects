// 번역 리소스 타입 생성과 검사. 의존성 없이 Node 만으로 동작합니다.
//   node scripts/i18n.mjs          → src/app/i18n/resources.gen.d.ts 생성 (pnpm i18n)
//   node scripts/i18n.mjs --check  → 리소스 검사 (pnpm i18n:check)
// 경로 → namespace 규칙은 src/app/i18n/localePath.ts 와 같게 유지합니다.
import { globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const LANGUAGES = ["ko", "en", "ja", "zh-CN"];
const DEFAULT_LANGUAGE = "ko";
const COMMON_DIR = "src/shared/i18n/locales";
const SLICE_DIR_PATTERN =
  /^src\/(pages|widgets|features|entities)\/([^/]+)\/locales$/;
const OUTPUT = "src/app/i18n/resources.gen.d.ts";

const toPosix = (file) => file.split(path.sep).join("/");

function namespaceOf(dir) {
  if (dir === COMMON_DIR) return "common";
  const match = SLICE_DIR_PATTERN.exec(dir);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

function findLocaleDirs() {
  return globSync("src/**/locales", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      toPosix(path.relative(".", path.join(entry.parentPath, entry.name))),
    )
    .sort();
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

// 리프 문자열의 키 경로를 모읍니다. 문자열·객체가 아닌 값은 오류로 모읍니다.
function collectLeaves(value, prefix, leaves, errors, file) {
  if (typeof value === "string") {
    if (value.trim() === "")
      errors.push(`${file}: "${prefix}" 값이 비어 있습니다.`);
    leaves.add(prefix);
    return;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push(`${file}: "${prefix}" 값은 문자열이나 객체여야 합니다.`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    collectLeaves(
      child,
      prefix ? `${prefix}.${key}` : key,
      leaves,
      errors,
      file,
    );
  }
}

// ko·ja·zh-CN 의 x_other 에 대해 en 은 x_one·x_other 를 모두 둡니다.
function expectedKeys(language, defaultKeys) {
  const keys = new Set(defaultKeys);
  if (language === "en") {
    for (const key of defaultKeys) {
      if (key.endsWith("_other"))
        keys.add(`${key.slice(0, -"_other".length)}_one`);
    }
  }
  return keys;
}

function toIdentifier(namespace) {
  return namespace
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part : part[0].toUpperCase() + part.slice(1),
    )
    .join("");
}

function renderTypes(namespaces) {
  const entries = namespaces
    .map(({ namespace, dir }) => ({
      namespace,
      identifier: toIdentifier(namespace),
      specifier: toPosix(
        path.relative(path.dirname(OUTPUT), `${dir}/${DEFAULT_LANGUAGE}.json`),
      ),
    }))
    .sort((a, b) => a.specifier.localeCompare(b.specifier));
  const imports = entries
    .map((e) => `import type ${e.identifier} from "${e.specifier}";`)
    .join("\n");
  const fields = [...entries]
    .sort((a, b) =>
      a.namespace === "common"
        ? -1
        : b.namespace === "common"
          ? 1
          : a.namespace.localeCompare(b.namespace),
    )
    .map((e) => {
      const key = /^[A-Za-z_$][\w$]*$/.test(e.namespace)
        ? e.namespace
        : `"${e.namespace}"`;
      return `      ${key}: typeof ${e.identifier};`;
    })
    .join("\n");
  return `// pnpm i18n 이 생성하는 파일입니다. 직접 수정하지 않습니다.
// 각 namespace 의 ko.json 을 키 원본으로 삼아 t() 의 키를 타입 검사합니다.
${imports}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
${fields}
    };
  }
}
`;
}

function readOutput() {
  try {
    return readFileSync(OUTPUT, "utf8");
  } catch {
    return undefined;
  }
}

function main() {
  const isCheck = process.argv.includes("--check");
  const errors = [];
  const namespaces = [];

  for (const dir of findLocaleDirs()) {
    const namespace = namespaceOf(dir);
    if (!namespace) {
      errors.push(
        `${dir}: locales 폴더는 ${COMMON_DIR} 또는 src/{pages,widgets,features,entities}/{slice}/locales 에만 둡니다.`,
      );
      continue;
    }

    const files = globSync(`${dir}/*`).map((file) => path.basename(file));
    for (const file of files) {
      if (!LANGUAGES.some((language) => `${language}.json` === file)) {
        errors.push(
          `${dir}/${file}: 지원 언어(${LANGUAGES.join(", ")})의 JSON 파일만 둡니다.`,
        );
      }
    }
    const missing = LANGUAGES.filter(
      (language) => !files.includes(`${language}.json`),
    );
    for (const language of missing)
      errors.push(`${dir}/${language}.json 파일이 없습니다.`);
    if (missing.includes(DEFAULT_LANGUAGE)) continue;
    namespaces.push({ namespace, dir });

    const keysByLanguage = new Map();
    for (const language of LANGUAGES.filter((l) => !missing.includes(l))) {
      const file = `${dir}/${language}.json`;
      const leaves = new Set();
      try {
        collectLeaves(readJson(file), "", leaves, errors, file);
      } catch (error) {
        errors.push(`${file}: JSON 을 읽지 못했습니다 (${error.message}).`);
        continue;
      }
      leaves.delete("");
      keysByLanguage.set(language, leaves);
    }

    const defaultKeys = keysByLanguage.get(DEFAULT_LANGUAGE);
    if (!defaultKeys) continue;
    for (const [language, keys] of keysByLanguage) {
      if (language === DEFAULT_LANGUAGE) continue;
      const expected = expectedKeys(language, defaultKeys);
      const file = `${dir}/${language}.json`;
      for (const key of expected) {
        if (!keys.has(key)) errors.push(`${file}: "${key}" 키가 없습니다.`);
      }
      for (const key of keys) {
        if (!expected.has(key))
          errors.push(`${file}: "${key}" 키가 ko.json 에 없습니다.`);
      }
    }
  }

  const types = renderTypes(namespaces);
  if (isCheck) {
    if (readOutput() !== types) {
      errors.push(`${OUTPUT} 가 최신이 아닙니다. pnpm i18n 을 실행하세요.`);
    }
  } else if (readOutput() !== types) {
    writeFileSync(OUTPUT, types);
    console.log(`${OUTPUT} 를 생성했습니다.`);
  }

  if (errors.length > 0) {
    console.error(`i18n 검사 실패 (${errors.length}건):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  if (isCheck)
    console.log(`i18n 검사 통과 (namespace ${namespaces.length}개).`);
}

main();
