import asyncio, sys, shutil
sys.path.insert(0, 'd:/WebAgent')
from backend.services.project_manager import create_project, get_project_path

async def main():
    print("Testing project creation (should be fast copy)...")
    result = await create_project("test landing page")
    print("Result:", result)
    
    if result.get("success"):
        # Clean up test project
        p = get_project_path(result["project_name"])
        shutil.rmtree(str(p), ignore_errors=True)
        print("✅ Project created and cleaned up successfully!")
    else:
        print("❌ Failed:", result.get("error"))

asyncio.run(main())
