const FIRST = [
  "Maya",
  "Jordan",
  "Alicia",
  "Devon",
  "Priya",
  "Marcus",
  "Elena",
  "Noah",
  "Harper",
  "Luis",
  "Sofia",
  "Andre",
  "Nina",
  "Cole",
  "Riley",
  "Jonah",
  "Camille",
  "Owen",
  "Grace",
  "Malik",
  "Hannah",
  "Theo",
  "Imani",
  "Ruby",
]

const LAST = [
  "Chen",
  "Brooks",
  "Patel",
  "Nguyen",
  "Carter",
  "Reed",
  "Hughes",
  "Morales",
  "Bennett",
  "Foster",
  "Price",
  "Ward",
  "Coleman",
  "Powell",
  "Long",
  "Bryant",
  "Hayes",
  "Simmons",
  "Perry",
  "Griffin",
  "Diaz",
  "Jenkins",
  "Porter",
  "Howard",
]

export const SIM_PEOPLE = [
  ["Taylor", "Ellis"],
  ["Quinn", "Brooks"],
  ["Avery", "Singh"],
  ["Reese", "Palmer"],
  ["Skyler", "Nguyen"],
  ["Rowan", "Bennett"],
  ["Emery", "Clark"],
  ["Parker", "Diaz"],
  ["Sawyer", "Kim"],
  ["Finley", "Ross"],
  ["Dakota", "Wright"],
  ["Jamie", "Cole"],
] as const

export function demoPhone(index: number) {
  return `(513) 555-${String(100 + index).padStart(4, "0")}`
}

export function demoEmail(firstName: string, lastName: string, suffix = "") {
  const local = `${firstName}.${lastName}${suffix}`.toLowerCase().replace(/[^a-z.]/g, "")
  return `${local}@example.com`
}

export function makePeople(count: number) {
  const used = new Set<string>()
  const people: { firstName: string; lastName: string; email: string; phone: string }[] = []
  let cursor = 0

  while (people.length < count) {
    const firstName = FIRST[cursor % FIRST.length]
    const bucket = Math.floor(cursor / FIRST.length)
    const lastName = LAST[(cursor * 3 + bucket) % LAST.length]
    const email = demoEmail(firstName, lastName)
    if (!used.has(email)) {
      used.add(email)
      people.push({
        firstName,
        lastName,
        email,
        phone: demoPhone(people.length),
      })
    }
    cursor += 1
    if (cursor > 2000) {
      throw new Error("Could not generate unique demo contacts")
    }
  }

  return people
}
