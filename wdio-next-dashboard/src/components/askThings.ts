import { type DetailedTestResult, type SWRResponse } from "@/types/appConfig";
import type TestResults from "@/types/appConfig";
import useSWRImmutable from "swr/immutable";

async function ensure(url: string, response: Response): Promise<void> {
    if (response.ok) return;

    let resp: { failed: false | string };
    try {
        resp = await response.json();
    } catch (error) {
        throw new Error(
            `Failed to request url: ${url} because, ${response.statusText}`
        );
    }
    if (resp.failed !== false) throw new Error(resp.failed);
    throw new Error(
        `Unknown Error, please note the steps and let me know || ${response.statusText} - ${url}`
    );
}

export async function askButRead<ExpectedResponse>(
    url: string
): Promise<ExpectedResponse> {
    return await fetch(url).then(async function (response) {
        await ensure(url, response);
        return await response.json();
    });
}

export function AskStaticConfig(): SWRResponse<TestResults> {
    return useSWRImmutable(
        "/TestResults/init.json",
        async (url: string) => await askButRead(url)
    );
}

export function AskTestResult(
    fileName: string
): SWRResponse<DetailedTestResult> {
    return useSWRImmutable(
        fileName,
        async (fileDate: string) =>
            await askButRead(`/TestResults/${fileDate}/init.json`)
    );
}
