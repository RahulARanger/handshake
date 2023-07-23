import { readFileSync } from "fs";
import TestResults, { DetailedTestResult } from "@/types/appConfig";
import { join } from "path";

export function publicDir(): string {
    return join(process.cwd(), "public");
}

export default function staticConfig(): TestResults {
    return JSON.parse(
        readFileSync(join(publicDir(), "TestResults", "init.json"), "utf-8")
    );
}

export function readTestCase(dateID: string): DetailedTestResult {
    return JSON.parse(
        readFileSync(
            join(publicDir(), "TestResults", dateID, "init.json"),
            "utf-8"
        )
    );
}
