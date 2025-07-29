"use client";

import { useEffect, useState } from "react";
import { getDictionaryValueByKey } from "@/lib/services/dictionary";

export function WeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState("- 天 - 小时 - 分钟 - 秒");
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);  

  // 只在组件初始化时获取一次字典值
  useEffect(() => {
    const loadWeddingDate = async () => {
      try {
        const WEDDING_DATE_KEY = await getDictionaryValueByKey("beginDate");
        setWeddingDate(new Date(WEDDING_DATE_KEY));
      } catch (error) {
        console.error("获取婚礼日期失败:", error);
        setTimeLeft("无法获取活动日期");
      }
    };

    loadWeddingDate();
  }, []);

  // 计算倒计时的定时器
  useEffect(() => {
    if (!weddingDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("活动已经开始啦！🎉");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`);
    };

    // 初始计算
    calculateTimeLeft();

    // 每秒更新一次
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  return (
    <div className="text-center space-y-2">
      <div className="text-lg font-medium text-muted-foreground">
        距离活动还有
      </div>
      <div className="text-2xl font-bold text-primary">{timeLeft}</div>
    </div>
  );
}
