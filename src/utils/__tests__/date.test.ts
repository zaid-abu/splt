import { getGreeting, formatActivityDate } from "@/utils/date"

describe("getGreeting", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns "Good morning" before noon', () => {
    jest.setSystemTime(new Date("2025-06-15T09:00:00"))
    expect(getGreeting()).toBe("Good morning")
  })

  it('returns "Good afternoon" between noon and 18:00', () => {
    jest.setSystemTime(new Date("2025-06-15T14:00:00"))
    expect(getGreeting()).toBe("Good afternoon")
  })

  it('returns "Good evening" after 18:00', () => {
    jest.setSystemTime(new Date("2025-06-15T20:00:00"))
    expect(getGreeting()).toBe("Good evening")
  })

  it("returns greeting at midnight boundary", () => {
    jest.setSystemTime(new Date("2025-06-15T00:00:00"))
    expect(getGreeting()).toBe("Good morning")
  })

  it("returns greeting at noon boundary", () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    expect(getGreeting()).toBe("Good afternoon")
  })

  it("returns greeting at 18:00 boundary", () => {
    jest.setSystemTime(new Date("2025-06-15T18:00:00"))
    expect(getGreeting()).toBe("Good evening")
  })
})

describe("formatActivityDate", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns "Today" for today\'s date', () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    const today = new Date("2025-06-15T08:30:00")
    expect(formatActivityDate(today)).toBe("Today")
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    const yesterday = new Date("2025-06-14T08:30:00")
    expect(formatActivityDate(yesterday)).toBe("Yesterday")
  })

  it('returns "X days ago" for dates 2-6 days ago', () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    const threeDaysAgo = new Date("2025-06-12T08:30:00")
    expect(formatActivityDate(threeDaysAgo)).toBe("3 days ago")
  })

  it("returns formatted date for dates 7+ days ago", () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    const oldDate = new Date("2025-05-01T08:30:00")
    expect(formatActivityDate(oldDate)).toBe("1 May")
  })

  it("accepts a date string and returns correct output", () => {
    jest.setSystemTime(new Date("2025-06-15T12:00:00"))
    expect(formatActivityDate("2025-06-15T08:30:00")).toBe("Today")
  })
})
