/// <reference types="vite/client" />

// Type declaration for lunar-javascript (no @types package available)
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
    static fromYmd(year: number, month: number, day: number): Solar
    getYear(): number
    getMonth(): number
    getDay(): number
    getLunar(): Lunar
    next(days: number): Solar
  }

  export class Lunar {
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar
    static fromYmd(year: number, month: number, day: number): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    getSolar(): Solar
    getYearInGanZhi(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getYearInChinese(): string
    toString(): string
    toFullString(): string
  }
}
