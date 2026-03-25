import asyncio
import sys
sys.path.insert(0, 'd:/WebAgent')
from backend.services.project_manager import ensure_template

async def main():
    result = await ensure_template()
    print(result)

asyncio.run(main())
