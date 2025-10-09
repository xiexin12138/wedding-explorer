"use client";

import { useEffect, useState } from "react";
import { getDictionaryValueByKey } from "@/features/dictionary";

export function WeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState("- 天 - 小时 - 分钟 - 秒");
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // 从字典读取开始日期
  useEffect(() => {
    const fetchWeddingDate = async () => {
      try {
        setLoading(true);
        const beginDate = await getDictionaryValueByKey("beginDate");
        
        if (beginDate) {
          // 解析日期：支持时间戳（数字字符串）和日期字符串
          let date: Date;
          
          // 尝试作为时间戳解析（字典中存储的是 NUMBER 类型）
          const timestamp = Number(beginDate);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            // 如果不是数字，尝试作为日期字符串解析
            date = new Date(beginDate);
          }
          
          // 验证日期是否有效
          if (!isNaN(date.getTime())) {
            setWeddingDate(date);
          } else {
            // 如果日期格式不正确，使用默认日期
            console.warn("字典中的 beginDate 格式不正确，使用默认日期");
            setWeddingDate(new Date("2025-10-25 00:00"));
          }
        } else {
          // 如果字典中没有配置，使用默认日期
          console.warn("字典中未配置 beginDate，使用默认日期");
          setWeddingDate(new Date("2025-10-25 00:00"));
        }
      } catch (error) {
        console.error("获取婚礼日期失败:", error);
        // 出错时使用默认日期
        setWeddingDate(new Date("2025-10-25 00:00"));
      } finally {
        setLoading(false);
      }
    };

    fetchWeddingDate();
  }, []);

  // 计算倒计时的定时器
  useEffect(() => {
    if (!weddingDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("婚礼就在今天！🎉");
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
        距离婚礼当天还有
      </div>
      <div className="text-2xl font-bold text-primary">
        {loading ? "加载中..." : timeLeft}
      </div>
    </div>
  );
}
