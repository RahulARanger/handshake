import asyncio


async def sample_await():
    await asyncio.sleep(3 * 1e3)
    print("WAITED for 3 seconds")
