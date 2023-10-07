// like helpers but gives links w.r.t to our application
// unlike helpers which aim to give links w.r.t graspit server

export default function runLink(testID: string): string {
    return `/RUNS/${testID}`;
}
