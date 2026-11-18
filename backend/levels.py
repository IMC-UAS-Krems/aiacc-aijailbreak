"""Implementation availability is independent of player completion."""
IMPLEMENTED_LEVELS = frozenset({1})
OPENING = "Welcome to the castle stores. What would you like to know?"


def catalogue():
    return [{"id": number, "name": "The Open Gate" if number == 1 else f"Level {number}",
             "implemented": number in IMPLEMENTED_LEVELS,
             "available": number in IMPLEMENTED_LEVELS} for number in range(1, 6)]
