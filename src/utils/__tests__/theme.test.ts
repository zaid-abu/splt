import { hexToRgba, getStringColor } from "@/utils/theme"

describe("hexToRgba", () => {
  it("converts hex to rgba with opacity", () => {
    expect(hexToRgba("#FF0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)")
  })

  it("converts black hex to rgba", () => {
    expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)")
  })

  it("converts white hex to rgba", () => {
    expect(hexToRgba("#FFFFFF", 0.25)).toBe("rgba(255, 255, 255, 0.25)")
  })

  it("handles hex without hash prefix", () => {
    expect(hexToRgba("4CAF82", 0.8)).toBe("rgba(76, 175, 130, 0.8)")
  })

  it("handles zero opacity", () => {
    expect(hexToRgba("#3D2B82", 0)).toBe("rgba(61, 43, 130, 0)")
  })
})

describe("getStringColor", () => {
  it("returns consistent colors for the same input", () => {
    const color1 = getStringColor("Alice")
    const color2 = getStringColor("Alice")
    expect(color1).toBe(color2)
  })

  it("returns different colors for different inputs", () => {
    const color1 = getStringColor("Alice")
    const color2 = getStringColor("Bob")
    expect(color1).not.toBe(color2)
  })

  it("returns a color from THEME_COLORS", () => {
    const validColors = [
      "#3D2B82",
      "#6B4EFF",
      "#F34C5D",
      "#F5A623",
      "#00B894",
      "#0984E3",
      "#6C5CE7",
      "#E84393",
      "#10AC84",
      "#E17055",
    ]
    const color = getStringColor("Charlie")
    expect(validColors).toContain(color)
  })

  it("returns a valid color for an empty string", () => {
    const color = getStringColor("")
    expect(color).toBeTruthy()
    expect(typeof color).toBe("string")
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
