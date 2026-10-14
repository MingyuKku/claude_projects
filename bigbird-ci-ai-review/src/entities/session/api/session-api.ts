import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { serverApi } from "@/shared/api";

import { transformSessionToViewModel } from "../lib/transform-session";
import { formLoginResultSchema, sessionSchema } from "../model/schema";

import type { FormLoginResult } from "../model/schema";

async function fetchSession(pathname: string) {
  const response = await serverApi.get("/sec", {
    headers: { "X-Path": pathname },
  });
  return transformSessionToViewModel(sessionSchema.parse(response));
}

/**
 * `GET /sec` is asked on every mount and never served from cache: permissions can
 * change on the server, and a stale answer would leave a user who lost access on
 * screen. The path is part of the key because the server authorizes per `X-Path`.
 */
export function useSession(pathname: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["session", pathname],
    () => fetchSession(pathname),
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
      shouldRetryOnError: false,
    },
  );
  return {
    session: data,
    isLoading,
    isError: Boolean(error),
    error: error as unknown,
    mutate,
  };
}

/**
 * The Bigbird backend only accepts multipart/form-data here; JSON gets a 400.
 */
export async function formLogin(
  username: string,
  password: string,
): Promise<FormLoginResult> {
  const body = new FormData();
  body.append("username", username);
  body.append("password", password);
  const response = await serverApi.post("/login", body);
  return formLoginResultSchema.parse(response);
}

interface FormLoginArgs {
  username: string;
  password: string;
}

export function useFormLogin() {
  const { trigger, isMutating } = useSWRMutation(
    ["login"],
    (_key, { arg }: { arg: FormLoginArgs }) =>
      formLogin(arg.username, arg.password),
  );
  return { trigger, isMutating };
}
