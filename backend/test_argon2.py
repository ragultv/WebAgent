from passlib.context import CryptContext
try:
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    hash = pwd_context.hash("test")
    print(f"Success: {hash}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

import importlib.util
print(f"argon2-cffi spec: {importlib.util.find_spec('argon2')}")
