declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getWeekInChinese(): string;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
  }

  export class Lunar {
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayNaYin(): string;
    getDayChongShengXiao(): string;
    getDaySha(): string;
    getDayChongDesc(): string;
    toString(): string;
  }
}
