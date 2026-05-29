# GenLayer Studio — 8 Non-Negotiable Rules

These rules are critical for successful deployment and execution of Python-based Intelligent Contracts on GenLayer (targeting v0.2.16):

1. **API Version Headers**:
   The first line of the contract must be exactly `# v0.2.16`, and the second line must contain the `Depends` metadata.
   ```python
   # v0.2.16
   # { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
   from genlayer import *
   ```
   *Missing this line falls back to v0.1.0 and triggers errors such as "Contract Queues not found".*

2. **Storage Collections in Constructor**:
   NEVER reassign or touch `TreeMap()` or `DynArray()` inside `__init__`. The virtual machine (GenVM) automatically initializes them to empty states. Modifying them in constructor throws `AssertionError: Is right the same storage type? TreeMap <- TreeMap`. Only assign scalar fields (e.g. `int`, `str`, `bool`, `Address`) in `__init__`.

3. **No Floats in Public Interface**:
   No `float` data types may appear anywhere in public method signatures. Use `int` or `u256`, scaling fractional amounts (e.g. scale cents by 100).

4. **Allowed Parameter and Return Types**:
   The public method parameters and return types are strictly restricted to:
   - `str`, `bool`, `bytes`
   - `int`, `u8`..`u256`, `i8`..`i256`
   - `Address`
   - `DynArray[T]`, `TreeMap[K,V]`
   
   *FORBIDDEN*: `float`, `list[T]`, `dict[K,V]`, non-instantiated generics, and custom classes.

5. **Strict Storage Typing**:
   Storage fields must use `TreeMap[K,V]` or `DynArray[T]`. NEVER use python native `dict` or `list` for persistent storage fields.

6. **Contract Naming**:
   The main class of the contract file must be named exactly `Contract` and extend `gl.Contract`.

7. **Encapsulate Non-Deterministic Calls**:
   EVERY call to a non-deterministic operation (e.g., `gl.nondet.web.render`, `gl.nondet.web.get`, `gl.nondet.exec_prompt`) MUST be encapsulated inside a leader function executed via `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. Never invoke `gl.nondet.*` inside deterministic contract code.

8. **SDK Imports**:
   Import the SDK ONLY via `from genlayer import *`. Do not use `import genlayer` or `import genlayer as gl` as it overrides the injected runtime environment and leads to `AttributeError`. Standard python imports like `import json` are fully allowed.
