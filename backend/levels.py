"""Implementation availability is independent of player completion."""
IMPLEMENTED_LEVELS = frozenset({1, 2})
OPENING = "Welcome to the castle stores. What would you like to know?"
OPENING_LEVEL2 = "The inner gate is guarded. How can I help you today?"

LEVEL_NAMES = {
    1: "The Open Gate",
    2: "The Guarded Gate",
    3: "Level 3",
    4: "Level 4",
    5: "Level 5",
}

OPENINGS = {
    1: OPENING,
    2: OPENING_LEVEL2,
}


def catalogue(unlocked=None):
    if unlocked is None:
        unlocked = {1}
    return [
        {
            "id": number,
            "name": LEVEL_NAMES.get(number, f"Level {number}"),
            "implemented": number in IMPLEMENTED_LEVELS,
            "available": number in IMPLEMENTED_LEVELS and number in unlocked,
        }
        for number in range(1, 6)
    ]
