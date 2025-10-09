import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SPECIAL_ROUTES } from "@/lib/routes.config";
import { Map, Coins, Heart, Calendar } from "lucide-react";
import { NavigationButton } from "@/components/NavigationButton";

export const metadata: Metadata = {
  title: "首页 - Xie & Feng Wedding",
  description: "欢迎来到我们的婚礼探索项目",
};

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 欢迎卡片 */}
      <Card className="relative overflow-hidden border-pink-300/50 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-pink-950/20">
        {/* 心形背景装饰 */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-6 right-8 text-pink-400 text-7xl">💕</div>
          <div className="absolute bottom-8 left-10 text-rose-400 text-6xl">❤️</div>
          <div className="absolute top-1/3 left-1/3 text-pink-400 text-5xl">💖</div>
          <div className="absolute bottom-1/4 right-1/4 text-rose-400 text-4xl">💗</div>
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-rose-900 dark:text-rose-100">
            <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" />
            欢迎回来！
          </CardTitle>
          <CardDescription className="text-rose-800/80 dark:text-rose-200/70">您已成功登录</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-rose-800/70 dark:text-rose-200/60">
            在这里您可以查看活动安排、了解活动信息以及查看新人推荐的本地美食。
          </p>
        </CardContent>
      </Card>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-purple-300/50 bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 dark:from-purple-950/20 dark:via-violet-950/20 dark:to-purple-950/20">
          {/* 日历/时间背景装饰 */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-4 right-4 text-purple-400 text-7xl">📅</div>
            <div className="absolute bottom-6 left-6 text-violet-400 text-6xl">⏰</div>
            <div className="absolute top-1/2 right-1/4 text-purple-400 text-5xl">🕐</div>
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              活动安排
            </CardTitle>
            <CardDescription className="text-purple-800/80 dark:text-purple-200/70">
              查看婚礼的活动时间表
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <NavigationButton 
              href={SPECIAL_ROUTES.TIMELINE}
              variant="outline" 
              className="w-full border-purple-400/50 bg-purple-100/50 hover:bg-purple-200/70 text-purple-900 hover:text-purple-950 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-100 dark:border-purple-600/50"
            >
              查看安排
            </NavigationButton>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-amber-300/50 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-amber-950/20">
          {/* 金币背景装饰 */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-4 right-4 text-amber-400 text-8xl">💰</div>
            <div className="absolute bottom-6 left-6 text-amber-400 text-6xl">🪙</div>
            <div className="absolute top-1/2 left-1/4 text-amber-400 text-4xl">💰</div>
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              游戏币兑换礼物汇率
            </CardTitle>
            <CardDescription className="text-amber-800/80 dark:text-amber-200/70">
              游园会过程中赢取的游戏币可以兑换礼品，也可以用于最后的礼品拍卖，这里展示实时的波动汇率。
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <NavigationButton 
              href={SPECIAL_ROUTES.EXCHANGE_RATE}
              variant="outline" 
              className="w-full border-amber-400/50 bg-amber-100/50 hover:bg-amber-200/70 text-amber-900 hover:text-amber-950 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-100 dark:border-amber-600/50"
            >
              查看当前游戏币汇率
            </NavigationButton>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-emerald-300/50 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20">
          {/* 地图探索背景装饰 */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-4 right-4 text-emerald-400 text-7xl">🗺️</div>
            <div className="absolute bottom-6 left-6 text-teal-400 text-6xl">🧭</div>
            <div className="absolute top-1/3 left-1/3 text-emerald-400 text-5xl">📍</div>
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <Map className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              地图探索
            </CardTitle>
            <CardDescription className="text-emerald-800/80 dark:text-emerald-200/70">
              探索活动地点和周边景点
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <NavigationButton 
              href={SPECIAL_ROUTES.MAP}
              variant="default" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white"
            >
              开始探索
            </NavigationButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
