# Scheduler Service

## Necessity

Server's primary job is only to listen to your test results. and does minimal changes in the payload received. in order to transform the data received we would need to run a command or set of scripts that patches the results.

With the Scheduler Service, we would be scheduling the asynchronous tasks and processing them concurrently.

* Schedule Tasks
* Most of the Tasks are IO related [DB operations / Exporting files]
* connect with the database through tortoise orm
* Concurrently process the registered tasks
* dynamically add tasks
* cancel tasks
* stop the scheduler when needed
* close the resources after its interrupted or done
* Support TaskGroup - Group where I can execute certain number of tasks concurrently without interruption.

## Solution Suggested

* ApScheduler - Python Scheduler in Python
    * Reason:
        * Does everything when needed (except one - TaskGroup)
        * Lots of Options
* Standard Library - Asyncio
  * Reason:
    * Does everything
    * Subset of options (everything resolves our needs as of now)

## Decision
Standard Library. specifically this would be enough [TaskGroup](https://docs.python.org/3/library/asyncio-task.html#asyncio.TaskGroup) and `asyncio.run()`


## Sample Usage Code

* Simple Example

```python
from asyncio import run, TaskGroup, sleep


async def task_1():
    print("Task 1 Started")
    await sleep(1)
    print("Task 1 Completed")


async def task_2():
    print("Task 2 Started")
    await sleep(1)
    print("Task 2 Completed")


async def main():
    async with TaskGroup() as tg:
        tg.create_task(task_1(), name="Task 1")
        tg.create_task(task_2(), name="Task 2")

    print("Both are done")

try:
    run(main())
except (SystemExit, KeyboardInterrupt):
    print("Interrupted")
```


For Delete Operations:

```python
from shutil import rmtree
from asyncio import gather, run, to_thread
from pathlib import Path
from time import sleep


def remove_sample(folder_name: str):
    print("Deleting ", folder_name)
    rmtree(Path(__file__).parent / folder_name)
    sleep(1)
    print("Done for ", folder_name)


async def main():
    await gather(to_thread(remove_sample, "sample1"), to_thread(remove_sample, "sample2"))
    print("Done")


run(main())
```
## Tasks

We had Endpoints hosted by our server which would listen to your test results. it's job is to start early and listen to your results carefully, note it down with minimal calculations done. and close as soon as possible.
Rest of the things are required to be calculated by the scheduler service. 
