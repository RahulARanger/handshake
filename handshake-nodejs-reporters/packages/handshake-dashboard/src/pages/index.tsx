import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/RUNS');
    }, [router]);

    return <></>;
}
