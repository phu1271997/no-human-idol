# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

class Contract(gl.Contract):
    counter: u256
    notes: TreeMap[str, str]

    def __init__(self):
        # Scalar assignments only.TreeMap and DynArray are initialized automatically
        # by GenVM. Reassigning them here throws an AssertionError.
        self.counter = u256(0)

    @gl.public.write
    def bump(self) -> None:
        self.counter = u256(self.counter + 1)

    @gl.public.write
    def put(self, k: str, v: str) -> None:
        self.notes[k] = v

    @gl.public.view
    def get(self, k: str) -> str:
        return self.notes[k]
