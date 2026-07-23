declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
    getWeekInChinese(): string;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getYearZhi(): string;
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearXunKong(): string;
    getMonthXunKong(): string;
    getDayXunKong(): string;
    getTimeXunKong(): string;
    getYearDiShi(): string;
    getMonthDiShi(): string;
    getDayDiShi(): string;
    getTimeDiShi(): string;
    setSect(sect: number): void;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getYearInGanZhiExact(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getDayXunKong(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayNaYin(): string;
    getDayChongShengXiao(): string;
    getDaySha(): string;
    getDayChongDesc(): string;
    getDayTianShenLuck(): string;
    getDayPositionCaiDesc(): string;
    getDayPositionXiDesc(): string;
    getEightChar(): EightChar;
    getTimes(): Array<{
      getZhi: () => string;
      getTianShenLuck: () => string;
    }>;
    toString(): string;
  }

  export class LunarMonth {
    static fromYm(year: number, month: number): LunarMonth;
    getMonth(): number;
    getDayCount(): number;
  }

  export const LunarUtil: {
    SHI_SHEN: Record<string, string>;
    ZHI_HIDE_GAN: Record<string, string[]>;
    NAYIN: Record<string, string>;
    CHANG_SHENG_OFFSET: Record<string, number>;
    getXunKong: (ganzhi: string) => string;
  };
}
